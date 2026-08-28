import { verifySessionToken } from "./session.js";
import { resolveDbAdapter } from "../db/resolve.js";

const PUBLIC_PATHS = [
  "/api/health",
  "/api/auth/login",
  "/api/auth/verify",
];

export function createAuthMiddleware() {
  return async function authMiddleware(c, next) {
    const path = c.req.path;

    // Skip public paths and non-API requests
    if (!path.startsWith("/api/") || PUBLIC_PATHS.includes(path)) {
      return next();
    }

    const token = c.req.header("x-auth-password");
    if (!token) {
      return c.json(
        { ok: false, error: { code: "AUTH_MISSING_TOKEN", message: "Authentication required" } },
        401,
      );
    }

    try {
      const db = await resolveDbAdapter({ env: c.env });
      const payload = await verifySessionToken(token, db);

      if (!payload) {
        return c.json(
          {
            ok: false,
            error: { code: "AUTH_INVALID_TOKEN", message: "Invalid or expired session" },
          },
          401,
        );
      }

      c.set("session", payload);
      c.set("sessionId", payload.jti);
      return next();
    } catch {
      return c.json(
        { ok: false, error: { code: "AUTH_ERROR", message: "Authentication failure" } },
        401,
      );
    }
  };
}
