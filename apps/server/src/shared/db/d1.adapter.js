// apps/server/src/shared/db/d1.adapter.js — Cloudflare D1 适配器
//
// D1 的每语句自动提交，不支持跨语句 BEGIN/COMMIT；transaction() 采用"收集语句 +
// 一次 db.batch 原子提交"的近似实现（适用于迁移等只执行不改读的事务场景）。

import { splitStatements } from "./split-statements.js";

/** 创建 D1 DbAdapter；binding 为 env.DB（D1 binding） */
export function createD1Adapter(binding) {
  if (!binding) {
    throw new Error("createD1Adapter: 缺少 D1 binding（env.DB）");
  }
  return {
    async query(sql, params = []) {
      const result = await binding.prepare(sql).bind(...params).all();
      return result.results ?? [];
    },
    async execute(sql, params = []) {
      const result = await binding.prepare(sql).bind(...params).run();
      return { changes: Number(result.meta?.changes ?? 0) };
    },
    // 多语句 SQL（迁移用）：按 ; 拆分后逐条收集进 batch（近似，迁移文件不含
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
        await binding.batch(
          stmts.map(([sql, p]) => binding.prepare(sql).bind(...p)),
        );
      }
    },
  };
}
