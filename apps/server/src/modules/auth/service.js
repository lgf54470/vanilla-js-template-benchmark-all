/**
 * auth/service.js — 登录/登出业务（docs/Auth.md §1/§5/§6）。
 *
 * 登录失败限流：连续 5 次失败后锁定，指数退避 30s→60s→… 封顶 30 分钟；
 * 锁定状态双写进程内缓存与 app_settings（进程重启不丢）。
 */
import { SESSION_DURATIONS } from "@contracts/constants.js";
import { hashPassword, verifyPassword } from "../../shared/auth/password.js";
import { signHmacToken } from "../../shared/auth/token.js";

const FAIL_THRESHOLD = 5;
const LOCK_BASE_MS = 30_000;
const LOCK_MAX_MS = 30 * 60_000;
/** sessionStorage 类会话的服务端兜底 exp（30 天，docs/Auth.md §7）。 */
const SESSION_FALLBACK_EXP_SECONDS = 30 * 24 * 3600;

export function createAuthService(repo, cache, secret) {
  const logger = { warn: () => {}, info: () => {} }; // 结构化日志 M7 细化接线

  function lockDurationMs(failCount) {
    const ms = LOCK_BASE_MS * 2 ** (failCount - FAIL_THRESHOLD);
    return Math.min(ms, LOCK_MAX_MS);
  }

  async function getLockState() {
    const inMemory = cache.get("auth:lockout");
    if (inMemory) return inMemory;
    const persisted = await repo.getLockout();
    if (
      persisted?.lockedUntil && Date.parse(persisted.lockedUntil) > Date.now()
    ) {
      return persisted;
    }
    return null;
  }

  async function registerFailure(ip) {
    const fails = (cache.get("auth:failures") ?? 0) + 1;
    cache.set("auth:failures", fails, 0);
    if (fails >= FAIL_THRESHOLD) {
      const lockedUntil = new Date(Date.now() + lockDurationMs(fails))
        .toISOString();
      const state = { fails, lockedUntil };
      cache.set("auth:lockout", state, 0);
      await repo.setLockout(state);
      logger.warn?.("登录失败次数超阈值，进入锁定", { fails, ip });
    }
    return fails;
  }

  async function clearFailures() {
    cache.del("auth:failures");
    cache.del("auth:lockout");
    await repo.clearLockout();
  }

  /**
   * 登录。password 来自 x-auth-password 头（登录请求携带明文）。
   * durationOption 见 SESSION_DURATIONS（@contracts/constants.js）。
   */
  async function login(password, durationOption, ip = "unknown") {
    const lock = await getLockState();
    if (lock) {
      return {
        ok: false,
        code: "AUTH_LOCKED_OUT",
        meta: { lockedUntil: lock.lockedUntil },
      };
    }

    const auth = await repo.getAuthSetting();
    if (!auth?.passwordHash) {
      return { ok: false, code: "AUTH_NOT_CONFIGURED" };
    }

    const valid = await verifyPassword(password ?? "", auth.passwordHash);
    if (!valid) {
      await registerFailure(ip);
      return { ok: false, code: "AUTH_INVALID_PASSWORD" };
    }

    await clearFailures();

    const option = SESSION_DURATIONS.find((o) => o.id === durationOption) ??
      SESSION_DURATIONS[1]; // 默认 8h
    const storageKind = option.sessionOnly ? "session" : "persistent";
    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomUUID();
    const exp = now +
      (option.sessionOnly ? SESSION_FALLBACK_EXP_SECONDS : option.seconds);
    const payload = { jti, iat: now, exp };

    await repo.insertSession({
      id: jti,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      storageKind,
    });

    const token = await signHmacToken(payload, secret);
    return { ok: true, data: { token, storageKind } };
  }

  /** 登出：吊销会话。 */
  async function logout(jti) {
    await repo.revokeSession(jti);
    cache.del(`session:${jti}`);
    return { ok: true, data: null };
  }

  /** 设置/修改密码（首次配置或已登录用户修改）。 */
  async function setPassword(password) {
    const passwordHash = await hashPassword(password);
    await repo.setAuthSetting({ passwordHash });
    return { ok: true, data: null };
  }

  return { login, logout, setPassword, registerFailure, clearFailures };
}
