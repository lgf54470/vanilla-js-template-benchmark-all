// scripts/db-seed.js — 写入/重置种子数据（just db-seed）
//
// 组成：迁移（含 6 个系统工作空间种子，Workspace.md §2）+ settings:auth 默认
// 密码（缺失时才写，不覆盖已修改的密码）+ settings:display 默认值。幂等，可重复
// 执行。用法同 db-migrate.js（默认目标 local）。

import { createDb } from "../apps/server/src/shared/db/resolve.js";
import { createSqliteAdapter } from "../apps/server/src/shared/db/sqlite.adapter.js";
import {
  bootstrapMigrations,
  DEFAULT_DEV_PASSWORD,
  ensureAuthSeed,
} from "../apps/server/src/shared/db/bootstrap.js";
import { createAppSettingsStore } from "../apps/server/src/shared/settings/app-settings.js";
import { collectEnv } from "../apps/server/src/shared/env.js";
import { createLogger } from "../apps/server/src/shared/logger/logger.js";

const log = createLogger({ module: "db", component: "SeedCLI" });

const SERVER_SRC = new URL("../apps/server/src/", import.meta.url);

const env = collectEnv();
const target = env.DEPLOY_TARGET ?? Deno.args[0] ?? "local";
env.DEPLOY_TARGET = target;

const db = createDb({ target, env, sqliteFactory: createSqliteAdapter });

try {
  const migrated = await bootstrapMigrations(db, SERVER_SRC);
  const settingsStore = createAppSettingsStore(db, env.APP_ENCRYPTION_KEY);
  const seeded = await ensureAuthSeed(settingsStore);

  // settings:display 缺失时写默认（locale 为空 = 跟随客户端 pref:locale）
  const display = await settingsStore.get("settings:display");
  if (!display) {
    await settingsStore.set("settings:display", { locale: null });
  }

  log.info(
    `db-seed 完成（target=${target}）：migrations=${migrated.applied}，` +
      `auth-seed=${
        seeded ? `已写入默认密码 "${DEFAULT_DEV_PASSWORD}"` : "已存在，跳过"
      }`,
  );
} finally {
  if (typeof db.close === "function") db.close();
}
