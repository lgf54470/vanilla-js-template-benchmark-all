#!/usr/bin/env deno run -A
/**
 * db-migrate.js — 迁移 runner（docs/Database.md §2）。
 *
 * 扫描 apps/server/src/modules/<模块>/migrations/*.sql 与
 * apps/server/src/shared/workspace/migrations/*.sql，按 (module, version) 与
 * core_migrations 比对，未应用的按文件名数字序在单事务内"执行 SQL + 写执行记录"，
 * 任一失败整体回滚。迁移文件只增不改。
 *
 * 本地 SQLite（默认 .data/dev.sqlite3，LOCAL_SQLITE_PATH 可覆盖）；
 * D1 经 wrangler d1 execute、Turso 由部署流程处理（docs/Deployment.md §3）。
 */

import { createDbAdapter } from "../apps/server/src/shared/db/resolve.js";

const SERVER_SRC = import.meta.dirname + "/../apps/server/src";

async function listMigrations() {
  const out = [];
  const moduleDirs = [
    { moduleId: "workspace", dir: SERVER_SRC + "/shared/workspace/migrations" },
  ];
  // modules/*/migrations
  for await (const entry of Deno.readDir(SERVER_SRC + "/modules")) {
    if (entry.isDirectory) {
      moduleDirs.push({
        moduleId: entry.name,
        dir: `${SERVER_SRC}/modules/${entry.name}/migrations`,
      });
    }
  }
  for (const { moduleId, dir } of moduleDirs) {
    try {
      for await (const file of Deno.readDir(dir)) {
        const m = file.name.match(/^(\d+)_(.+)\.sql$/);
        if (file.isFile && m) {
          out.push({ moduleId, version: Number(m[1]), dir, file: file.name });
        }
      }
    } catch { /* 该模块无 migrations 目录 */ }
  }
  return out;
}

const db = await createDbAdapter({ target: "local" });
db.exec(`CREATE TABLE IF NOT EXISTS core_migrations (
  module TEXT NOT NULL,
  version INTEGER NOT NULL,
  applied_at TEXT NOT NULL,
  PRIMARY KEY (module, version)
)`);

const applied = new Set(
  (await db.query("SELECT module, version FROM core_migrations")).map(
    (r) => `${r.module}:${r.version}`,
  ),
);

const pending = (await listMigrations())
  .filter((m) => !applied.has(`${m.moduleId}:${m.version}`))
  .sort((a, b) =>
    a.moduleId === b.moduleId
      ? a.version - b.version
      : a.moduleId.localeCompare(b.moduleId)
  );

if (pending.length === 0) {
  console.log("db-migrate: 无待应用迁移");
  Deno.exit(0);
}

for (const m of pending) {
  const sql = await Deno.readTextFile(`${m.dir}/${m.file}`);
  await db.transaction(async (tx) => {
    tx.exec(sql);
    await tx.execute(
      "INSERT INTO core_migrations (module, version, applied_at) VALUES (?, ?, ?)",
      [m.moduleId, m.version, new Date().toISOString()],
    );
  });
  console.log(`db-migrate: ${m.moduleId} ${m.file} applied`);
}
console.log(`db-migrate: ${pending.length} 个迁移已应用`);
