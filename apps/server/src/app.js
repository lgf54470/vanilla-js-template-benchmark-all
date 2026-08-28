// apps/server/src/app.js — 平台无关的 Hono App（ARCHITECTURE.md §8）
//
// 唯一业务逻辑入口：全局中间件顺序为
//   securityHeaders → withRequestId → authMiddleware(x-auth-password)
//   → workspaceMiddleware(x-workspace-id) → i18nMiddleware(Accept-Language)
//   → 路由
// 平台适配器只做协议桥接 + env/bindings 注入 + 数据库适配器选择，不含业务逻辑。
//
// 统一响应包络：成功 { ok: true, data, meta? }；失败 { ok: false, error:{ code, message } }，
// code 为 SCREAMING_SNAKE_CASE。

import { Hono } from "../../../packages/lib/hono/dist/hono.js";
import { ERROR_CODES } from "../../../packages/contracts/constants.js";
import { withRequestId } from "./shared/logger/request-context.js";
import { createLogger } from "./shared/logger/logger.js";
import { createAppSettingsStore } from "./shared/settings/app-settings.js";
import { createAuthMiddleware } from "./shared/auth/auth-middleware.js";
import { createWorkspaceMiddleware } from "./shared/workspace/workspace-middleware.js";
import { createI18nMiddleware } from "./shared/i18n/i18n-middleware.js";
import { createSessionsRepository } from "./modules/auth/repository.js";
import { createAuthService } from "./modules/auth/service.js";
import { createAuthRoutes } from "./modules/auth/routes.js";
import { createSettingsRepository } from "./modules/settings/repository.js";
import { createSettingsService } from "./modules/settings/service.js";
import { createSettingsRoutes } from "./modules/settings/routes.js";

const log = createLogger({ module: "app" });

/** 安全响应头（CSP 不启用：index.html 的 PREPAINT 内联脚本需要 inline，见 CSS.md §1） */
export function securityHeaders() {
  return async (c, next) => {
    await next();
    c.res.headers.set("X-Content-Type-Options", "nosniff");
    c.res.headers.set("X-Frame-Options", "DENY");
    c.res.headers.set("Referrer-Policy", "no-referrer");
    c.res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
  };
}

/**
 * @param {Object} opts
 * @param {import("./shared/db/adapter.js").DbAdapter} opts.db
 * @param {Record<string,string|undefined>} [opts.env]
 */
export function createApp({ db, env = {} }) {
  const encryptionKey = env.APP_ENCRYPTION_KEY ?? "dev-local-insecure-key";
  if (!env.APP_ENCRYPTION_KEY) {
    log.warn(
      "APP_ENCRYPTION_KEY 未设置，使用开发默认密钥（仅限本地开发，部署必须注入平台机密）",
    );
  }

  const settingsStore = createAppSettingsStore(db, encryptionKey);
  const settingsRepo = createSettingsRepository(settingsStore);
  const settingsService = createSettingsService({ repo: settingsRepo });
  const sessionsRepo = createSessionsRepository(db);
  const authService = createAuthService({ sessionsRepo, encryptionKey });

  const app = new Hono();

  // 上下文注入（db / encryptionKey / settings 供中间件与路由共用）
  app.use("*", (c, next) => {
    c.set("db", db);
    c.set("encryptionKey", encryptionKey);
    c.set("settings", settingsStore);
    return next();
  });

  app.use("*", securityHeaders());
  app.use("*", withRequestId);

  app.use(
    "*",
    createAuthMiddleware({
      getSessionStatus: (_c, jti) => authService.getSessionStatus(jti),
    }),
  );

  app.use("*", createWorkspaceMiddleware());
  app.use("*", createI18nMiddleware());

  app.get("/api/health", (c) => {
    const target = env.DEPLOY_TARGET ?? "local";
    return c.json({ ok: true, data: { target } });
  });

  app.route("/api/auth", createAuthRoutes({ settingsStore, authService }));
  app.route(
    "/api/settings",
    createSettingsRoutes({ service: settingsService }),
  );

  app.notFound((c) => {
    // 兜底：/api 未匹配路由 → 404 包络；非 /api 由平台入口的静态层处理
    if (c.req.path.startsWith("/api/")) {
      return c.json(
        {
          ok: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: "Not found" },
        },
        404,
      );
    }
    return c.text("Not found", 404);
  });

  return app;
}
