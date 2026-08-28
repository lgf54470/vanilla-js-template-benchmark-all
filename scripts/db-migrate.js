// scripts/db-migrate.js — 执行数据库迁移（just db-migrate，Database.md §2）
//
// 用法：deno run --env-file=.env -A scripts/db-migrate.js [DEPLOY_TARGET]
// 默认目标 local（SQLite 文件 .data/dev.sqlite3）；对 D1/Turso 迁移时显式传入
// 目标：DEPLOY_TARGET=cloudflare deno run -A scripts/db-migrate.js
//   （cloudflare 需经 wrangler d1 execute 或部署管线调用，见 Deployment.md §3）

import { createDb } from "../apps/server/src/shared/db/resolve.js";
import { createSqliteAdapter } from "../apps/server/src/shared/db/sqlite.adapter.js";
import {
  collectMigrationFiles,
} from "../apps/server/src/shared/db/bootstrap.js";
import { runMigrations } from "../apps/server/src/shared/db/migrate.js";
import { collectEnv } from "../apps/server/src/shared/env.js";
import { createLogger } from "../apps/server/src/shared/logger/logger.js";

const log = createLogger({ module: "db", component: "MigrateCLI" });

const SERVER_SRC = new URL("../apps/server/src/", import.meta.url);

const env = collectEnv();
const target = env.DEPLOY_TARGET ?? Deno.args[0] ?? "local";
env.DEPLOY_TARGET = target;

const db = createDb({ target, env, sqliteFactory: createSqliteAdapter });

try {
  const migrations = await collectMigrationFiles(SERVER_SRC);
  const result = await runMigrations(db, migrations);
  log.info(`db-migrate: ${result.applied} applied (target=${target})`);
} finally {
  if (typeof db.close === "function") db.close();
}
