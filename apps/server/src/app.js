/**
 * 平台无关的 Hono App 实例（M0 脚手架最小版）。
 * M2 在此装配完整中间件链与模块路由：
 *   securityHeaders → cors(按需) → authMiddleware → workspaceMiddleware →
 *   i18nMiddleware → 路由；统一响应包络 { ok, data|error }。
 */
import { Hono } from "hono";
import { secureHeaders } from "hono/middleware/secure-headers/index.js";

/**
 * @param {{ deployTarget?: import("@contracts/typedefs.js").DeployTarget }} [options]
 */
export function createApp(options = {}) {
  const deployTarget = options.deployTarget ?? "local";
  const app = new Hono();

  // 安全响应头：CSP default-src 'self' 等（ARCHITECTURE §18）。
  app.use("*", secureHeaders());

  app.onError((err, c) => {
    // M2 换成结构化日志（shared/logger）+ requestId 贯穿。
    console.error(`[unhandled] ${err?.stack ?? err}`);
    return c.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "internal error" },
      },
      500,
    );
  });

  app.get("/api/health", (c) => c.json({ ok: true, target: deployTarget }));

  return app;
}
