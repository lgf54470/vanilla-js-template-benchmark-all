import { createScopedRepository } from "../../shared/db/scoped-repository.js";

export function createPasswordsRepository(db) {
  return createScopedRepository(db, "passwords_items");
}
