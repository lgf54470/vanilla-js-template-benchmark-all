// apps/server/src/shared/db/turso.adapter.js — Turso（libSQL）适配器
//
// 基于 vendored @libsql/client 的 /web 构建（packages/lib/libsql-client），
// 纯 JS + WebSocket/HTTP，可运行于 Deno 与各边缘运行时。

import { createClient } from "../../../../../packages/lib/libsql-client/web.js";
import { splitStatements } from "./split-statements.js";

function resultSetToRows(result) {
  // @libsql/client 的 ResultSet：{ columns: string[], rows: Array<Array> }
  if (!result || !Array.isArray(result.columns)) {
    return [];
  }
  return result.rows.map((row) => {
    const obj = {};
    for (let i = 0; i < result.columns.length; i++) {
      obj[result.columns[i]] = row[i];
    }
    return obj;
  });
}

/** 创建 Turso DbAdapter；opts: { url, authToken } */
export function createTursoAdapter({ url, authToken }) {
  if (!url) {
    throw new Error("createTursoAdapter: 缺少 TURSO_URL");
  }
  const client = createClient({ url, authToken: authToken || undefined });

  return {
    async query(sql, params = []) {
      const result = await client.execute({ sql, args: params });
      return resultSetToRows(result);
    },
    async execute(sql, params = []) {
      const result = await client.execute({ sql, args: params });
      return { changes: Number(result.rowsAffected ?? 0) };
    },
    // 多语句 SQL（迁移用）：按 ; 拆分后逐条 batch（近似，迁移文件不含
    // 字符串内分号即可正确拆分）
    raw(sql) {
      return this.transaction((tx) => {
        for (const stmt of splitStatements(sql)) {
          tx.execute(stmt);
        }
      });
    },
    async transaction(fn) {
      const stmts = [];
      const tx = {
        query(q, p = []) {
          stmts.push([q, p]);
          return Promise.resolve([]);
        },
        execute(q, p = []) {
          stmts.push([q, p]);
          return Promise.resolve({ changes: 1 });
        },
        raw(q) {
          for (const stmt of splitStatements(q)) stmts.push([stmt, []]);
          return Promise.resolve({ changes: 0 });
        },
      };
      await fn(tx);
      if (stmts.length > 0) {
        const results = await client.batch(
          stmts.map(([sql, args]) => ({ sql, args })),
        );
        return results;
      }
    },
  };
}
