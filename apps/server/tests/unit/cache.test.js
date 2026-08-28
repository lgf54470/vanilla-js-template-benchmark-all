// apps/server/tests/unit/cache.test.js — 进程内 TTL 缓存
import assert from "node:assert/strict";

import { createMemoryCache } from "../../src/shared/cache/memory-cache.js";

Deno.test("memory-cache: set/get/delete", () => {
  const cache = createMemoryCache();
  assert.equal(cache.get("k"), undefined);
  cache.set("k", { v: 1 });
  assert.deepEqual(cache.get("k"), { v: 1 });
  cache.delete("k");
  assert.equal(cache.get("k"), undefined);
});

Deno.test("memory-cache: TTL 过期", async () => {
  const cache = createMemoryCache();
  cache.set("k", "v", 50);
  assert.equal(cache.get("k"), "v");
  await new Promise((r) => setTimeout(r, 80));
  assert.equal(cache.get("k"), undefined);
});

Deno.test("memory-cache: invalidatePrefix", () => {
  const cache = createMemoryCache();
  cache.set("session:a", 1);
  cache.set("session:b", 2);
  cache.set("other", 3);
  cache.invalidatePrefix("session:");
  assert.equal(cache.get("session:a"), undefined);
  assert.equal(cache.get("session:b"), undefined);
  assert.equal(cache.get("other"), 3);
});

Deno.test("memory-cache: maxEntries 淘汰", () => {
  const cache = createMemoryCache({ maxEntries: 3 });
  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);
  cache.set("d", 4);
  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.get("d"), 4);
});
