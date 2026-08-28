/**
 * d1.adapter.js — Cloudflare D1（env.DB binding）。
 * D1 Workers API 无显式事务，transaction 为尽力而为的顺序执行（无回滚保证），
 * 迁移走 wrangler d1 execute（docs/Deployment.md §3）。
 */
/**
 * @param {D1Database} binding
 * @returns {import("./adapter.js").DbAdapter}
 */
export function createD1Adapter(binding) {
  async function query(sql, params = []) {
    const stmt = binding.prepare(sql);
    const bound = params.length ? stmt.bind(...params) : stmt;
    const { results } = await bound.all();
    return results ?? [];
  }

  async function execute(sql, params = []) {
    const stmt = binding.prepare(sql);
    const bound = params.length ? stmt.bind(...params) : stmt;
    const meta = await bound.run();
    return {
      changes: meta.meta?.changes ?? 0,
      lastInsertRowid: meta.meta?.last_row_id,
    };
  }

  async function transaction(fn) {
    // D1 不支持交互式事务：顺序执行，失败时抛错（此前语句已生效）。
    await fn({ query, execute });
  }

  return { query, execute, transaction };
}
