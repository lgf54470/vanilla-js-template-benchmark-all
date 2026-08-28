// apps/server/src/platform-adapters/local.entry.js — 本地开发入口
// M0 脚手架占位：纯 Deno.serve 起服（M2 起换成 Hono + 静态服务 + SQLite）。
//
// 端口解析：shell 里已 export 的 PORT 会覆盖 .env（Deployment.md §9.1）。
// 某些宿主环境会注入 PORT=0（表示"自动分配"），此时回退读 .env 的 PORT，
// 再不行用文档默认 8787。
const ROOT_ENV = new URL("../../../../.env", import.meta.url);

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

const port = resolvePort();
Deno.serve({ port }, () => new Response("scaffold ok", {
  headers: { "content-type": "text/plain; charset=utf-8" },
}));
