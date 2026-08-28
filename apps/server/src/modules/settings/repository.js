import { createScopedRepository } from "../../shared/db/scoped-repository.js";

export function createSettingsRepository(db) {
  return createScopedRepository(db, "settings_entries");
}
