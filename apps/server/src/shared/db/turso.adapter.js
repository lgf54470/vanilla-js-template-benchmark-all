import { createClient } from "@libsql/client/web";

export function createTursoAdapter(config = {}) {
  const url = config.url || Deno.env.get("TURSO_URL");
  const authToken = config.authToken || Deno.env.get("TURSO_AUTH_TOKEN");

  if (!url) {
    throw new Error("Turso database URL is required (TURSO_URL)");
  }

  const client = createClient({ url, authToken });

  const adapter = {
    async query(sql, params = []) {
      const res = await client.execute({ sql, args: params });
      return res.rows.map((row) => ({ ...row }));
    },
    async execute(sql, params = []) {
      const res = await client.execute({ sql, args: params });
      return {
        changes: res.rowsAffected ?? 0,
        lastInsertRowid: res.lastInsertRowid,
      };
    },
    async transaction(fn) {
      await fn(adapter);
    },
  };

  return adapter;
}
