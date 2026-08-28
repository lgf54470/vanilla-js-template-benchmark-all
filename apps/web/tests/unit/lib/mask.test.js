import assert from "node:assert/strict";
import { maskValue } from "../../../src/shared/lib/mask.js";

Deno.test("mask: email 掩码", () => {
  const masked = maskValue("alice@example.com", "email");
  assert.strictEqual(masked.startsWith("a***"), true);
  assert.strictEqual(masked.includes("@"), true);
});

Deno.test("mask: phone 掩码", () => {
  const masked = maskValue("13812345678", "phone");
  assert.strictEqual(masked, "138****5678");
});

Deno.test("mask: generic 掩码", () => {
  const masked = maskValue("sk-1234567890abcdef", "generic");
  assert.strictEqual(masked.startsWith("sk-"), true);
  assert.strictEqual(masked.endsWith("def"), true);
  assert.strictEqual(masked.includes("******"), true);
});
