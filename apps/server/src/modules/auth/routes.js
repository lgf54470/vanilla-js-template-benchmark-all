/**
 * auth/routes.js — /api/auth 登录与登出（docs/Auth.md）。
 * x-auth-password 头：登录请求携带明文密码，其余请求携带会话令牌。
 */
import { Hono } from "hono";

export function createAuthRouter(service) {
  const router = new Hono();

  router.post("/login", async (c) => {
    const password = c.req.header("x-auth-password");
    if (!password) {
      return c.json(
        { ok: false, error: { code: "AUTH_MISSING_PASSWORD" } },
        400,
      );
    }
    const body = await c.req.json().catch(() => ({}));
    const ip = c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const result = await service.login(password, body?.durationOption, ip);
    if (!result.ok) {
      return c.json({ ok: false, error: { code: result.code } }, 401);
    }
    return c.json(result);
  });

  router.post("/logout", async (c) => {
    const result = await service.logout(c.get("sessionId"));
    return c.json(result);
  });

  return router;
}
