// apps/server/src/modules/notes/service.js — 笔记业务逻辑
//
// 只做校验与字段清洗，SQL 一律不出现（repository 层负责存取）。CRUD 全部
// 以 workspaceId 为第一参数（由路由从 x-workspace-id 上下文取出后传入）。

const TITLE_MAX = 120;
const CONTENT_MAX = 20_000;
const TAG_MAX = 30;

function cleanNoteInput(body) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    const err = new Error("标题不能为空");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  if (title.length > TITLE_MAX) {
    const err = new Error(`标题最长 ${TITLE_MAX} 字`);
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  const content = typeof body?.content === "string"
    ? body.content.slice(0, CONTENT_MAX)
    : "";
  const tag = typeof body?.tag === "string"
    ? body.tag.trim().slice(0, TAG_MAX)
    : "";
  const isPinned = body?.isPinned === true || body?.isPinned === 1;
  return { title, content, tag, is_pinned: isPinned ? 1 : 0 };
}

function toNote(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tag: row.tag,
    isPinned: row.is_pinned === 1, // 同名字段（snake_case 列 → camelCase 响应）
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createNotesService({ repo }) {
  return {
    async list(workspaceId, tag = "") {
      const rows = await repo.forWorkspace(workspaceId).list(tag);
      return rows.map(toNote);
    },

    async listTags(workspaceId) {
      const rows = await repo.forWorkspace(workspaceId).listTags();
      return rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
    },

    async create(workspaceId, body) {
      const input = cleanNoteInput(body);
      const now = new Date().toISOString();
      const row = { ...input, created_at: now, updated_at: now };
      const result = await repo.forWorkspace(workspaceId).insert(row);
      const id = Number(result.lastInsertRowid);
      return this.get(workspaceId, id);
    },

    async get(workspaceId, id) {
      const row = await repo.forWorkspace(workspaceId).findById(id);
      if (!row) {
        const err = new Error("笔记不存在");
        err.code = "NOT_FOUND";
        throw err;
      }
      return toNote(row);
    },

    async update(workspaceId, id, body) {
      const existing = await repo.forWorkspace(workspaceId).findById(id);
      if (!existing) {
        const err = new Error("笔记不存在");
        err.code = "NOT_FOUND";
        throw err;
      }
      const input = cleanNoteInput(body);
      await repo.forWorkspace(workspaceId).update(id, {
        ...input,
        updated_at: new Date().toISOString(),
      });
      return this.get(workspaceId, id);
    },

    async remove(workspaceId, id) {
      const result = await repo.forWorkspace(workspaceId).remove(id);
      if (Number(result.changes) === 0) {
        const err = new Error("笔记不存在");
        err.code = "NOT_FOUND";
        throw err;
      }
      return { ok: true };
    },
  };
}
