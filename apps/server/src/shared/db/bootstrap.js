// apps/server/src/shared/db/bootstrap.js — 启动期迁移收集与开发种子
//
// local/docker 入口与 scripts/db-migrate|db-seed 共用：
//   - collectMigrationFiles：扫描 shared/*/migrations 与 modules/*/migrations
//   - ensureAuthSeed：settings:auth 缺失时写入默认密码哈希（仅开发种子，
//     生产必须由 db-seed/管理流程显式设置）
// 迁移执行顺序：shared/* 先于 modules/*（core → … → workspace），各自文件数字序。

import { collectMigrations, runMigrations } from "./migrate.js";
import { hashPassword } from "../crypto/password.js";
import { createLogger } from "../logger/logger.js";

const log = createLogger({ module: "db", component: "Bootstrap" });

/** 默认开发密码（首次 db-seed 或本地启动自动种子时使用） */
export const DEFAULT_DEV_PASSWORD = "admin";

/**
 * 扫描迁移目录，返回 [{ module, version, slug, sql }]（已排序）。
 * @param {URL} serverSrcRoot apps/server/src/ 的目录 URL
 */
export async function collectMigrationFiles(serverSrcRoot) {
  const files = [];
  for (const area of ["shared", "modules"]) {
    const base = new URL(`${area}/`, serverSrcRoot);
    let entries;
    try {
      entries = await Array.fromAsync(Deno.readDir(base));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory) continue;
      const migDir = new URL(`${entry.name}/migrations/`, base);
      let migEntries;
      try {
        migEntries = await Array.fromAsync(Deno.readDir(migDir));
      } catch {
        continue; // 该模块无迁移目录
      }
      for (const mig of migEntries) {
        if (!mig.isFile || !mig.name.endsWith(".sql")) continue;
        const sql = await Deno.readTextFile(new URL(mig.name, migDir));
        files.push({
          module: entry.name,
          file: `${entry.name}/migrations/${mig.name}`,
          sql,
        });
      }
    }
  }
  return collectMigrations(files);
}

/**
 * 执行全部待应用迁移（幂等）。
 * @param {import("./adapter.js").DbAdapter} db
 * @param {URL} serverSrcRoot
 */
export async function bootstrapMigrations(db, serverSrcRoot) {
  const migrations = await collectMigrationFiles(serverSrcRoot);
  const result = await runMigrations(db, migrations);
  if (result.applied > 0) {
    log.info(`migrations applied: ${result.applied}`);
  }
  return result;
}

/**
 * 开发种子：settings:auth 缺失时写入默认密码哈希并打印提示。
 * @param {import("../settings/app-settings.js").AppSettingsStore} settingsStore
 */
export async function ensureAuthSeed(settingsStore) {
  const existing = await settingsStore.getRaw("settings:auth");
  if (existing) return false;
  const passwordHash = await hashPassword(DEFAULT_DEV_PASSWORD);
  await settingsStore.set("settings:auth", { passwordHash });
  log.warn(
    `settings:auth 未配置，已写入开发默认密码 "${DEFAULT_DEV_PASSWORD}"（生产请尽快修改）`,
  );
  return true;
}
