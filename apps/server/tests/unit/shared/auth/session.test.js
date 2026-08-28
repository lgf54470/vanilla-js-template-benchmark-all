import assert from "node:assert/strict";
import {
  hashPassword,
  issueSessionToken,
  verifyPassword,
  verifySessionToken,
} from "../../../../src/shared/auth/session.js";

Deno.test("auth: hashPassword 与 verifyPassword 密码校验", async () => {
  const pwd = "my-secure-password";
  const hash = await hashPassword(pwd);
  assert.strictEqual(await verifyPassword(pwd, hash), true);
  assert.strictEqual(await verifyPassword("wrong-password", hash), false);
});

Deno.test("auth: issueSessionToken 与 verifySessionToken 令牌签发与校验", async () => {
  const { token, payload } = await issueSessionToken(3600, "persistent");
  assert.ok(token.includes("."));
  const verified = await verifySessionToken(token);
  assert.strictEqual(verified.jti, payload.jti);
  assert.strictEqual(verified.storageKind, "persistent");
});
