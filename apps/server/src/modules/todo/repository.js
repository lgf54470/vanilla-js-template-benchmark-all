import { createScopedRepository } from "../../shared/db/scoped-repository.js";

export function createTodoRepository(db) {
  return createScopedRepository(db, "todo_items");
}
