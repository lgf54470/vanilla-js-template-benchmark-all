// apps/server/src/modules/settings/routes.js — /api/settings 路由
//
// 统一响应包络（ARCHITECTURE.md §8）：成功 { ok:true, data }；失败
// { ok:false, error:{ code, message } }，code 为 SCREAMING_SNAKE_CASE。

import { Hono } from "../../../../../packages/lib/hono/dist/hono.js";
import { ERROR_CODES } from "../../../../../packages/contracts/constants.js";

function jsonError(c, code, message, status) {
  return c.json({ ok: false, error: { code, message } }, status);
}

export function createSettingsRoutes({ service }) {
  const router = new Hono();

  const handle = (fn) => async (c) => {
    try {
      const data = await fn(c);
      return c.json({ ok: true, data });
    } catch (err) {
      const code = err?.code ?? ERROR_CODES.INTERNAL_ERROR;
      const status = code === "VALIDATION_ERROR"
        ? 400
        : code === "AUTH_INVALID_PASSWORD"
        ? 401
        : 500;
      return jsonError(c, code, err?.message ?? "Internal error", status);
    }
  };

  router.get("/profile", handle(() => service.getProfile()));
  router.put(
    "/profile",
    handle(async (c) => {
      const body = await c.req.json().catch(() => ({}));
      return service.updateProfile(body);
    }),
  );

  router.get("/display", handle(() => service.getDisplay()));
  router.put(
    "/display",
    handle(async (c) => {
      const body = await c.req.json().catch(() => ({}));
      return service.updateDisplay(body);
    }),
  );

  router.get("/account", handle(() => service.getAccount()));
  router.put(
    "/account",
    handle(async (c) => {
      const body = await c.req.json().catch(() => ({}));
      return service.updateAccount(body);
    }),
  );

  router.put(
    "/password",
    handle(async (c) => {
      const body = await c.req.json().catch(() => ({}));
      return service.changePassword(body.currentPassword, body.nextPassword);
    }),
  );

  return router;
}
