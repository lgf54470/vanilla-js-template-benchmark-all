// apps/server/src/modules/notes/repository.js — 笔记存取
//
// 唯一入口 createScopedRepository(db, "notes_note").forWorkspace(id)：
// 结构性保证每条 SQL 都带 workspace_id 过滤（Workspace.md §3，裸查询被
// check-workspace-scope 治理脚本兜底拦截）。

import { createScopedRepository } from "../../shared/db/scoped-repository.js";

/**
 * @param {import("../../shared/db/adapter.js").DbAdapter} db
 */
export function createNotesRepository(db) {
  const scoped = createScopedRepository(db, "notes_note");

  return {
    forWorkspace(workspaceId) {
      const repo = scoped.forWorkspace(workspaceId);

      return {
        /** 列表：固定按 updated_at 倒序；可按 tag 过滤（空串不过滤） */
        list(tag = "") {
          if (tag) {
            return repo.list("AND tag = ? ORDER BY updated_at DESC", [tag]);
          }
          return repo.list("ORDER BY updated_at DESC");
        },
        listTags() {
          // 标签聚合（去重 + 按使用次数倒序），仍带 workspace 过滤
          return db.query(
            `SELECT tag, COUNT(*) AS count FROM notes_note
             WHERE workspace_id = ? AND tag <> '' GROUP BY tag
             ORDER BY count DESC, tag ASC`,
            [workspaceId],
          );
        },
        findById: repo.findById,
        insert: repo.insert,
        update: repo.update,
        remove: repo.remove,
      };
    },
  };
}
