import { extname, join, normalize } from "node:path";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

export function createStaticHandler(options = {}) {
  const root = options.root || "apps/web";
  const extraRoots = options.extraRoots || {
    "/packages/contracts": "packages/contracts",
  };

  return async function staticHandler(c) {
    const url = new URL(c.req.url);
    const pathname = decodeURIComponent(url.pathname);

    // Skip API routes
    if (pathname.startsWith("/api/")) {
      return null;
    }

    // Check extra roots
    for (const [prefix, extraPath] of Object.entries(extraRoots)) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        const subPath = pathname.slice(prefix.length);
        const resolved = normalize(join(extraPath, subPath));
        const res = await tryServeFile(resolved, c);
        if (res) return res;
      }
    }

    // Try primary web root
    const targetPath = normalize(join(root, pathname));

    // Direct file or public file check
    let res = await tryServeFile(targetPath, c);
    if (!res) {
      // Also check root/public
      const publicPath = normalize(join(root, "public", pathname));
      res = await tryServeFile(publicPath, c);
    }

    if (res) return res;

    // SPA Fallback for HTML navigation (if not a file request with extension)
    if (!extname(pathname) || pathname.endsWith(".html")) {
      const indexPath = normalize(join(root, "index.html"));
      const indexRes = await tryServeFile(indexPath, c);
      if (indexRes) return indexRes;
    }

    return null;
  };
}

async function tryServeFile(filePath, c) {
  try {
    const stat = await Deno.stat(filePath);
    if (!stat.isFile) return null;

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const etag = `W/"${stat.size}-${stat.mtime ? stat.mtime.getTime() : 0}"`;

    const ifNoneMatch = c.req.header("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          etag,
          "cache-control": ext === ".html" ? "no-cache" : "public, max-age=3600",
        },
      });
    }

    const fileBytes = await Deno.readFile(filePath);
    return new Response(fileBytes, {
      status: 200,
      headers: {
        "content-type": contentType,
        etag,
        "cache-control": ext === ".html" ? "no-cache" : "public, max-age=3600",
      },
    });
  } catch {
    return null;
  }
}
