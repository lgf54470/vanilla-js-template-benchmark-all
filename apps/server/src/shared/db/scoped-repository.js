/**
 * shared/db/scoped-repository.js — workspace 强制隔离封装器（docs/Workspace.md §3）。
 *
 * 业务 repository 只能通过 createScopedRepository(db, table).forWorkspace(id)
 * 访问表；不暴露不带 forWorkspace 的裸查询方法——业务代码无法遗漏 workspace
 * 过滤的结构性保证（check-workspace-scope.js 正则扫描是兜底）。
 *
 * extraWhere 只允许结构性片段（如 "ORDER BY updated_at DESC LIMIT ?"），
 * 值一律走 extraParams 参数数组。
 */
export function createScopedRepository(db, table) {
  return {
    forWorkspace(workspaceId) {
      if (!workspaceId) {
        throw new Error(`workspaceId is required to access "${table}"`);
      }
      return {
        list: (extraWhere = "", extraParams = []) =>
          db.query(
            `SELECT * FROM ${table} WHERE workspace_id = ? ${extraWhere}`,
            [workspaceId, ...extraParams],
          ),
        findById: (id) =>
          db.query(`SELECT * FROM ${table} WHERE workspace_id = ? AND id = ?`, [
            workspaceId,
            id,
          ]).then((r) => r[0] ?? null),
        insert: (row) => {
          const cols = Object.keys(row);
          const placeholders = cols.map(() => "?").join(",");
          return db.execute(
            `INSERT INTO ${table} (workspace_id, ${
              cols.join(",")
            }) VALUES (?, ${placeholders})`,
            [workspaceId, ...cols.map((c) => row[c])],
          );
        },
        update: (id, patch) => {
          const cols = Object.keys(patch);
          const setClause = cols.map((c) => `${c} = ?`).join(", ");
          return db.execute(
            `UPDATE ${table} SET ${setClause} WHERE workspace_id = ? AND id = ?`,
            [...cols.map((c) => patch[c]), workspaceId, id],
          );
        },
        remove: (id) =>
          db.execute(`DELETE FROM ${table} WHERE workspace_id = ? AND id = ?`, [
            workspaceId,
            id,
          ]),
      };
    },
  };
}
