// apps/server/tests/integration/auth-flow.test.js — 登录/令牌/登出/锁定（Auth.md §1/§6）
//
// 用内存 SQLite + bootstrapMigrations + ensureAuthSeed（默认密码 "admin"）搭最小
// 后端，经 createApp 的 Hono fetch 走完整 HTTP 链路。appCache 是模块级单例，
// 每个测试前 clear 避免锁定状态串扰。

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

function setup() {
  const db = createSqliteAdapter(":memory:");
  return db;
}

async function buildApp() {
  appCache.clear();
  const db = setup();
  await bootstrapMigrations(db, SERVER_SRC);
  const settingsStore = createAppSettingsStore(db, "test-key");
  await ensureAuthSeed(settingsStore);
  const app = createApp({ db, env: { APP_ENCRYPTION_KEY: "test-key" } });
  return { db, app };
}

function loginInit(token) {
  return {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-password": token },
    body: JSON.stringify({ durationOption: "24h" }),
  };
}

Deno.test("auth: 错误密码 → 401 AUTH_INVALID_PASSWORD", async () => {
  const { app } = await buildApp();
  const res = await app.request("/api/auth/login", loginInit("wrong"));
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "AUTH_INVALID_PASSWORD");
});

Deno.test("auth: 正确密码登录 → token + storageKind=persistent", async () => {
  const { app } = await buildApp();
  const res = await app.request("/api/auth/login", loginInit("admin"));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(typeof body.data.token, "string");
  assert.equal(body.data.storageKind, "persistent");
});

Deno.test("auth: 无令牌请求 → 401 AUTH_MISSING_TOKEN", async () => {
  const { app } = await buildApp();
  const res = await app.request("/api/settings/profile");
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "AUTH_MISSING_TOKEN");
});

Deno.test("auth: 有效令牌可访问受保护端点", async () => {
  const { app } = await buildApp();
  const login = await app.request("/api/auth/login", loginInit("admin"));
  const { token } = (await login.json()).data;

  const res = await app.request("/api/settings/profile", {
    headers: { "x-auth-password": token },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

Deno.test("auth: 伪造令牌 → 401 AUTH_INVALID_TOKEN", async () => {
  const { app } = await buildApp();
  const res = await app.request("/api/settings/profile", {
    headers: { "x-auth-password": "forged.token.here" },
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "AUTH_INVALID_TOKEN");
});

Deno.test("auth: 连续失败 5 次进入锁定（退避 30s）→ 429 AUTH_LOCKED", async () => {
  const { app } = await buildApp();
  for (let i = 0; i < 5; i++) {
    const res = await app.request("/api/auth/login", loginInit("nope"));
    assert.equal(res.status, 401);
  }
  const res = await app.request("/api/auth/login", loginInit("admin"));
  assert.equal(res.status, 429);
  const body = await res.json();
  assert.equal(body.error.code, "AUTH_LOCKED");
});

Deno.test("auth: 登出后令牌被吊销 → 401 AUTH_REVOKED", async () => {
  const { app } = await buildApp();
  const login = await app.request("/api/auth/login", loginInit("admin"));
  const { token } = (await login.json()).data;

  const logout = await app.request("/api/auth/logout", {
    method: "POST",
    headers: { "x-auth-password": token },
  });
  assert.equal(logout.status, 200);

  const res = await app.request("/api/settings/profile", {
    headers: { "x-auth-password": token },
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "AUTH_REVOKED");
});

Deno.test("auth: /api/health 不需要鉴权", async () => {
  const { app } = await buildApp();
  const res = await app.request("/api/health");
  assert.equal(res.status, 200);
});
