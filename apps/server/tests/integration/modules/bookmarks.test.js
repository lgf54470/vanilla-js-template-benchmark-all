import assert from "node:assert/strict";
import { createSqliteAdapter } from "../../../src/shared/db/sqlite.adapter.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";
import { createBookmarksService } from "../../../src/modules/bookmarks/service.js";

Deno.test("bookmarks: 收藏列表与分类", async () => {
  const db = await createSqliteAdapter(":memory:");
  await runMigrations(db);

  const service = createBookmarksService(db);
  const bm = await service.createBookmark("ws_default", {
    title: "MDN",
    url: "https://developer.mozilla.org",
    category: "docs",
  });
  assert.strictEqual(bm.title, "MDN");

  const list = await service.listBookmarks("ws_default", "docs");
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].url, "https://developer.mozilla.org");
});
