// apps/server/tests/unit/crypto.test.js — 常数时间比较 / PBKDF2 / AES-GCM 字段加密
import assert from "node:assert/strict";

import { constantTimeEqual } from "../../src/shared/crypto/constant-time-compare.js";
import {
  hashPassword,
  verifyPassword,
} from "../../src/shared/crypto/password.js";
import {
  decryptField,
  encryptField,
} from "../../src/shared/crypto/field-crypto.js";

Deno.test("constantTimeEqual: 等长相等/不等/长度不等", () => {
  assert.equal(constantTimeEqual("hello", "hello"), true);
  assert.equal(constantTimeEqual("hello", "hallo"), false);
  assert.equal(constantTimeEqual("hello", "hell"), false);
  assert.equal(constantTimeEqual("", ""), true);
});

Deno.test("constantTimeEqual: Uint8Array 输入", () => {
  const a = new TextEncoder().encode("abc");
  const b = new TextEncoder().encode("abc");
  const c = new TextEncoder().encode("abd");
  assert.equal(constantTimeEqual(a, b), true);
  assert.equal(constantTimeEqual(a, c), false);
});

Deno.test("password: hash/verify 往返 + 错误密码 + 存储格式", async () => {
  const hash = await hashPassword("s3cret-pass");
  assert.ok(hash.startsWith("pbkdf2$"));
  assert.equal(hash.split("$").length, 4);

  assert.equal(await verifyPassword("s3cret-pass", hash), true);
  assert.equal(await verifyPassword("wrong-pass", hash), false);
  assert.equal(await verifyPassword("s3cret-pass", "garbage"), false);
});

Deno.test("password: 同一密码两次哈希结果不同（随机盐）", async () => {
  const h1 = await hashPassword("same");
  const h2 = await hashPassword("same");
  assert.notEqual(h1, h2);
  assert.equal(await verifyPassword("same", h1), true);
  assert.equal(await verifyPassword("same", h2), true);
});

Deno.test("field-crypto: 加密-解密往返 + 密文不含明文 + 密钥不同解不开", async () => {
  const payload = await encryptField("user@example.com", "key-material");
  assert.ok(!payload.includes("user@example.com"));
  assert.equal(await decryptField(payload, "key-material"), "user@example.com");
  await assertRejects(decryptField(payload, "other-key"));
});

Deno.test("field-crypto: 篡改密文解密失败", async () => {
  const payload = await encryptField("secret", "k");
  const bytes = atob(payload);
  const tampered = btoa(bytes.slice(0, -1) + (bytes.endsWith("A") ? "B" : "A"));
  await assertRejects(decryptField(tampered, "k"));
});

async function assertRejects(promise) {
  let threw = false;
  try {
    await promise;
  } catch {
    threw = true;
  }
  assert.ok(threw, "预期抛错但未抛");
}
