import { createSettingsRepository } from "./repository.js";

export function createSettingsService(db) {
  const repo = createSettingsRepository(db);

  return {
    async listSettings(workspaceId) {
      return await repo.forWorkspace(workspaceId).list();
    },

    async setSetting(workspaceId, key, value) {
      const scoped = repo.forWorkspace(workspaceId);
      const rows = await scoped.list("AND key = ?", [key]);
      const now = new Date().toISOString();

      if (rows.length > 0) {
        await scoped.update(rows[0].id, { value: String(value), updated_at: now });
      } else {
        const id = "set_" + crypto.randomUUID().slice(0, 8);
        await scoped.insert({ id, key, value: String(value), updated_at: now });
      }
      return { key, value };
    },
  };
}
