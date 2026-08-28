/**
 * shared/auth/auth-middleware.js — x-auth-password 会话令牌校验
 * （docs/Auth.md §3/§4）。
 *
 * 约定：登录请求该头携带明文密码（仅 /api/auth/login）；其余请求同一头名
 * 携带 HMAC 会话令牌。core_sessions 点查走 30s 进程内缓存（吊销延迟换吞吐）。
 */
import { verifyHmacToken } from "./token.js";

const SESSION_CACHE_TTL_MS = 30_000;
const SESSION_FALLBACK_EXP_SECONDS = 30 * 24 * 3600; // sessionStorage 类会话 30 天兜底

export function createAuthMiddleware(db, cache, secret) {
  async function getSession(jti) {
    const key = `session:${jti}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const rows = await db.query(
      "SELECT id, expires_at AS expiresAt, revoked_at AS revokedAt, storage_kind AS storageKind FROM core_sessions WHERE id = ?",
      [jti],
    );
    const session = rows[0] ?? null;
    cache.set(key, session, SESSION_CACHE_TTL_MS);
    return session;
  }

  return async function authMiddleware(c, next) {
    if (c.req.path === "/api/auth/login") return next();

    const token = c.req.header("x-auth-password");
    if (!token) {
      return c.json({ ok: false, error: { code: "AUTH_MISSING_TOKEN" } }, 401);
    }

    const payload = await verifyHmacToken(token, secret);
    if (!payload) {
      return c.json({ ok: false, error: { code: "AUTH_INVALID_TOKEN" } }, 401);
    }

    const session = await getSession(payload.jti);
    if (!session || session.revokedAt) {
      return c.json({ ok: false, error: { code: "AUTH_REVOKED" } }, 401);
    }

    c.set("sessionId", payload.jti);
    return next();
  };
}

export { SESSION_FALLBACK_EXP_SECONDS };
