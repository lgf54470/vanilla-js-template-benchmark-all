// apps/server/src/shared/static/static-handler.js — 静态资源服务（Deployment.md §2）
//
// createStaticHandler({ roots, fallback })：roots 为 [{ urlPrefix, dir }]。
// 命中规则：按声明顺序尝试**所有**前缀匹配的根（第一个能打开文件的即返回），
// 全部未命中才做 SPA 回退——支持"web 根 + public 根 + packages/contracts 双根"
// 的多根布局（Deployment.md §2）。特性：
//   - 纯 Request → Response（不依赖 Hono 上下文，各平台入口直接调用）
//   - 路径穿越防护：解码后规范化，拒绝任何 .. 段与 NUL
//   - ETag（mtime+size）+ If-None-Match → 304
//   - SPA 回退：未命中文件时回退到 fallback（默认 index.html，History 路由深链）
//
// 实现说明：文件整读进内存再响应（本项目资产最大为字体 ~200KB），避免
// "Response 构造后、流式发送前关闭文件句柄"导致 body 流错误、状态被
// Deno.serve 改写为 500 的坑（docs/bug/2026-08-28-static-stream-close.md）。

const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
});

function contentType(path) {
  const dot = path.lastIndexOf(".");
  if (dot < 0) return "application/octet-stream";
  return MIME[path.slice(dot).toLowerCase()] ?? "application/octet-stream";
}

/**
 * 规范化并校验路径在 dir 内；非法返回 null。
 * @param {string} urlPath 如 "/a/b.js"
 * @param {string} dir 磁盘目录（file:// URL 或绝对路径）
 */
export function resolveSafePath(urlPath, dir) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  const clean = decoded.split("?")[0];
  const segments = clean.split("/").filter((s) => s && s !== ".");
  // 任何 .. 段都拒绝（含编码变体已在上方 decode）
  if (segments.some((s) => s === "..")) return null;

  const base = new URL(dir.endsWith("/") ? dir : `${dir}/`, "file:///");
  const joined = new URL(segments.join("/"), base);
  if (!joined.href.startsWith(base.href)) return null;
  return joined;
}

/**
 * @param {Object} opts
 * @param {Array<{ urlPrefix: string, dir: string }>} opts.roots 按声明顺序尝试；
 *   urlPrefix 为 "/"（站点根）或 "/packages/contracts"（第二根，Deployment.md §2）
 * @param {string} [opts.fallback] SPA 回退文件名，默认 index.html
 */
export function createStaticHandler({ roots, fallback = "index.html" }) {
  /**
   * @param {Request} req
   * @returns {Promise<Response>}
   */
  return async (req) => {
    const pathname = new URL(req.url).pathname;
    const matching = roots.filter(
      (r) =>
        r.urlPrefix === "/" ||
        pathname === r.urlPrefix ||
        pathname.startsWith(`${r.urlPrefix}/`),
    );
    if (matching.length === 0) {
      return new Response("Not found", { status: 404 });
    }

    const isDir = pathname.endsWith("/") || pathname === "";
    let relPath = isDir ? `${pathname}index.html` : pathname;

    // 1) 依次尝试各根：先剥掉命中的 URL 前缀再解析（第二根 /packages/contracts
    //    的磁盘根里不能出现重复的 packages/contracts 层级）
    for (const root of matching) {
      if (root.urlPrefix !== "/" && relPath.startsWith(root.urlPrefix)) {
        relPath = relPath.slice(root.urlPrefix.length);
      }
      const filePath = resolveSafePath(relPath, root.dir);
      if (!filePath) continue;
      const response = await tryServe(req, filePath);
      if (response) return response;
    }

    // 2) 全部未命中 → SPA 回退（第一个匹配根的 fallback）
    const first = matching[0];
    const fallbackPath = resolveSafePath(`/${fallback}`, first.dir);
    if (fallbackPath) {
      const response = await tryServe(req, fallbackPath);
      if (response) return response;
    }
    return new Response("Not found", { status: 404 });
  };
}

/** 命中则返回响应；未命中（文件不存在）返回 null。 */
async function tryServe(req, filePath) {
  let stat;
  try {
    stat = await Deno.stat(filePath);
  } catch {
    return null;
  }
  if (!stat.isFile) return null;

  const etag = `"${stat.mtime?.getTime() ?? stat.size}-${stat.size}"`;
  if (req.headers.get("If-None-Match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "public, max-age=0" },
    });
  }

  const bytes = await Deno.readFile(filePath);
  return new Response(bytes, {
    status: 200,
    headers: {
      ETag: etag,
      "Content-Type": contentType(filePath.pathname),
      "Cache-Control": "public, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
