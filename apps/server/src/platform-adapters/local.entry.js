/**
 * 本地开发入口（just dev，ARCHITECTURE.md §15）。
 *
 * - 手动加载 .env（Deno --env-file 在文件缺失时报错，改为存在才读；
 *   shell 已 export 的变量优先，不覆盖）。
 * - local 目标：SQLite（默认 .data/dev.sqlite3），迁移经 just db-migrate。
 * - 静态服务：apps/web + apps/web/public + packages/contracts 双根。
 */
import { createApp } from "../app.js";
import { createDbAdapter } from "../shared/db/resolve.js";
import { createStaticHandler } from "../shared/static/static-handler.js";
import { serveWithPortHint } from "../shared/net/serve-with-port-hint.js";

// ---- .env 加载（KEY=VALUE，# 注释行）----
try {
  const text = await Deno.readTextFile(
    new URL("../../../../.env", import.meta.url),
  );
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    try {
      Deno.env.get(m[1]) ?? Deno.env.set(m[1], m[2]);
    } catch { /* 无 --allow-env 时忽略 */ }
  }
} catch { /* .env 不存在，纯环境变量运行 */ }

const port = Number(Deno.env.get("PORT") ?? 8787);
const db = await createDbAdapter({ target: "local" });

const webRoot = new URL("../../../../apps/web/", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1");
const publicRoot = webRoot + "public";
const contractsRoot = new URL(
  "../../../../packages/contracts/",
  import.meta.url,
)
  .pathname.replace(/^\/([A-Za-z]:)/, "$1");

const staticHandler = createStaticHandler({
  roots: [
    { fsPath: webRoot },
    { fsPath: publicRoot },
    { urlPrefix: "/packages/contracts", fsPath: contractsRoot },
  ],
});

const app = createApp({ db, deployTarget: "local", staticHandler });

console.log(`dev server: http://localhost:${port}/ (target=local, sqlite)`);
await serveWithPortHint({ port, handler: app.fetch });
