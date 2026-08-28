// apps/web/src/shared/core/store.js — 微型响应式状态（Components.md §3.2）
//
// createStore(initial) 返回 { get, set, subscribe }；set 触发订阅回调（浅比较
// 跳过无变化通知）。sidebar-provider 用它持有状态，子组件经
// element.closest('ds-sidebar-provider').store 订阅，不用框架 Context。

/**
 * @template T
 * @param {T} initial
 */
export function createStore(initial) {
  let state = { ...initial };
  /** @type {Set<(next: T, prev: T) => void>} */
  const listeners = new Set();

  return {
    /** @returns {T} 当前状态快照 */
    get() {
      return { ...state };
    },
    /** @param {Partial<T>} patch */
    set(patch) {
      const prev = state;
      let changed = false;
      const next = { ...prev, ...patch };
      for (const key of Object.keys(patch)) {
        if (next[key] !== prev[key]) changed = true;
      }
      if (!changed) return;
      state = next;
      for (const listener of listeners) listener({ ...state }, prev);
    },
    /**
     * @param {(next: T, prev: T) => void} listener
     * @returns {() => void} 取消订阅
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
