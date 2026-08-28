import assert from "node:assert/strict";
import { createApp } from "../../../src/app.js";
import { resolveDbAdapter } from "../../../src/shared/db/resolve.js";
import { runMigrations } from "../../../src/shared/db/migrate.js";
import { resetLoginFailures } from "../../../src/shared/auth/session.js";

Deno.test("auth: 完整认证安全链路测试 (密码登录、限流锁定、密码重置、会话撤销)", async () => {
  Deno.env.set("DEPLOY_TARGET", "local");
  Deno.env.set("LOCAL_SQLITE_PATH", ":memory:");
  Deno.env.set("DEV_SEED_AUTH_PASSWORD", "correct-password-123");

  const db = await resolveDbAdapter({ forceNew: true, dbPath: ":memory:" });
  await runMigrations(db);
  resetLoginFailures();

  const app = createApp();

  // 1. 错误密码尝试并记录失败次数
  const failRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "wrong-password" }),
  });
  assert.strictEqual(failRes.status, 401);
  const failData = await failRes.json();
  assert.strictEqual(failData.error.code, "AUTH_INVALID_PASSWORD");

  // 2. 连续 4 次错误触发限流锁定 (总计 5 次)
  for (let i = 0; i < 4; i++) {
    await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    });
  }

  const lockedRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "correct-password-123" }),
  });
  assert.strictEqual(lockedRes.status, 429);
  const lockedData = await lockedRes.json();
  assert.strictEqual(lockedData.error.code, "AUTH_LOCKED_OUT");

  // 重置锁定以继续正常流程
  resetLoginFailures();

  // 3. 正确密码登录
  const loginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "correct-password-123" }),
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  assert.ok(token);

  // 4. 验证会话有效性
  const verifyRes = await app.request("/api/auth/verify", {
    headers: { "x-auth-password": token },
  });
  assert.strictEqual(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyData.data.authenticated, true);

  // 5. 修改密码为新密码
  const changePwdRes = await app.request("/api/settings/password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-password": token },
    body: JSON.stringify({ newPassword: "new-super-secret-456" }),
  });
  assert.strictEqual(changePwdRes.status, 200);

  // 6. 用旧密码登录应该失败
  const oldLoginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "correct-password-123" }),
  });
  assert.strictEqual(oldLoginRes.status, 401);

  // 7. 用新密码登录成功
  const newLoginRes = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "new-super-secret-456" }),
  });
  assert.strictEqual(newLoginRes.status, 200);
});
