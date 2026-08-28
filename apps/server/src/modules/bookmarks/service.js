import { createBookmarksRepository } from "./repository.js";

export function createBookmarksService(db) {
  const repo = createBookmarksRepository(db);

  return {
    async listBookmarks(workspaceId, category = "") {
      const scoped = repo.forWorkspace(workspaceId);
      if (!category) {
        return await scoped.list("ORDER BY created_at DESC");
      }
      return await scoped.list("AND category = ? ORDER BY created_at DESC", [category]);
    },

    async createBookmark(workspaceId, { title, url, category = "default", description = "" }) {
      const id = "bm_" + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();
      await repo.forWorkspace(workspaceId).insert({
        id,
        title,
        url,
        category,
        description,
        created_at: now,
        updated_at: now,
      });
      return await repo.forWorkspace(workspaceId).findById(id);
    },

    async updateBookmark(workspaceId, id, patch) {
      const updateData = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) updateData.title = patch.title;
      if (patch.url !== undefined) updateData.url = patch.url;
      if (patch.category !== undefined) updateData.category = patch.category;
      if (patch.description !== undefined) updateData.description = patch.description;

      await repo.forWorkspace(workspaceId).update(id, updateData);
      return await repo.forWorkspace(workspaceId).findById(id);
    },

    async deleteBookmark(workspaceId, id) {
      return await repo.forWorkspace(workspaceId).remove(id);
    },
  };
}
