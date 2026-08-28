/**
 * 平台无关的 Hono App 实例（ARCHITECTURE.md §3 / §8）。
 * M0 骨架：仅健康检查 + 501 占位；workspace/auth/静态服务等中间件在 M2 装配。
 */
import { Hono } from "hono";

const DEPLOY_TARGET = Deno.env.get("DEPLOY_TARGET") ?? "local";

export function createApp() {
  const app = new Hono();

  app.get("/api/health", (c) => c.json({ ok: true, target: DEPLOY_TARGET }));

  app.notFound((c) => c.json({ ok: false, error: "not_found" }, 404));

  return app;
}
