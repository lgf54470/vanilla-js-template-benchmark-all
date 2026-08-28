// apps/server/src/platform-adapters/local.entry.js — 本地开发入口（just dev）
//
// 职责：端口解析 → 创建 SQLite DbAdapter → 迁移 + 开发种子 → createApp →
// 静态服务（apps/web + public/ + packages/contracts 多根，ETag/SPA 回退）。
// /api 前缀进 Hono，其余走静态层（与 cloudflare.entry 的分流一致）。
//
// 端口解析：shell 里已 export 的 PORT 覆盖 .env（Deployment.md §9.1）；宿主
// 环境注入 PORT=0（自动分配）时回退读 .env 的 PORT，再不行用默认 8787。
// 本文件位于 apps/server/src/platform-adapters/：.. 到 src、../.. 到 server、
// ../../.. 到 apps、../../../.. 到 repo 根。
const ROOT_ENV = new URL("../../../../.env", import.meta.url);
// 注意目录 URL 必须以 / 结尾，否则 new URL("./x", base) 会把末段当文件名解析
const SERVER_SRC = new URL("../", import.meta.url);
const WEB_ROOT = new URL("../../../web/", import.meta.url);
const REPO_ROOT = new URL("../../../..", import.meta.url);

import { createDb } from "../shared/db/resolve.js";
import { createSqliteAdapter } from "../shared/db/sqlite.adapter.js";
import { bootstrapMigrations, ensureAuthSeed } from "../shared/db/bootstrap.js";
import { createApp } from "../app.js";
import { createStaticHandler } from "../shared/static/static-handler.js";
import { serveWithPortHint } from "../shared/net/serve.js";
import { createAppSettingsStore } from "../shared/settings/app-settings.js";
import { collectEnv } from "../shared/env.js";

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

const env = collectEnv();
env.DEPLOY_TARGET = env.DEPLOY_TARGET ?? "local";

const db = createDb({
  target: "local",
  env,
  sqliteFactory: createSqliteAdapter,
});
await bootstrapMigrations(db, SERVER_SRC);
const settingsStore = createAppSettingsStore(db, env.APP_ENCRYPTION_KEY);
await ensureAuthSeed(settingsStore);

const app = createApp({ db, env });
const staticHandler = createStaticHandler({
  roots: [
    { urlPrefix: "/", dir: WEB_ROOT.pathname },
    { urlPrefix: "/", dir: new URL("public/", WEB_ROOT).pathname },
    {
      urlPrefix: "/packages/contracts",
      dir: new URL("packages/contracts/", REPO_ROOT).pathname,
    },
  ],
});

const handler = (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api")) return app.fetch(req);
  return staticHandler(req);
};

const port = resolvePort();
await serveWithPortHint(handler, port);
