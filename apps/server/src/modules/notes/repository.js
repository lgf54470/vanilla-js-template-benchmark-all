import { createScopedRepository } from "../../shared/db/scoped-repository.js";

export function createNotesRepository(db) {
  return createScopedRepository(db, "notes_items");
}
