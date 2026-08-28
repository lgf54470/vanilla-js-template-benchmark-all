/**
 * shared/static/static-handler.js — 零依赖静态资源服务（ARCHITECTURE.md §3/§12.3）。
 *
 * - 多根映射：plain roots 按路径直查；prefix roots 挂载到 URL 前缀
 *   （本地开发把 packages/contracts 挂在 /packages/contracts，docs/Deployment.md §2）。
 * - 强 ETag（内容 SHA-256 十六进制）+ If-None-Match → 304。
 * - 路径穿越防护：decode 后拒绝 ".." 片段。
 * - SPA 回退：未命中的无扩展名路径回退 index.html（History 深链）。
 * - 仅本地/Docker 入口使用（Cloudflare 走 ASSETS binding、Deno Deploy 走
 *   --static-dir，见各 entry）。
 */
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function extOf(path) {
  const dot = path.lastIndexOf(".");
  return dot < 0 ? "" : path.slice(dot).toLowerCase();
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(
    new Uint8Array(digest),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * @param {{
 *   roots: Array<{fsPath: string, urlPrefix?: string}>,
 *   indexFile?: string,
 * }} options
 */
export function createStaticHandler(options) {
  const roots = options.roots;
  const indexFile = options.indexFile ?? "index.html";

  async function readCandidate(urlPath) {
    for (const root of roots) {
      let rel = urlPath;
      if (root.urlPrefix) {
        if (urlPath === root.urlPrefix) rel = "/";
        else if (urlPath.startsWith(root.urlPrefix + "/")) {
          rel = urlPath.slice(root.urlPrefix.length);
        } else continue;
      }
      if (rel.includes("..")) continue;
      const clean = rel.replace(/^\/+/, "");
      if (!clean || clean.endsWith("/")) continue;
      try {
        const bytes = await Deno.readFile(`${root.fsPath}/${clean}`);
        return { bytes, name: clean };
      } catch { /* 尝试下一个根 */ }
    }
    return null;
  }

  function readIndex() {
    return readCandidate("/" + indexFile);
  }

  return async function staticHandler(c, next) {
    if (c.req.method !== "GET" && c.req.method !== "HEAD") return next();
    const rawPath = new URL(c.req.url).pathname;
    if (rawPath === "/api" || rawPath.startsWith("/api/")) return next();

    let decoded;
    try {
      decoded = decodeURIComponent(rawPath);
    } catch {
      return next();
    }
    if (decoded.includes("\0") || decoded.split("/").includes("..")) {
      return c.text("forbidden", 403);
    }

    const hit = (await readCandidate(decoded)) ??
      (extOf(decoded) === "" ? await readIndex() : null);
    if (!hit) return next();

    const etag = await sha256Hex(hit.bytes);
    const headers = {
      "content-type": CONTENT_TYPES[extOf(hit.name)] ??
        "application/octet-stream",
      etag,
      "cache-control": "no-cache",
    };
    if (c.req.header("if-none-match") === etag) {
      return c.body(null, 304, headers);
    }
    return c.body(hit.bytes, 200, headers);
  };
}
