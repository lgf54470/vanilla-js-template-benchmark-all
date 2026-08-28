// apps/server/src/platform-adapters/docker.entry.js — Docker/VPS 入口（Deployment.md §6）
//
// deno compile 的入口：独立二进制监听 PORT，静态根 STATIC_ROOT（默认 ./public，
// Dockerfile COPY dist/web /public 一次到位），/packages/contracts 作为第二静态根
// 挂在 ${STATIC_ROOT}/packages/contracts 下（Deployment.md §6.2 双根约定）。
// 数据库：默认 Turso，LOCAL_SQLITE_PATH 设置时改用本机磁盘 SQLite。
// 注意：不在此处自动迁移——迁移是部署步骤（Deployment.md §8 清单第 4 项），
// 通过 just db-migrate 对目标环境执行；启动不依赖数据库连通性。

import { createDb } from "../shared/db/resolve.js";
import { createSqliteAdapter } from "../shared/db/sqlite.adapter.js";
import { createApp } from "../app.js";
import { createStaticHandler } from "../shared/static/static-handler.js";
import { serveWithPortHint } from "../shared/net/serve.js";
import { collectEnv } from "../shared/env.js";

const env = collectEnv();
env.DEPLOY_TARGET = env.DEPLOY_TARGET ?? "docker";

const db = createDb({
  target: "docker",
  env,
  sqliteFactory: createSqliteAdapter,
});

const app = createApp({ db, env });

const staticRoot = env.STATIC_ROOT ?? "./public";
const staticDir = new URL(
  staticRoot.endsWith("/") ? staticRoot : `${staticRoot}/`,
  new URL("file:///"),
).pathname;
const contractsDir = new URL(
  "packages/contracts/",
  new URL(
    staticRoot.endsWith("/") ? staticRoot : `${staticRoot}/`,
    new URL("file:///"),
  ),
).pathname;

const staticHandler = createStaticHandler({
  roots: [
    { urlPrefix: "/", dir: staticDir },
    { urlPrefix: "/packages/contracts", dir: contractsDir },
  ],
});

const handler = (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api")) return app.fetch(req);
  return staticHandler(req);
};

const port = Number(env.PORT ?? 8787);
await serveWithPortHint(handler, port);
