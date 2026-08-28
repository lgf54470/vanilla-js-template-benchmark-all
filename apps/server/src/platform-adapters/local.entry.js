#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env --env-file
/**
 * local.entry.js — 本地开发入口（ARCHITECTURE.md §15，`just dev` 调用）。
 * M1：静态托管 apps/web + /api/health 探针；M2 起替换为 app.js（Hono）+
 * shared/static（ETag/SPA 回退/extraRoots）+ SQLite 适配器装配。
 */

const PORT = Number(Deno.env.get("PORT") ?? 8787);
// apps/server/src/platform-adapters/ → apps/web/
const WEB_ROOT = new URL("../../../web/", import.meta.url).pathname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function serveStatic(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  // 两个静态根：apps/web 根（src/ 等）与 public/（favicon/icons/fonts 等，
  // 对齐 vite dev 语义；build-web 组装时会把 public/ 平铺到产物根）。
  const candidates = relative
    ? [`${WEB_ROOT}${relative}`, `${WEB_ROOT}public/${relative}`]
    : [`${WEB_ROOT}index.html`];
  for (const file of candidates) {
    if (!file.startsWith(WEB_ROOT)) continue; // 路径穿越防护
    const stat = await Deno.stat(file).catch(() => null);
    if (!stat || stat.isDirectory) continue;
    const ext = file.slice(file.lastIndexOf("."));
    const body = await Deno.readFile(file);
    return new Response(body, {
      headers: { "content-type": MIME[ext] ?? "application/octet-stream" },
    });
  }
  return serveIndex(); // SPA 深链回退
}

async function serveIndex() {
  const file = `${WEB_ROOT}index.html`;
  const stat = await Deno.stat(file).catch(() => null);
  if (!stat) return null;
  return new Response(await Deno.readFile(file), {
    headers: { "content-type": MIME[".html"] },
  });
}

Deno.serve({ port: PORT }, (request) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/health") {
    return Response.json({ ok: true, data: { status: "up" } });
  }
  return serveStatic(url.pathname).then(
    (response) =>
      response ?? Response.json(
        { ok: false, error: { code: "NOT_FOUND", message: url.pathname } },
        { status: 404 },
      ),
  );
});
