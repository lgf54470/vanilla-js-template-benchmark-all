#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env --env-file
/**
 * local.entry.js — 本地开发入口（ARCHITECTURE.md §15，`just dev` 调用）。
 * M0 骨架：仅验证起服与 /api/health；M2 替换为 app.js（Hono）+ 静态服务 +
 * SQLite 适配器装配。
 */

const PORT = Number(Deno.env.get("PORT") ?? 8787);

Deno.serve({ port: PORT }, (request) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/health") {
    return Response.json({ ok: true, data: { status: "up" } });
  }
  return new Response(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>vanilla-js-template</title></head><body><p>M0 脚手架占位（apps/web 为静态源码，M2 起由本入口托管静态产物）。</p></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
});
