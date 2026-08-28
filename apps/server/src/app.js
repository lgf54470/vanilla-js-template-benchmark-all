import { Hono } from "hono";

export function createApp() {
  const app = new Hono();

  app.get("/api/health", (c) => {
    return c.json({ ok: true, target: Deno.env.get("DEPLOY_TARGET") || "local" });
  });

  return app;
}
