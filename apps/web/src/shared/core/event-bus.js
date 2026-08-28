/**
 * shared/core/event-bus.js — 模块间唯一通信通道之一（ARCHITECTURE §4）。
 * 跨模块 import 被禁止，解耦通信走本总线（on/emit）或 module-registry。
 */

/** @type {Map<string, Set<(detail: unknown) => void>>} */
const topics = new Map();

/**
 * 订阅主题。返回取消订阅函数。
 * @param {string} topic
 * @param {(detail: unknown) => void} fn
 * @returns {() => void}
 */
export function on(topic, fn) {
  if (!topics.has(topic)) topics.set(topic, new Set());
  topics.get(topic).add(fn);
  return () => topics.get(topic)?.delete(fn);
}

/**
 * 广播事件（同步派发给全部订阅者）。
 * @param {string} topic
 * @param {unknown} [detail]
 */
export function emit(topic, detail) {
  for (const fn of topics.get(topic) ?? []) {
    try {
      fn(detail);
    } catch (err) {
      console.error(`event-bus: ${topic} 处理器异常`, err);
    }
  }
}
