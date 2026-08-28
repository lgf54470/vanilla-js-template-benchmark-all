/**
 * shared/i18n/translate.js — 组件内最小查表入口。
 *
 * M3 阶段字典尚未加载（M5 接入 loadLocaleDictionaries），t() 直回落入
 * fallback 文案；M5 起由字典加载器调用 setActiveDictionary 注入当前语言。
 */
let active = {};

/** @param {Record<string, string>} dict */
export function setActiveDictionary(dict) {
  active = dict ?? {};
}

/**
 * @param {string} key
 * @param {string} [fallback] 字典未命中时的兜底文案
 * @returns {string}
 */
export function t(key, fallback = "") {
  return active[key] ?? fallback;
}
