// apps/server/src/shared/cache/memory-cache.js — 进程内 TTL 缓存（ARCHITECTURE.md §12.1）
//
// 简单 Map + 惰性过期。用于 core_workspaces 列表（TTL 60s）、会话吊销查询
// （TTL 30s）、登录失败计数等。写操作后主动 invalidate 对应键避免等 TTL。

/**
 * @param {{ ttlMs?: number, maxEntries?: number }} options
 */
export function createMemoryCache({ ttlMs = 60_000, maxEntries = 2000 } = {}) {
  /** @type {Map<string, { value: unknown, expiresAt: number }>} */
  const store = new Map();

  function pruneExpired() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }

  /** 插入后超量时淘汰最早写入的条目（FIFO 近似，够用即可） */
  function evictIfOver() {
    while (store.size > maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest === undefined) break;
      store.delete(oldest);
    }
  }

  return {
    /** @returns {unknown | undefined} */
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value, ttl = ttlMs) {
      pruneExpired();
      store.set(key, { value, expiresAt: Date.now() + ttl });
      evictIfOver();
    },
    delete(key) {
      store.delete(key);
    },
    /** 按前缀批量失效（如 session: 前缀） */
    invalidatePrefix(prefix) {
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    },
    clear() {
      store.clear();
    },
    get size() {
      return store.size;
    },
  };
}

/** 应用级单例：默认 TTL 60s（Workspace.md §5） */
export const appCache = createMemoryCache();
