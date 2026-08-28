/**
 * turso.adapter.js — Turso（vendored @libsql/client/web，hrana/websocket）。
 * vercel / deno / docker 目标默认数据库（ARCHITECTURE.md §9.2）。
 */
import { createClient } from "@libsql/client/web";

/**
 * @param {{url: string, authToken?: string}} options
 * @returns {import("./adapter.js").DbAdapter}
 */
export function createTursoAdapter(options) {
  const client = createClient(options);

  async function query(sql, params = []) {
    const result = await client.execute({ sql, args: params });
    return result.rows;
  }

  async function execute(sql, params = []) {
    const result = await client.execute({ sql, args: params });
    return {
      changes: Number(result.rowsAffected ?? 0),
      lastInsertRowid: result.lastInsertRowid == null
        ? undefined
        : Number(result.lastInsertRowid),
    };
  }

  async function transaction(fn) {
    const tx = await client.transaction();
    const txQuery = (sql, params = []) =>
      tx.execute({ sql, args: params }).then((r) => r.rows);
    const txExecute = async (sql, params = []) => {
      const r = await tx.execute({ sql, args: params });
      return {
        changes: Number(r.rowsAffected ?? 0),
        lastInsertRowid: r.lastInsertRowid,
      };
    };
    try {
      await fn({ query: txQuery, execute: txExecute });
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  return { query, execute, transaction, close: () => client.close() };
}
