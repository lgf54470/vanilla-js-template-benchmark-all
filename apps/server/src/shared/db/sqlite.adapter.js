// apps/server/src/shared/db/sqlite.adapter.js — SQLite 适配器（node:sqlite）
//
// 仅由 local/docker 入口经工厂注入使用（本文件静态 import node:sqlite，不能被
// cloudflare/vercel/deno 入口引用，否则破坏 wrangler 打包——Deployment.md §3）。
// 对外契约见 adapter.js。

import { DatabaseSync } from "node:sqlite";

function toPlainRows(rows) {
  return rows.map((row) => ({ ...row }));
}

/** 创建 SQLite DbAdapter；path 传 ":memory:" 用于测试 */
export function createSqliteAdapter(path) {
  if (path !== ":memory:") {
    // node:sqlite 不会自动创建父目录（.data/dev.sqlite3 首次运行场景）
    const dir = path.slice(0, Math.max(path.lastIndexOf("/"), 0));
    if (dir) Deno.mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  return {
    // node:sqlite 是同步 API；契约要求返回 Promise（scoped-repository 等调用方
    // 依赖 .then()），用 Promise.resolve 包装而非 async（避免 require-await 噪音）
    query(sql, params = []) {
      const stmt = db.prepare(sql);
      return Promise.resolve(toPlainRows(stmt.all(...params)));
    },
    execute(sql, params = []) {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return Promise.resolve({
        changes: Number(result.changes),
        lastInsertRowid: result.lastInsertRowid,
      });
    },
    // 多语句 SQL（迁移用）：node:sqlite 的 prepare 只接受单语句，这里用 exec
    raw(sql) {
      db.exec(sql);
      return Promise.resolve({ changes: 0 });
    },
    async transaction(fn) {
      db.exec("BEGIN;");
      try {
        const tx = {
          query(q, p = []) {
            return Promise.resolve(toPlainRows(db.prepare(q).all(...p)));
          },
          execute(q, p = []) {
            const r = db.prepare(q).run(...p);
            return Promise.resolve({
              changes: Number(r.changes),
              lastInsertRowid: r.lastInsertRowid,
            });
          },
          raw(sql) {
            db.exec(sql);
            return Promise.resolve({ changes: 0 });
          },
        };
        await fn(tx);
        db.exec("COMMIT;");
      } catch (err) {
        db.exec("ROLLBACK;");
        throw err;
      }
    },
    close() {
      db.close();
    },
  };
}
