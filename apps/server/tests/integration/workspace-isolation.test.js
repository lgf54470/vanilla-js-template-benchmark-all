// apps/server/tests/integration/workspace-isolation.test.js — 工作空间隔离红线
//
// Workspace.md §8 回归清单：
//   1. 隔离性：工作空间 A 的数据在 B 查询不到
//   2. 默认回退：缺失/非法 x-workspace-id 回退 ws_default 而不是 500
// 用内存 SQLite + 全部核心迁移（含 6 个系统工作空间种子）。

import assert from "node:assert/strict";

import { Hono } from "../../../../packages/lib/hono/dist/hono.js";
import { createSqliteAdapter } from "../../src/shared/db/sqlite.adapter.js";
import { bootstrapMigrations } from "../../src/shared/db/bootstrap.js";
import { createWorkspaceMiddleware } from "../../src/shared/workspace/workspace-middleware.js";
import { createScopedRepository } from "../../src/shared/db/scoped-repository.js";

const SERVER_SRC = new URL("../../src/", import.meta.url);

async function setup() {
  const db = createSqliteAdapter(":memory:");
  await bootstrapMigrations(db, SERVER_SRC);
  // 测试用业务表（真实表由 notes 模块迁移创建，这里按 Testing.md §集成测试 模板直建）
  await db.execute(
    `CREATE TABLE notes_data (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  );
  return db;
}

Deno.test("workspace: 隔离性——A 的数据在 B 查询为空（回归红线）", async () => {
  const db = await setup();
  const repo = createScopedRepository(db, "notes_data");

  await repo.forWorkspace("ws_work").insert({
    id: "1",
    title: "work note",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  });
  await repo.forWorkspace("ws_life").insert({
    id: "2",
    title: "life note",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  });

  const workRows = await repo.forWorkspace("ws_work").list();
  const lifeRows = await repo.forWorkspace("ws_life").list();

  assert.equal(workRows.length, 1);
  assert.equal(workRows[0].title, "work note");
  assert.equal(lifeRows.length, 1);
  assert.equal(lifeRows[0].title, "life note");

  // 交叉查询必然为空（红线断言）
  assert.deepEqual(
    await repo.forWorkspace("ws_study").list(),
    [],
  );
});

Deno.test("workspace: 缺省回退——无头/非法头均回退 ws_default 而不是 500", async () => {
  const db = await setup();
  const app = new Hono();
  app.use("*", (c, next) => {
    c.set("db", db);
    return next();
  });
  app.use("*", createWorkspaceMiddleware());
  app.get("/api/whoami", (c) => c.json({ ws: c.get("workspaceId") }));

  // 无头
  const r1 = await app.request("/api/whoami");
  assert.equal(r1.status, 200);
  assert.equal((await r1.json()).ws, "ws_default");

  // 非法头
  const r2 = await app.request("/api/whoami", {
    headers: { "x-workspace-id": "ws_does_not_exist" },
  });
  assert.equal(r2.status, 200);
  assert.equal((await r2.json()).ws, "ws_default");

  // 合法头
  const r3 = await app.request("/api/whoami", {
    headers: { "x-workspace-id": "ws_work" },
  });
  assert.equal(r3.status, 200);
  assert.equal((await r3.json()).ws, "ws_work");
});

Deno.test("workspace: 系统工作空间种子存在且 is_system=1", async () => {
  const db = await setup();
  const rows = await db.query(
    "SELECT id, is_system FROM core_workspaces ORDER BY sort_order ASC",
    [],
  );
  assert.equal(rows.length, 6);
  assert.ok(rows.every((r) => r.is_system === 1));
  assert.equal(rows[0].id, "ws_default");
});
