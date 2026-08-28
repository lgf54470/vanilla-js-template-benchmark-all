/**
 * 平台无关的 Hono App 实例（ARCHITECTURE.md §8）。
 *
 * 中间件顺序（§8）：
 *   requestId → securityHeaders → authMiddleware → workspaceMiddleware
 *   → i18nMiddleware → 路由 →（可选）静态服务 → notFound。
 * 平台入口只负责：把 app.fetch 接到平台协议 + 注入 env/bindings + 选数据库适配器。
 */
import { Hono } from "hono";
import { withRequestId } from "./shared/logger/request-context.js";
import { createAuthMiddleware } from "./shared/auth/auth-middleware.js";
import { createWorkspaceMiddleware } from "./shared/workspace/workspace-middleware.js";
import { i18nMiddleware } from "./shared/i18n/i18n-middleware.js";
import { createMemoryCache } from "./shared/cache/memory-cache.js";
import { createSettings } from "./shared/settings/settings.js";
import { createAuthRepository } from "./modules/auth/repository.js";
import { createAuthService } from "./modules/auth/service.js";
import { createAuthRouter } from "./modules/auth/routes.js";
import { createWorkspaceRouter } from "./shared/workspace/routes.js";

function securityHeaders(c, next) {
  return next().then(() => {
    c.header("x-content-type-options", "nosniff");
    c.header("referrer-policy", "same-origin");
    c.header("x-frame-options", "DENY");
  });
}

/**
 * @param {{
 *   db?: import("./shared/db/adapter.js").DbAdapter,
 *   deployTarget?: string,
 *   secret?: string,                   // APP_ENCRYPTION_KEY（Workers 等平台从 env 注入）
 *   staticHandler?: (c: any, next: () => Promise<void>) => Response | Promise<Response>,
 * }} options
 */
export function createApp(options = {}) {
  const app = new Hono();
  const deployTarget = options.deployTarget ??
    globalThis.Deno?.env?.get("DEPLOY_TARGET") ?? "local";
  const db = options.db;
  const cache = createMemoryCache();

  app.use("*", withRequestId);
  app.use("*", securityHeaders);

  app.get(
    "/api/health",
    (c) => c.json({ ok: true, data: { target: deployTarget } }),
  );

  if (db) {
    const secret = options.secret ??
      globalThis.Deno?.env?.get("APP_ENCRYPTION_KEY") ?? "";
    const settings = createSettings(db, cache);

    const authRepo = createAuthRepository(db, settings);
    const authService = createAuthService(authRepo, cache, secret);
    const authRouter = createAuthRouter(authService);

    app.use(
      "/api/*",
      createAuthMiddleware(db, cache, secret),
    );
    app.use("/api/*", createWorkspaceMiddleware(db, cache));
    app.use("/api/*", i18nMiddleware);

    app.route("/api/auth", authRouter);
    app.route("/api/workspaces", createWorkspaceRouter(db, cache));
  }

  if (options.staticHandler) {
    app.use("*", options.staticHandler);
  }

  app.notFound((c) => c.json({ ok: false, error: { code: "NOT_FOUND" } }, 404));

  return app;
}
