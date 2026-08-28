import assert from "node:assert/strict";
import { createApp } from "../../../src/app.js";
import { resolveDbAdapter } from "../../../src/shared/db/resolve.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";

Deno.test("app: 全链路流程测试 (Health -> Login -> Authenticated Scoped API -> Logout)", async () => {
  Deno.env.set("DEPLOY_TARGET", "local");
  Deno.env.set("LOCAL_SQLITE_PATH", ":memory:");
  Deno.env.set("DEV_SEED_AUTH_PASSWORD", "admin123456");

  const db = await resolveDbAdapter({ forceNew: true, dbPath: ":memory:" });
  await runMigrations(db);

  const app = createApp();

  // 1. Health check
  const healthRes = await app.request("/api/health");
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.ok, true);

  // 2. Unauthenticated request to /api/notes should fail (401)
  const unauthRes = await app.request("/api/notes");
  assert.strictEqual(unauthRes.status, 401);

  // 3. Login
  const loginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "admin123456" }),
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.ok, true);
  const token = loginData.data.token;
  assert.ok(token);

  // 4. Authenticated request to create note in ws_work
  const createNoteRes = await app.request("/api/notes", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-auth-password": token,
      "x-workspace-id": "ws_work",
    },
    body: JSON.stringify({ title: "Work meeting", content: "Discuss Q3 goals" }),
  });
  assert.strictEqual(createNoteRes.status, 200);
  const createData = await createNoteRes.json();
  assert.strictEqual(createData.ok, true);
  assert.strictEqual(createData.data.title, "Work meeting");

  // 5. Query notes from ws_work vs ws_default (workspace isolation)
  const workNotesRes = await app.request("/api/notes", {
    headers: { "x-auth-password": token, "x-workspace-id": "ws_work" },
  });
  const workNotes = await workNotesRes.json();
  assert.strictEqual(workNotes.data.length, 1);

  const defaultNotesRes = await app.request("/api/notes", {
    headers: { "x-auth-password": token, "x-workspace-id": "ws_default" },
  });
  const defaultNotes = await defaultNotesRes.json();
  assert.strictEqual(defaultNotes.data.length, 0);

  // 6. Logout
  const logoutRes = await app.request("/api/auth/logout", {
    method: "POST",
    headers: { "x-auth-password": token },
  });
  assert.strictEqual(logoutRes.status, 200);

  // 7. Request after logout should fail (401)
  const afterLogoutRes = await app.request("/api/notes", {
    headers: { "x-auth-password": token, "x-workspace-id": "ws_work" },
  });
  assert.strictEqual(afterLogoutRes.status, 401);
});
