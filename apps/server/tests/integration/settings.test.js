// apps/server/tests/integration/settings.test.js — settings 模块（加密/修改密码）
//
// 覆盖：profile/display 往返；account 敏感字段加密存储（密文不含明文 +
// is_encrypted=1，Database.md §5.1）；修改密码后旧密码失效新密码生效。

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

  const login = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-password": "admin" },
    body: JSON.stringify({ durationOption: "24h" }),
  });
  const { token } = (await login.json()).data;
  const auth = (init = {}) => ({
    ...init,
    headers: { "x-auth-password": token, ...init.headers },
  });
  return { db, app, auth };
}

Deno.test("settings: profile 读写往返", async () => {
  const { app, auth } = await buildApp();
  const put = await app.request(
    "/api/settings/profile",
    auth({
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname: "Buffy" }),
    }),
  );
  assert.equal(put.status, 200);

  const get = await app.request("/api/settings/profile", auth());
  const data = (await get.json()).data;
  assert.equal(data.nickname, "Buffy");
});

Deno.test("settings: account 邮箱加密存储", async () => {
  const { db, app, auth } = await buildApp();
  const put = await app.request(
    "/api/settings/account",
    auth({
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        phone: "13800001234",
        name: "B",
      }),
    }),
  );
  assert.equal(put.status, 200);

  // 原始存储必须是密文 + 加密标记
  const raw = await db.query(
    "SELECT value, is_encrypted FROM app_settings WHERE key = 'settings:account'",
    [],
  );
  assert.equal(raw.length, 1);
  assert.equal(raw[0].is_encrypted, 1);
  assert.ok(!raw[0].value.includes("user@example.com"));
  assert.ok(!raw[0].value.includes("13800001234"));

  // 接口返回解密后的明文（前端再做掩码，Database.md §5.3）
  const get = await app.request("/api/settings/account", auth());
  const data = (await get.json()).data;
  assert.equal(data.email, "user@example.com");
  assert.equal(data.phone, "13800001234");
});

Deno.test("settings: 修改密码——旧密码失效新密码生效", async () => {
  const { app, auth } = await buildApp();

  // 错误当前密码 → 401
  const bad = await app.request(
    "/api/settings/password",
    auth({
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "wrong",
        nextPassword: "new-pass-123",
      }),
    }),
  );
  assert.equal(bad.status, 401);

  // 正确当前密码 → 200
  const ok = await app.request(
    "/api/settings/password",
    auth({
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: "admin",
        nextPassword: "new-pass-123",
      }),
    }),
  );
  assert.equal(ok.status, 200);

  // 旧密码登录失败，新密码登录成功
  const oldLogin = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-password": "admin" },
    body: JSON.stringify({ durationOption: "24h" }),
  });
  assert.equal(oldLogin.status, 401);

  const newLogin = await app.request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-auth-password": "new-pass-123",
    },
    body: JSON.stringify({ durationOption: "24h" }),
  });
  assert.equal(newLogin.status, 200);
});

Deno.test("settings: 非法邮箱返回 400 VALIDATION_ERROR", async () => {
  const { app, auth } = await buildApp();
  const res = await app.request(
    "/api/settings/account",
    auth({
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    }),
  );
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "VALIDATION_ERROR");
});
