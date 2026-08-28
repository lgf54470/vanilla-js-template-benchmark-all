import { createPasswordsRepository } from "./repository.js";
import { decryptField, encryptField } from "../../shared/crypto/field-crypto.js";

export function createPasswordsService(db) {
  const repo = createPasswordsRepository(db);

  return {
    async listPasswords(workspaceId) {
      const scoped = repo.forWorkspace(workspaceId);
      const rows = await scoped.list("ORDER BY created_at DESC");

      return await Promise.all(
        rows.map(async (row) => ({
          ...row,
          password: await decryptField(row.encrypted_password),
        })),
      );
    },

    async createPassword(workspaceId, { title, username, password, website = "", notes = "" }) {
      const id = "pwd_" + crypto.randomUUID().slice(0, 8);
      const now = new Date().toISOString();
      const encrypted = await encryptField(password);

      await repo.forWorkspace(workspaceId).insert({
        id,
        title,
        username,
        encrypted_password: encrypted,
        website,
        notes,
        created_at: now,
        updated_at: now,
      });

      return {
        id,
        workspace_id: workspaceId,
        title,
        username,
        password,
        website,
        notes,
        created_at: now,
        updated_at: now,
      };
    },

    async updatePassword(workspaceId, id, patch) {
      const updateData = { updated_at: new Date().toISOString() };
      if (patch.title !== undefined) updateData.title = patch.title;
      if (patch.username !== undefined) updateData.username = patch.username;
      if (patch.website !== undefined) updateData.website = patch.website;
      if (patch.notes !== undefined) updateData.notes = patch.notes;
      if (patch.password !== undefined) {
        updateData.encrypted_password = await encryptField(patch.password);
      }

      await repo.forWorkspace(workspaceId).update(id, updateData);
      const updated = await repo.forWorkspace(workspaceId).findById(id);
      return {
        ...updated,
        password: await decryptField(updated.encrypted_password),
      };
    },

    async deletePassword(workspaceId, id) {
      return await repo.forWorkspace(workspaceId).remove(id);
    },
  };
}
