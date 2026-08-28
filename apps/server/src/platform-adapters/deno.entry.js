/**
 * Deno Deploy 入口（ARCHITECTURE.md §8/§15）。
 *
 * - 静态产物：deployctl --static-dir=dist/web 由平台服务；本入口对非 /api
 *   路径做磁盘回退（平台静态托管不自动回退 index.html，docs/Deployment.md §5）。
 * - 数据库：Turso。
 */
import { createApp } from "../app.js";
import { createDbAdapter } from "../shared/db/resolve.js";
import { createStaticHandler } from "../shared/static/static-handler.js";

const STATIC_DIR = Deno.env.get("STATIC_DIR") ?? "dist/web";

const db = await createDbAdapter({ target: "deno" });
const staticHandler = createStaticHandler({ roots: [{ fsPath: STATIC_DIR }] });
const app = createApp({
  db,
  deployTarget: "deno",
  staticHandler,
});

Deno.serve(app.fetch);
