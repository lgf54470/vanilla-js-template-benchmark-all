import assert from "node:assert/strict";
import { decryptField, encryptField } from "../../../../src/shared/crypto/field-crypto.js";
import { timingSafeEqual } from "../../../../src/shared/crypto/constant-time-compare.js";

Deno.test("crypto: encryptField / decryptField 往返一致", async () => {
  const secret = "user@example.com";
  const encrypted = await encryptField(secret);
  assert.notStrictEqual(encrypted, secret);
  const decrypted = await decryptField(encrypted);
  assert.strictEqual(decrypted, secret);
});

Deno.test("crypto: 相同明文产生不同密文 (随机IV)", async () => {
  const secret = "my-secret-token";
  const a = await encryptField(secret);
  const b = await encryptField(secret);
  assert.notStrictEqual(a, b);
});

Deno.test("crypto: timingSafeEqual 常数时间字节比较", () => {
  assert.strictEqual(timingSafeEqual("hello", "hello"), true);
  assert.strictEqual(timingSafeEqual("hello", "world"), false);
  assert.strictEqual(timingSafeEqual("hello", "hell"), false);
});
