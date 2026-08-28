// apps/server/src/modules/notes/repository.js — 笔记存取
//
// 全部业务表访问都经 createScopedRepository(db, "notes_note").forWorkspace(id)：
// 结构性保证每条 SQL 都带 workspace_id 过滤（Workspace.md §3；裸业务表 SQL 由
// check-workspace-scope 治理脚本兜底拦截）。tags 聚合在内存做（工作空间内
// 笔记量级小，避免引入绕过 scoped-repo 的裸查询）。

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
        /** 标签聚合：拉取本工作空间全部笔记后在内存统计（依旧 workspace 隔离） */
        async listTags() {
          const rows = await repo.list("ORDER BY updated_at DESC");
          const count = new Map();
          for (const row of rows) {
            if (!row.tag) continue;
            count.set(row.tag, (count.get(row.tag) ?? 0) + 1);
          }
          return [...count.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([tag, n]) => ({ tag, count: n }));
        },
        findById: repo.findById,
        insert: repo.insert,
        update: repo.update,
        remove: repo.remove,
      };
    },
  };
}
