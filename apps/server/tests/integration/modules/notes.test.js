import assert from "node:assert/strict";
import { createSqliteAdapter } from "../../../src/shared/db/sqlite.adapter.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";
import { createNotesService } from "../../../src/modules/notes/service.js";

Deno.test("notes: CRUD 与工作空间隔离", async () => {
  const db = await createSqliteAdapter(":memory:");
  await runMigrations(db);

  const service = createNotesService(db);
  const note1 = await service.createNote("ws_default", {
    title: "Note 1",
    content: "Hello",
    tags: "a,b",
  });
  assert.strictEqual(note1.title, "Note 1");

  const note2 = await service.createNote("ws_work", { title: "Work Note", content: "Secret" });
  assert.strictEqual(note2.title, "Work Note");

  const defaultNotes = await service.listNotes("ws_default");
  assert.strictEqual(defaultNotes.length, 1);
  assert.strictEqual(defaultNotes[0].id, note1.id);

  const workNotes = await service.listNotes("ws_work");
  assert.strictEqual(workNotes.length, 1);
  assert.strictEqual(workNotes[0].id, note2.id);

  await service.updateNote("ws_default", note1.id, { title: "Updated Note 1" });
  const updated = await service.getNote("ws_default", note1.id);
  assert.strictEqual(updated.title, "Updated Note 1");

  await service.deleteNote("ws_default", note1.id);
  assert.strictEqual((await service.listNotes("ws_default")).length, 0);
});
