// apps/server/src/shared/db/migrate.js — 迁移执行器（Database.md §2）
//
// 扫描迁移清单，按 (module, version) 与 core_migrations 比对，未应用的按文件名
// 数字序执行；单事务内完成"执行 SQL + 写入 core_migrations 记录"，任一失败回滚。
// 迁移文件只增不改。

/**
 * @param {import("./adapter.js").DbAdapter} db
 * @param {Array<{ module: string, version: number, slug: string, sql: string }>} migrations
 * @returns {Promise<{ applied: number, skipped: Array<string> }>}
 */
export async function runMigrations(db, migrations) {
  // 确保记录表存在（迁移系统自举，不属于任何模块迁移）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS core_migrations (
      module TEXT NOT NULL,
      version INTEGER NOT NULL,
      applied_at TEXT NOT NULL,
      PRIMARY KEY (module, version)
    )
  `);

  const appliedRows = await db.query(
    "SELECT module, version FROM core_migrations",
    [],
  );
  const applied = new Set(appliedRows.map((r) => `${r.module}:${r.version}`));

  let appliedCount = 0;
  for (const m of migrations) {
    const key = `${m.module}:${m.version}`;
    if (applied.has(key)) continue;

    await db.transaction(async (tx) => {
      // 迁移文件是多语句 SQL（core 0001 含 4 条 DDL），sqlite 用 raw→exec，
      // d1/turso 用 raw→按语句拆分进 batch（split-statements.js）
      await tx.raw(m.sql);
      await tx.execute(
        "INSERT INTO core_migrations (module, version, applied_at) VALUES (?, ?, ?)",
        [m.module, m.version, new Date().toISOString()],
      );
    });
    appliedCount += 1;
  }
  return { applied: appliedCount };
}

/** 从迁移目录文件清单解析迁移列表（按 module 分组内数字序）。 */
export function collectMigrations(files) {
  return files
    .map(({ module, file, sql }) => {
      // 文件名: 0001_init.sql → version 1, slug "init"
      const base = file.slice(file.lastIndexOf("/") + 1);
      const match = base.match(/^(\d+)_(.+)\.sql$/);
      if (!match) {
        throw new Error(
          `collectMigrations: 非法迁移文件名 "${base}"（需 000N_slug.sql）`,
        );
      }
      return { module, version: Number(match[1]), slug: match[2], sql };
    })
    .sort((a, b) => a.module.localeCompare(b.module) || a.version - b.version);
}
