#!/usr/bin/env -S deno run -A
/**
 * local.entry.js — 本地开发入口（M0 验收：just dev 起服）。
 * M2 起替换为完整装配：createApp() + 静态服务（ETag/extraRoots/SPA 回退）
 * + 迁移/种子启动流程。当前仅提供最小可运行壳。
 */

// PORT 解析：非法/0 视为未设置，回退默认（docs/Deployment.md §9）；
// 注意 shell 已导出的合法 PORT 仍优先后于 .env（--env-file 不覆盖既有变量）。
const PORT_ENV = Number(Deno.env.get("PORT"));
const PORT = Number.isInteger(PORT_ENV) && PORT_ENV > 0 ? PORT_ENV : 8787;
const INDEX_PATH = new URL("../../../web/index.html", import.meta.url).pathname;

Deno.serve({ port: PORT }, (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/api/health") {
    return Response.json({ ok: true, data: { target: "local" } });
  }
  if (url.pathname === "/") {
    return new Response(Deno.readTextFileSync(INDEX_PATH), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return new Response("Not Found", { status: 404 });
});
