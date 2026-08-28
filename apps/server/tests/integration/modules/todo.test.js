import assert from "node:assert/strict";
import { createSqliteAdapter } from "../../../src/shared/db/sqlite.adapter.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";
import { createTodoService } from "../../../src/modules/todo/service.js";

Deno.test("todo: 任务状态与过滤", async () => {
  const db = await createSqliteAdapter(":memory:");
  await runMigrations(db);

  const service = createTodoService(db);
  const t1 = await service.createTodo("ws_default", { title: "Buy groceries", priority: "high" });
  assert.strictEqual(t1.status, "pending");

  const t2 = await service.createTodo("ws_default", { title: "Read book", priority: "low" });
  await service.updateTodo("ws_default", t2.id, { status: "completed" });

  const pendingList = await service.listTodos("ws_default", "pending");
  assert.strictEqual(pendingList.length, 1);
  assert.strictEqual(pendingList[0].id, t1.id);

  const completedList = await service.listTodos("ws_default", "completed");
  assert.strictEqual(completedList.length, 1);
  assert.strictEqual(completedList[0].id, t2.id);
});
