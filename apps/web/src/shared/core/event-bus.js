// shared/core/event-bus.js — 基于 EventTarget 的全局事件总线（ARCHITECTURE.md §4.3）。
// 模块间"通知类"协作的唯一合法通道之一：workspace:changed、locale:changed、
// appearance:changed、auth:changed、auth:unauthorized 等都走这里，禁止跨模块 import。

const target = new EventTarget();

/** 广播全局事件（detail 结构化数据）。 */
export function emit(type, detail) {
  target.dispatchEvent(new CustomEvent(type, { detail }));
}

/** 订阅全局事件，返回取消订阅函数。 */
export function on(type, handler) {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}

/** 订阅一次。 */
export function once(type, handler) {
  const wrapped = (event) => {
    off(type, wrapped);
    handler(event);
  };
  target.addEventListener(type, wrapped);
}
