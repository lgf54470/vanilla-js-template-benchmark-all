/**
 * 本地开发入口（just dev）：Deno.serve + .env 注入。
 * M2 在此接入静态资源服务（ETag）与数据库适配器解析。
 */
import { createApp } from "../app.js";

const port = Number(Deno.env.get("PORT") ?? 8787);

const app = createApp({ deployTarget: "local" });

Deno.serve({ port }, (req) => {
  // M2 换成 app.fetch + 静态资源分流。
  if (new URL(req.url).pathname.startsWith("/api/")) return app.fetch(req);
  return app.fetch(req);
});

console.log(
  `[vanilla-js-template] dev server 已启动：http://127.0.0.1:${port}`,
);
console.log(
  `[vanilla-js-template] 健康检查：http://127.0.0.1:${port}/api/health`,
);
