/**
 * shared/core/store.js — 极简响应式 store（SidebarProvider 等使用，不引框架）。
 */

/**
 * @template T
 * @param {T} initial
 * @returns {{
 *   get: () => T,
 *   set: (patch: Partial<T> | ((prev: T) => Partial<T>)) => void,
 *   subscribe: (fn: (state: T) => void) => () => void,
 * }}
 */
export function createStore(initial) {
  let state = initial;
  /** @type {Set<(s: T) => void>} */
  const listeners = new Set();

  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...next };
      for (const fn of listeners) fn(state);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
