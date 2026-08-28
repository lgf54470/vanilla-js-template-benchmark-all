// apps/server/src/platform-adapters/local.entry.js — 本地开发入口
// M1 脚手架：最小静态文件服务（apps/web + packages/contracts 双根），供 M1 外观引擎
// 视觉验收；M2 起换成 Hono + ETag/SPA 回退的完整 static-handler。
//
// 端口解析：shell 里已 export 的 PORT 会覆盖 .env（Deployment.md §9.1）。
// 某些宿主环境会注入 PORT=0（表示"自动分配"），此时回退读 .env 的 PORT，
// 再不行用文档默认 8787。
// 本文件位于 apps/server/src/platform-adapters/：../.. 到 src、../../.. 到 server、
// ../../../.. 到 repo 根；apps/web 是 ../../.. + web（apps/ 下）。
const ROOT_ENV = new URL("../../../../.env", import.meta.url);
// 注意目录 URL 必须以 / 结尾，否则 new URL("./x", base) 会把末段当文件名解析
const WEB_ROOT = new URL("../../../web/", import.meta.url);
const REPO_ROOT = new URL("../../../..", import.meta.url);

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function resolvePort() {
  const raw = Deno.env.get("PORT");
  if (raw && raw !== "0" && Number(raw) > 0) return Number(raw);
  try {
    const envText = Deno.readTextFileSync(ROOT_ENV);
    const m = envText.match(/^PORT=(\d+)\s*$/m);
    if (m) return Number(m[1]);
  } catch {
    // .env 不存在，走默认
  }
  return 8787;
}

function resolvePath(pathname) {
  // packages/contracts 作为第二静态根（URL 前缀 /packages/contracts）
  const base = pathname.startsWith("/packages/contracts")
    ? REPO_ROOT
    : WEB_ROOT;
  const rootPath = base.pathname.replace(/\/$/, "");
  const full = new URL(`.${pathname}`, base);
  if (!full.pathname.startsWith(rootPath)) return null;
  return full;
}

async function openStatic(pathname) {
  // public/ 目录内容挂到站点根（Vite 约定）：先查 WEB_ROOT，再查 WEB_ROOT/public
  const candidates = pathname.startsWith("/packages/contracts")
    ? [resolvePath(pathname)]
    : [
      resolvePath(pathname),
      resolvePath(`/public${pathname}`),
    ];
  for (const full of candidates) {
    if (!full) continue;
    try {
      return { file: await Deno.open(full), full };
    } catch {
      // 继续尝试下一个候选
    }
  }
  return null;
}

async function serveStatic(req) {
  const url = new URL(req.url);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const opened = await openStatic(pathname);
  if (!opened) {
    return new Response("not found", { status: 404 });
  }
  const ext = opened.full.pathname.slice(opened.full.pathname.lastIndexOf("."));
  const type = CONTENT_TYPES[ext] ?? "application/octet-stream";
  return new Response(opened.file.readable, {
    headers: { "content-type": type },
  });
}

const port = resolvePort();
console.log(
  `[local.entry] 静态服务 http://127.0.0.1:${port}/ （web 根: ${WEB_ROOT.pathname}）`,
);
Deno.serve({ port }, serveStatic);
