// apps/server/src/modules/auth/service.js — 会话签发/吊销（Auth.md §2/§5）
//
// durationOption → SESSION_DURATIONS（contracts）：
//   - 8 个固定时长 → exp=签发时刻+时长，storage_kind=persistent（客户端存
//     localStorage），expires_at 同步写入供吊销清理
//   - "session" → 令牌不设 exp（设 30 天远期兜底），expires_at=NULL，
//     storage_kind=session（客户端存 sessionStorage，浏览器关闭即失效）
// 服务端真正的"浏览器关闭即失效"由客户端存储生命周期保证（Auth.md §2/§7）。

import { SESSION_DURATIONS } from "../../../../../packages/contracts/constants.js";
import {
  signSessionToken,
  verifySessionToken,
} from "../../shared/auth/token.js";
import { appCache } from "../../shared/cache/memory-cache.js";
import { createLogger } from "../../shared/logger/logger.js";

const log = createLogger({ module: "auth", component: "AuthService" });
const SESSION_CAP_MS = 30 * 24 * 60 * 60 * 1000; // "session" 令牌远期兜底 30 天

export function createAuthService({ sessionsRepo, encryptionKey }) {
  /**
   * @param {import("hono").Context} c
   * @param {string} durationOption
   * @returns {Promise<{ token: string, storageKind: string }>}
   */
  async function createSession(_c, durationOption) {
    const option = SESSION_DURATIONS.find((o) => o.id === durationOption) ??
      SESSION_DURATIONS.find((o) => o.id === "24h");

    const now = new Date();
    const jti = crypto.randomUUID();
    let expiresAt = null;
    let tokenExp;

    if (option.session) {
      // 保持登录直到下次浏览器打开：服务端不设硬过期，令牌带 30 天兜底
      tokenExp = Math.floor((now.getTime() + SESSION_CAP_MS) / 1000);
    } else {
      const ms = (option.hours ?? 0) * 3600_000 +
        (option.days ?? 0) * 86400_000;
      expiresAt = new Date(now.getTime() + ms).toISOString();
      tokenExp = Math.floor((now.getTime() + ms) / 1000);
    }

    const token = await signSessionToken({ jti, exp: tokenExp }, encryptionKey);
    await sessionsRepo.insert({
      id: jti,
      issuedAt: now.toISOString(),
      expiresAt,
      storageKind: option.session ? "session" : "persistent",
    });
    appCache.set(`session:${jti}`, { revokedAt: null }, 30_000);
    return { token, storageKind: option.session ? "session" : "persistent" };
  }

  /**
   * 会话状态（带 30s 缓存；吊销后主动失效缓存键）。
   * @returns {Promise<{ revokedAt: string | null } | null>}
   */
  async function getSessionStatus(jti) {
    const cached = appCache.get(`session:${jti}`);
    if (cached) return cached;
    const status = await sessionsRepo.getStatus(jti);
    appCache.set(`session:${jti}`, status, 30_000);
    return status;
  }

  /** 登出：吊销会话 + 失效缓存（Auth.md §5）。 */
  async function revokeSession(c, token) {
    const secret = c.get("encryptionKey");
    const payload = await verifySessionToken(token, secret);
    if (!payload) return;
    await sessionsRepo.revoke(payload.jti);
    appCache.delete(`session:${payload.jti}`);
    log.info(`session revoked: ${payload.jti}`);
  }

  return { createSession, getSessionStatus, revokeSession };
}
