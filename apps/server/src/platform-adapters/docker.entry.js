/**
 * Docker/VPS 入口（ARCHITECTURE.md §15.4，deno compile 的入口）。
 *
 * - STATIC_ROOT 默认 ./public（Dockerfile COPY dist/web /public，内含
 *   apps/web 内容 + packages/contracts/，见 docs/Deployment.md §6）。
 * - 数据库：默认 Turso；LOCAL_SQLITE_PATH 改用本机磁盘 SQLite（VPS 持久盘）。
 */
import { createApp } from "../app.js";
import { createDbAdapter } from "../shared/db/resolve.js";
import { createStaticHandler } from "../shared/static/static-handler.js";
import { serveWithPortHint } from "../shared/net/serve-with-port-hint.js";

const port = Number(Deno.env.get("PORT") ?? 8787);
const staticRoot = Deno.env.get("STATIC_ROOT") ?? "./public";

const db = await createDbAdapter({ target: "docker" });
const staticHandler = createStaticHandler({ roots: [{ fsPath: staticRoot }] });
const app = createApp({ db, deployTarget: "docker", staticHandler });

console.log(`docker server: http://localhost:${port}/ (target=docker)`);
await serveWithPortHint({ port, handler: app.fetch });
