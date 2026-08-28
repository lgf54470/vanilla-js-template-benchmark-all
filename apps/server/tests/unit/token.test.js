// apps/server/tests/unit/token.test.js — HMAC 会话令牌
import assert from "node:assert/strict";

import {
  signSessionToken,
  verifySessionToken,
} from "../../src/shared/auth/token.js";

const SECRET = "test-secret";

Deno.test("token: 签发-校验往返（含 exp）", async () => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = await signSessionToken({ jti: "abc-123", exp }, SECRET);
  const payload = await verifySessionToken(token, SECRET);
  assert.equal(payload.jti, "abc-123");
  assert.equal(typeof payload.iat, "number");
  assert.equal(payload.exp, exp);
});

Deno.test("token: 篡改载荷/签名被拒绝", async () => {
  const token = await signSessionToken({ jti: "abc" }, SECRET);
  const [payload, sig] = token.split(".");
  const tampered = `${payload}x.${sig}`;
  assert.equal(await verifySessionToken(tampered, SECRET), null);
  assert.equal(await verifySessionToken("garbage", SECRET), null);
  assert.equal(await verifySessionToken("", SECRET), null);
});

Deno.test("token: 错误密钥被拒绝", async () => {
  const token = await signSessionToken({ jti: "abc" }, SECRET);
  assert.equal(await verifySessionToken(token, "other-secret"), null);
});

Deno.test("token: 过期令牌被拒绝", async () => {
  const token = await signSessionToken({ jti: "old", exp: 1 }, SECRET);
  assert.equal(await verifySessionToken(token, SECRET), null);
});

Deno.test("token: 无 exp 令牌有效（session 型远期兜底场景）", async () => {
  const token = await signSessionToken({ jti: "no-exp" }, SECRET);
  const payload = await verifySessionToken(token, SECRET);
  assert.equal(payload.jti, "no-exp");
});
