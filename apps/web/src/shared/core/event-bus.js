// apps/web/src/shared/core/event-bus.js — 事件总线（ARCHITECTURE.md §4.3）
//
// 跨模块协作的两条合法通道之一："通知类"协作（workspace 切换、主题切换等）。
// 基于 EventTarget，emit/on/off。事件命名约定：<domain>:<action>，
// detail 携带结构化数据。

const bus = new EventTarget();

/**
 * @param {string} type 如 "workspace:changed"
 * @param {unknown} [detail]
 */
export function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * @param {string} type
 * @param {(detail: unknown) => void} handler
 * @returns {() => void} 取消订阅函数
 */
export function on(type, handler) {
  const wrapped = (event) => handler(event.detail);
  bus.addEventListener(type, wrapped);
  return () => bus.removeEventListener(type, wrapped);
}
