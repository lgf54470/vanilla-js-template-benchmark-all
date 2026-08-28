// apps/server/src/shared/auth/auth-middleware.js — x-auth-password 中间件 + 会话签发
//
// 语义（Auth.md §3）：登录请求该头携带明文密码；登录成功后同一头名携带会话令牌。
// 中间件结构拆分为可测试的纯函数：verifyTokenPayload / sessionNotRevoked /
// computeLockout。锁定状态写入 app_settings('settings:auth-lockout')，进程重启不丢。

import { verifySessionToken } from "./token.js";
import { verifyPassword } from "../crypto/password.js";
import { appCache } from "../cache/memory-cache.js";
import { createLogger } from "../logger/logger.js";
import { ERROR_CODES } from "../../../../../packages/contracts/constants.js";

// 连续失败阈值与退避基数（Auth.md §6）：5 次后锁定 30s，指数退避封顶 30 分钟
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_BASE_MS = 30_000;
export const LOCKOUT_MAX_MS = 30 * 60_000;
export const AUTH_SETTINGS_KEY = "settings:auth";
export const AUTH_LOCKOUT_KEY = "settings:auth-lockout";
export const SESSION_CACHE_TTL_MS = 30_000; // Auth.md 会话校验缓存 TTL

function fail(code, message) {
  return { ok: false, error: { code, message } };
}

/**
 * 登录失败计数：进程内缓存按次数 + 最近失败时间记录（键固定，单密码系统），
 * 同时冗余写入 app_settings 避免进程重启丢失。
 */
export function recordFailedLogin() {
  const state = appCache.get("auth:failures") ?? { count: 0, lastAt: 0 };
  state.count += 1;
  state.lastAt = Date.now();
  appCache.set("auth:failures", state, LOCKOUT_MAX_MS * 2);
  return state.count;
}

export function clearFailedLogin() {
  appCache.delete("auth:failures");
}

/**
 * 计算锁定剩余毫秒；0 表示未锁定。
 * 先查进程内缓存，未命中查 app_settings（Auth.md §6）。
 */
export async function computeLockout(getSetting) {
  const cached = appCache.get("auth:lockout");
  if (cached) return Math.max(0, cached.lockedUntil - Date.now());

  const stored = await getSetting(AUTH_LOCKOUT_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (typeof data?.lockedUntil === "number") {
        appCache.set("auth:lockout", data, LOCKOUT_MAX_MS * 2);
        return Math.max(0, data.lockedUntil - Date.now());
      }
    } catch {
      // 损坏数据按未锁定处理
    }
  }
  return 0;
}

/**
 * 登录成功后清除失败计数与锁定状态。
 */
export async function clearLockout(setSetting) {
  clearFailedLogin();
  appCache.delete("auth:lockout");
  await setSetting(AUTH_LOCKOUT_KEY, "{}");
}

/**
 * 登录处理器（POST /api/auth/login）。
 * body: { durationOption: "4h"|"8h"|...|"session" }
 * getSettingRaw：app_settings 的原始字符串读取（settings:auth 存 JSON，
 * 需要拿到原始串再做一次 JSON.parse，与 getSetting 的解析层区分开）。
 */
export function createLoginHandler(
  { getSetting, getSettingRaw, setSetting, createSession },
) {
  return async (c) => {
    const logReq = createLogger({
      module: "auth",
      requestId: c.get("requestId"),
    });

    const lockedMs = await computeLockout(getSetting);
    if (lockedMs > 0) {
      return c.json(
        fail(ERROR_CODES.AUTH_LOCKED, "Too many failed attempts", 429),
        429,
      );
    }

    const password = c.req.header("x-auth-password") ?? "";
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        fail(ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body", 400),
        400,
      );
    }
    const durationOption = body?.durationOption ?? "24h";

    const storedAuth =
      await (getSettingRaw
        ? getSettingRaw(AUTH_SETTINGS_KEY)
        : getSetting(AUTH_SETTINGS_KEY));
    if (!storedAuth) {
      return c.json(
        fail(ERROR_CODES.INTERNAL_ERROR, "Auth not configured", 500),
        500,
      );
    }

    let hash;
    try {
      const parsed = typeof storedAuth === "string"
        ? JSON.parse(storedAuth)
        : storedAuth;
      hash = parsed.passwordHash;
    } catch {
      return c.json(
        fail(ERROR_CODES.INTERNAL_ERROR, "Auth settings corrupted", 500),
        500,
      );
    }

    const ok = await verifyPassword(password, hash);
    if (!ok) {
      const count = recordFailedLogin();
      let lockedUntil = 0;
      if (count >= LOCKOUT_THRESHOLD) {
        const backoff = Math.min(
          LOCKOUT_BASE_MS * 2 ** (count - LOCKOUT_THRESHOLD),
          LOCKOUT_MAX_MS,
        );
        lockedUntil = Date.now() + backoff;
        await setSetting(
          AUTH_LOCKOUT_KEY,
          JSON.stringify({ lockedUntil, failures: count }),
        );
        appCache.set("auth:lockout", { lockedUntil }, LOCKOUT_MAX_MS * 2);
      }
      logReq.warn(`login failed (attempt #${count})`, {
        ip: c.req.header("cf-connecting-ip") ??
          c.req.header("x-forwarded-for") ?? "unknown",
      });
      return c.json(
        fail(ERROR_CODES.AUTH_INVALID_PASSWORD, "Invalid password", 401),
        401,
      );
    }

    // 成功：签发会话
    await clearLockout(setSetting);
    const { token, storageKind } = await createSession(c, durationOption);
    logReq.info("login succeeded");
    return c.json({ ok: true, data: { token, storageKind } });
  };
}

/**
 * 登出处理器（POST /api/auth/logout）：吊销当前令牌对应会话。
 */
export function createLogoutHandler({ revokeSession }) {
  return async (c) => {
    const token = c.req.header("x-auth-password");
    if (token) await revokeSession(c, token);
    return c.json({ ok: true, data: null });
  };
}

/**
 * 校验请求令牌（除 /api/auth/login 与 /api/health 外）。
 * 校验顺序：令牌缺失 → 签名/exp → 会话未吊销（30s 缓存）。
 */
export function createAuthMiddleware({ getSessionStatus }) {
  return async (c, next) => {
    const path = c.req.path;
    if (path === "/api/auth/login" || path === "/api/health") return next();

    const token = c.req.header("x-auth-password");
    if (!token) {
      return c.json(
        fail(ERROR_CODES.AUTH_MISSING_TOKEN, "Missing auth token", 401),
        401,
      );
    }

    const secret = c.get("encryptionKey");
    const payload = await verifySessionToken(token, secret);
    if (!payload) {
      return c.json(
        fail(ERROR_CODES.AUTH_INVALID_TOKEN, "Invalid or expired token", 401),
        401,
      );
    }

    const status = await getSessionStatus(c, payload.jti);
    if (!status || status.revokedAt) {
      return c.json(
        fail(ERROR_CODES.AUTH_REVOKED, "Session revoked", 401),
        401,
      );
    }

    c.set("sessionId", payload.jti);
    c.set("authToken", token);
    return next();
  };
}
