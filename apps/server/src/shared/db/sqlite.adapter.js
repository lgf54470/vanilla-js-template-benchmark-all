/**
 * sqlite.adapter.js — 本地/VPS 磁盘 SQLite（node:sqlite DatabaseSync）。
 * local 目标默认 .data/dev.sqlite3；docker 目标经 LOCAL_SQLITE_PATH 覆盖。
 */
import { DatabaseSync } from "node:sqlite";

/**
 * @param {string} filePath
 * @returns {import("./adapter.js").DbAdapter}
 */
export function createSqliteAdapter(filePath) {
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

  function exec(sql) {
    db.exec(sql);
  }

  function query(sql, params = []) {
    return db.prepare(sql).all(...params);
  }

  function execute(sql, params = []) {
    const result = db.prepare(sql).run(...params);
    return {
      changes: Number(result.changes),
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  async function transaction(fn) {
    db.exec("BEGIN");
    try {
      await fn({ query, execute, exec });
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }

  return { query, execute, transaction, exec, close: () => db.close() };
}
