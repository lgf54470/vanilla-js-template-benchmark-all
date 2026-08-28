#!/usr/bin/env -S deno run -A
/**
 * local.entry.js — 本地开发入口（Deno + SQLite）。
 * M1：在 /api/health 之外提供最小静态服务（public 资产 + src 源码 +
 * packages/contracts），供令牌层浏览器验收；M2 起替换为完整装配
 * （createApp() + shared/static 的 ETag/SPA 回退静态服务 + 迁移/种子流程）。
 */

import { fileURLToPath } from "node:url";

// PORT 解析：非法/0 视为未设置，回退默认（docs/Deployment.md §9）；
// shell 已导出的合法 PORT 优先后于 .env（--env-file 不覆盖既有变量）。
const PORT_ENV = Number(Deno.env.get("PORT"));
const PORT = Number.isInteger(PORT_ENV) && PORT_ENV > 0 ? PORT_ENV : 8787;

const WEB_ROOT = fileURLToPath(new URL("../../../web/", import.meta.url));
const PKG_ROOT = fileURLToPath(
  new URL("../../../../packages/", import.meta.url),
);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

/** 把 URL 路径映射到磁盘文件；越界（..）与目录一律拒绝。
 * 解析顺序：public/ 资产（前缀剥离，/fonts/x → public/fonts/x）→ web 根 →
 * /packages/（contracts 静态暴露）。 */
function resolveFile(pathname) {
  let rel = decodeURIComponent(pathname).replace(/\/+$/, "");
  if (rel === "" || rel === "/") rel = "/index.html";
  const candidates = [];
  if (!rel.startsWith("/packages/")) {
    candidates.push(new URL(`public${rel}`, `file://${WEB_ROOT}`));
    candidates.push(new URL(`.${rel}`, `file://${WEB_ROOT}`));
  } else {
    candidates.push(
      new URL(`.${rel.slice("/packages".length)}`, `file://${PKG_ROOT}`),
    );
  }
  for (const target of candidates) {
    if (
      !target.href.startsWith(`file://${WEB_ROOT}`) &&
      !target.href.startsWith(`file://${PKG_ROOT}`)
    ) {
      return null; // 越界
    }
    try {
      const stat = Deno.statSync(target);
      if (stat.isFile) return target;
    } catch {
      /* 继续尝试下一个候选 */
    }
  }
  return null;
}

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/api/health") {
    return Response.json({ ok: true, data: { target: "local" } });
  }
  const file = resolveFile(url.pathname);
  if (!file) return new Response("Not Found", { status: 404 });
  const body = await Deno.readFile(file);
  const type = MIME[file.pathname.slice(file.pathname.lastIndexOf("."))] ??
    "application/octet-stream";
  return new Response(body, {
    headers: { "content-type": type, "cache-control": "no-cache" },
  });
});
