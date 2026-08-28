// apps/server/src/shared/db/scoped-repository.js — 工作空间强制隔离封装器
//
// repository.js 只能通过 createScopedRepository(db, table).forWorkspace(workspaceId)
// 访问业务表，不暴露不带 forWorkspace 的裸查询方法——这是"业务代码无法遗漏
// workspace 过滤"的结构性保证（Workspace.md §3；check-workspace-scope.js 只是兜底）。

/**
 * @param {import("./adapter.js").DbAdapter} db
 * @param {string} table 表名（模块自有，白名单：/^[a-z][a-z0-9_]*$/）
 */
export function createScopedRepository(db, table) {
  if (!/^[a-z][a-z0-9_]*$/.test(table)) {
    throw new Error(`createScopedRepository: 非法表名 "${table}"`);
  }
  return {
    forWorkspace(workspaceId) {
      if (!workspaceId) {
        throw new Error(`workspaceId is required to access "${table}"`);
      }
      return {
        /** extraWhere 为附加参数化谓词（不含 WHERE 关键字），extraParams 对应占位符 */
        list: (extraWhere = "", extraParams = []) =>
          db.query(
            `SELECT * FROM ${table} WHERE workspace_id = ? ${extraWhere}`,
            [workspaceId, ...extraParams],
          ),
        findById: (id) =>
          db.query(
            `SELECT * FROM ${table} WHERE workspace_id = ? AND id = ?`,
            [workspaceId, id],
          ).then((rows) => rows[0] ?? null),
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
          db.execute(
            `DELETE FROM ${table} WHERE workspace_id = ? AND id = ?`,
            [workspaceId, id],
          ),
        /** 级联删除：删除该工作空间在本表的全部数据（Workspace.md §6） */
        deleteAll: () =>
          db.execute(
            `DELETE FROM ${table} WHERE workspace_id = ?`,
            [workspaceId],
          ),
      };
    },
  };
}
