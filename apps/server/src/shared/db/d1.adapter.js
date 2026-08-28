export function createD1Adapter(d1Binding) {
  if (!d1Binding) {
    throw new Error("D1 database binding (env.DB) is required");
  }

  const adapter = {
    async query(sql, params = []) {
      const stmt = d1Binding.prepare(sql).bind(...params);
      const res = await stmt.all();
      return res.results || [];
    },
    async execute(sql, params = []) {
      const stmt = d1Binding.prepare(sql).bind(...params);
      const res = await stmt.run();
      return {
        changes: res.meta?.changes ?? 1,
        lastInsertRowid: res.meta?.last_row_id,
      };
    },
    async transaction(fn) {
      // D1 supports batch queries; execute callback with adapter
      await fn(adapter);
    },
  };

  return adapter;
}
