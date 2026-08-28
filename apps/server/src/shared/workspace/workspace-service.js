import { globalCache } from "../cache/memory-cache.js";
import { createWorkspaceRepository } from "./workspace-repository.js";

const WORKSPACES_CACHE_KEY = "workspaces:all";

export function createWorkspaceService(db) {
  const repo = createWorkspaceRepository(db);

  return {
    async listWorkspaces() {
      const cached = globalCache.get(WORKSPACES_CACHE_KEY);
      if (cached) return cached;

      const list = await repo.listAll();
      globalCache.set(WORKSPACES_CACHE_KEY, list, 60);
      return list;
    },

    async getWorkspace(id) {
      const list = await this.listWorkspaces();
      return list.find((w) => w.id === id) || null;
    },

    async createWorkspace({ name, icon = "folder", colorToken = "zinc" }) {
      const id = "ws_" + crypto.randomUUID().slice(0, 8);
      const list = await this.listWorkspaces();
      const maxOrder = list.reduce((max, w) => Math.max(max, w.sort_order ?? 0), 0);

      const created = await repo.create({
        id,
        name,
        icon,
        color_token: colorToken,
        sort_order: maxOrder + 1,
        is_system: 0,
      });

      globalCache.delete(WORKSPACES_CACHE_KEY);
      return created;
    },

    async updateWorkspace(id, patch) {
      const ws = await repo.findById(id);
      if (!ws) throw new Error("WORKSPACE_NOT_FOUND");

      const updateData = {};
      if (patch.name !== undefined) {
        // If system workspace renamed, clear i18n prefix
        updateData.name = patch.name.startsWith("i18n:") ? patch.name.slice(5) : patch.name;
      }
      if (patch.icon !== undefined) updateData.icon = patch.icon;
      if (patch.colorToken !== undefined) updateData.color_token = patch.colorToken;
      if (patch.sortOrder !== undefined) updateData.sort_order = patch.sortOrder;

      const updated = await repo.update(id, updateData);
      globalCache.delete(WORKSPACES_CACHE_KEY);
      return updated;
    },

    async deleteWorkspace(id, cascadeCleanupFns = []) {
      const ws = await repo.findById(id);
      if (!ws) throw new Error("WORKSPACE_NOT_FOUND");
      if (ws.is_system === 1) {
        throw new Error("WORKSPACE_SYSTEM_CANNOT_DELETE");
      }

      // Execute cascade cleanup handlers
      for (const fn of cascadeCleanupFns) {
        if (typeof fn === "function") {
          await fn(id);
        }
      }

      const deleted = await repo.delete(id);
      globalCache.delete(WORKSPACES_CACHE_KEY);
      return deleted;
    },
  };
}
