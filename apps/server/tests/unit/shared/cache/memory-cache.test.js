import assert from "node:assert/strict";
import { MemoryCache } from "../../../../src/shared/cache/memory-cache.js";

Deno.test("cache: 基本读写与删除", () => {
  const cache = new MemoryCache();
  cache.set("foo", "bar", 60);
  assert.strictEqual(cache.get("foo"), "bar");
  assert.strictEqual(cache.has("foo"), true);
  cache.delete("foo");
  assert.strictEqual(cache.get("foo"), undefined);
});

Deno.test("cache: LRU 淘汰测试", () => {
  const cache = new MemoryCache(2);
  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3); // 'a' should be evicted
  assert.strictEqual(cache.get("a"), undefined);
  assert.strictEqual(cache.get("b"), 2);
  assert.strictEqual(cache.get("c"), 3);
});
