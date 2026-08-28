// apps/server/src/modules/auth/routes.js — /api/auth 路由（Auth.md §1）
//
// 中间件逻辑在 shared/auth/auth-middleware.js（可测试的工厂函数），本文件只负责
// 把依赖（app_settings 存取 + 会话仓库）接进来。统一响应包络（ARCHITECTURE.md §8）。

import { Hono } from "../../../../../packages/lib/hono/dist/hono.js";
import {
  createLoginHandler,
  createLogoutHandler,
} from "../../shared/auth/auth-middleware.js";

export function createAuthRoutes({ settingsStore, authService }) {
  const router = new Hono();

  router.post(
    "/login",
    createLoginHandler({
      getSetting: (key) => settingsStore.get(key),
      getSettingRaw: (key) => settingsStore.getRaw(key),
      setSetting: (key, value) => settingsStore.set(key, value),
      createSession: (c, durationOption) =>
        authService.createSession(c, durationOption),
    }),
  );

  router.post(
    "/logout",
    createLogoutHandler({
      revokeSession: (c, token) => authService.revokeSession(c, token),
    }),
  );

  return router;
}
