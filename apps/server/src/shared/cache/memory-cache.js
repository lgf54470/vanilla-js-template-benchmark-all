/**
 * shared/cache/memory-cache.js — 极简 TTL + LRU 进程内缓存（ARCHITECTURE.md §12.1）。
 *
 * 用于每请求必读的热数据（core_workspaces 列表 / 登录失败计数 / core_sessions
 * 点查）。边缘 isolate 生命周期不保证跨请求复用，本缓存是"尽力而为"的优化，
 * 真正一致性来自数据库。
 */
export function createMemoryCache({ maxEntries = 100 } = {}) {
  const store = new Map(); // key → { value, expiresAt }

  function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    // LRU：访问即移到 Map 尾部（最新）
    store.delete(key);
    store.set(key, entry);
    return entry.value;
  }

  function set(key, value, ttlMs = 60_000) {
    if (store.has(key)) store.delete(key);
    else if (store.size >= maxEntries) {
      store.delete(store.keys().next().value); // 淘汰最旧
    }
    store.set(key, {
      value,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
    });
    return value;
  }

  function del(key) {
    return store.delete(key);
  }

  function clear() {
    store.clear();
  }

  return {
    get,
    set,
    del,
    delete: del,
    clear,
    get size() {
      return store.size;
    },
  };
}
