import assert from "node:assert/strict";
import { createSqliteAdapter } from "../../../src/shared/db/sqlite.adapter.js";
import { createWorkspaceService } from "../../../src/shared/workspace/workspace-service.js";
import { createScopedRepository } from "../../../src/shared/db/scoped-repository.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";

Deno.test("workspace: 种子数据与工作空间隔离", async () => {
  const db = await createSqliteAdapter(":memory:");
  await runMigrations(db);

  const wsService = createWorkspaceService(db);
  const workspaces = await wsService.listWorkspaces();
  assert.strictEqual(workspaces.length >= 6, true);

  // System workspace delete should fail
  let errThrown = false;
  try {
    await wsService.deleteWorkspace("ws_default");
  } catch (err) {
    errThrown = true;
    assert.strictEqual(err.message, "WORKSPACE_SYSTEM_CANNOT_DELETE");
  }
  assert.strictEqual(errThrown, true);

  // Custom workspace creation and deletion
  const custom = await wsService.createWorkspace({ name: "Test Project", icon: "folder" });
  assert.ok(custom.id.startsWith("ws_"));

  // Scoped repository isolation check
  await db.execute(`
    CREATE TABLE IF NOT EXISTS test_notes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title TEXT NOT NULL
    );
  `);
  const repo = createScopedRepository(db, "test_notes");
  await repo.forWorkspace(custom.id).insert({ id: "note-1", title: "Custom Note" });
  await repo.forWorkspace("ws_default").insert({ id: "note-2", title: "Default Note" });

  const customNotes = await repo.forWorkspace(custom.id).list();
  const defaultNotes = await repo.forWorkspace("ws_default").list();

  assert.strictEqual(customNotes.length, 1);
  assert.strictEqual(customNotes[0].title, "Custom Note");
  assert.strictEqual(defaultNotes.length, 1);
  assert.strictEqual(defaultNotes[0].title, "Default Note");

  // Cascade delete custom workspace
  await wsService.deleteWorkspace(custom.id, [
    async (wsId) => {
      await db.execute("DELETE FROM test_notes WHERE workspace_id = ?", [wsId]);
    },
  ]);

  const afterNotes = await repo.forWorkspace(custom.id).list();
  assert.strictEqual(afterNotes.length, 0);
});
