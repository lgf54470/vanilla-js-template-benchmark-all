import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export async function createSqliteAdapter(dbPath = ".data/dev.sqlite3") {
  if (dbPath !== ":memory:") {
    const dir = dirname(dbPath);
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch {
      // Ignore directory creation error
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  const adapter = {
    query(sql, params = []) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params);
      return Promise.resolve(rows.map((r) => ({ ...r })));
    },
    execute(sql, params = []) {
      const stmt = db.prepare(sql);
      const res = stmt.run(...params);
      return Promise.resolve({
        changes: res.changes,
        lastInsertRowid: res.lastInsertRowid,
      });
    },
    async transaction(fn) {
      db.exec("BEGIN TRANSACTION;");
      try {
        await fn(adapter);
        db.exec("COMMIT;");
      } catch (err) {
        db.exec("ROLLBACK;");
        throw err;
      }
    },
  };

  return adapter;
}
