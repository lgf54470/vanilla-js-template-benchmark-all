import { createNotesRepository } from "./repository.js";

export function createNotesService(db) {
  const repo = createNotesRepository(db);

  return {
    async listNotes(workspaceId, search = "") {
      const scoped = repo.forWorkspace(workspaceId);
      if (!search) {
        return await scoped.list("ORDER BY is_pinned DESC, updated_at DESC");
      }
      return await scoped.list(
        "AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY is_pinned DESC, updated_at DESC",
        [`%${search}%`, `%${search}%`, `%${search}%`],
      );
    },

    async getNote(workspaceId, id) {
      return await repo.forWorkspace(workspaceId).findById(id);
    },

    async createNote(workspaceId, { title, content = "", tags = "", isPinned = false }) {
      const id = "note_" + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();
      await repo.forWorkspace(workspaceId).insert({
        id,
        title,
        content,
        tags: Array.isArray(tags) ? tags.join(",") : tags,
        is_pinned: isPinned ? 1 : 0,
        created_at: now,
        updated_at: now,
      });
      return await this.getNote(workspaceId, id);
    },

    async updateNote(workspaceId, id, patch) {
      const updateData = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) updateData.title = patch.title;
      if (patch.content !== undefined) updateData.content = patch.content;
      if (patch.tags !== undefined) {
        updateData.tags = Array.isArray(patch.tags) ? patch.tags.join(",") : patch.tags;
      }
      if (patch.isPinned !== undefined) updateData.is_pinned = patch.isPinned ? 1 : 0;

      await repo.forWorkspace(workspaceId).update(id, updateData);
      return await this.getNote(workspaceId, id);
    },

    async deleteNote(workspaceId, id) {
      return await repo.forWorkspace(workspaceId).remove(id);
    },
  };
}
