// apps/server/tests/integration/workspaces.test.js — /api/workspaces 列表端点
//
// 回归保护：listWorkspacesCached 的 SELECT 必须带 name/icon/color_token（M4 时
// 曾只查 id/is_system，导致前端 w.name 为 undefined）。同时验证 i18n: 前缀
// 原样透传（前端负责翻译，Workspace.md §5 / i18n.md §5）。

import assert from "node:assert/strict";

import { createSqliteAdapter } from "../../src/shared/db/sqlite.adapter.js";
import {
  bootstrapMigrations,
  ensureAuthSeed,
} from "../../src/shared/db/bootstrap.js";
import { createAppSettingsStore } from "../../src/shared/settings/app-settings.js";
import { appCache } from "../../src/shared/cache/memory-cache.js";
import { createApp } from "../../src/app.js";

const SERVER_SRC = new URL("../../src/", import.meta.url);

async function buildApp() {
  appCache.clear();
  const db = createSqliteAdapter(":memory:");
  await bootstrapMigrations(db, SERVER_SRC);
  const settingsStore = createAppSettingsStore(db, "test-key");
  await ensureAuthSeed(settingsStore);
  const app = createApp({ db, env: { APP_ENCRYPTION_KEY: "test-key" } });
  return { db, app };
}

async function login(app) {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-password": "admin" },
    body: JSON.stringify({ durationOption: "24h" }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  return body.data.token;
}

Deno.test("workspaces: 列表带 name/icon/colorToken 且 i18n: 前缀透传", async () => {
  const { app } = await buildApp();
  const token = await login(app);
  const res = await app.request("/api/workspaces", {
    headers: { "x-auth-password": token },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.length, 6);

  const first = body.data[0];
  assert.equal(first.id, "ws_default");
  assert.equal(first.name, "i18n:workspace.seed.default"); // 原样返回，前端翻译
  assert.equal(first.icon, "home");
  assert.equal(first.colorToken, "zinc");
  assert.equal(first.isSystem, true);
  for (const w of body.data) {
    assert.ok(
      typeof w.name === "string" && w.name.length > 0,
      `name 缺失: ${w.id}`,
    );
    assert.ok(
      typeof w.icon === "string" && w.icon.length > 0,
      `icon 缺失: ${w.id}`,
    );
  }
});

Deno.test("workspaces: 未登录 → 401", async () => {
  const { app } = await buildApp();
  const res = await app.request("/api/workspaces");
  assert.equal(res.status, 401);
});
