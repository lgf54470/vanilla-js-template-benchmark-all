import { createScopedRepository } from "../../shared/db/scoped-repository.js";

export function createBookmarksRepository(db) {
  return createScopedRepository(db, "bookmarks_items");
}
