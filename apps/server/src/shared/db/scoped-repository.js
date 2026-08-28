export function createScopedRepository(db, table) {
  return {
    forWorkspace(workspaceId) {
      if (!workspaceId) {
        throw new Error(`workspaceId is required to access "${table}"`);
      }
      return {
        list: async (extraWhere = "", extraParams = []) => {
          const sql = `SELECT * FROM ${table} WHERE workspace_id = ? ${extraWhere}`;
          return await db.query(sql, [workspaceId, ...extraParams]);
        },
        findById: async (id) => {
          const rows = await db.query(
            `SELECT * FROM ${table} WHERE workspace_id = ? AND id = ?`,
            [workspaceId, id],
          );
          return rows[0] ?? null;
        },
        insert: async (row) => {
          const cols = Object.keys(row);
          const placeholders = cols.map(() => "?").join(", ");
          const sql = `INSERT INTO ${table} (workspace_id, ${
            cols.join(", ")
          }) VALUES (?, ${placeholders})`;
          return await db.execute(sql, [workspaceId, ...cols.map((c) => row[c])]);
        },
        update: async (id, patch) => {
          const cols = Object.keys(patch);
          const setClause = cols.map((c) => `${c} = ?`).join(", ");
          const sql = `UPDATE ${table} SET ${setClause} WHERE workspace_id = ? AND id = ?`;
          return await db.execute(sql, [...cols.map((c) => patch[c]), workspaceId, id]);
        },
        remove: async (id) => {
          return await db.execute(
            `DELETE FROM ${table} WHERE workspace_id = ? AND id = ?`,
            [workspaceId, id],
          );
        },
      };
    },
  };
}
