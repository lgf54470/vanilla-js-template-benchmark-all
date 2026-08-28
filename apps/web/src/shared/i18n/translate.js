/**
 * shared/i18n/translate.js — 查表翻译入口（docs/i18n.md §3/§4）。
 *
 * 按语言维护合并字典（Map<locale, dict>，多来源经 registerDictionary
 * 增量合并，shell 与模块字典同住一张表）；激活语言只决定查表顺序，
 * 与注册时序无关。
 *
 * t(key, params)：
 * - 查找顺序 当前语言 → zh-CN → 代码内兜底 → key 原样返回（i18n.md §4）；
 * - params 为对象时做 {name} 简单插值；
 * - params 为字符串时作为"代码内兜底文案"（早于裸 key 生效，
 *   供 shell 侧组件在字典缺失时仍可读）。
 */

let currentLocale = "zh-CN";

/** @type {Map<string, Record<string, string>>} locale → 合并字典 */
const dictionaries = new Map();

/** 当前激活语言。 @returns {string} */
export function getActiveLocale() {
  return currentLocale;
}

/**
 * 切换激活语言（字典需已就位；由 bootstrap 维护调用时序）。
 * @param {string} locale
 */
export function setActiveLocale(locale) {
  currentLocale = locale;
}

/**
 * 增量注册一份字典（同 key 后写覆盖，模块晚于 shell 加载）。
 * 与激活顺序无关：始终写入对应语言的合并表。
 * @param {string} locale 该字典的语言
 * @param {Record<string, string>} dict
 */
export function registerDictionary(locale, dict) {
  if (!dict || typeof dict !== "object") return;
  const merged = Object.assign({}, dictionaries.get(locale) ?? {}, dict);
  dictionaries.set(locale, merged);
}

/**
 * 翻译 key。
 * @param {string} key
 * @param {Record<string, string> | string} [params] 插值参数或兜底文案
 * @returns {string}
 */
export function t(key, params) {
  const current = dictionaries.get(currentLocale) ?? {};
  const fallback = dictionaries.get("zh-CN") ?? {};
  const text = current[key] ?? fallback[key] ??
    (typeof params === "string" ? params : key);
  if (text === key && !(key in current) && !(key in fallback)) {
    warnMissing(key);
  }
  if (params && typeof params === "object") {
    return text.replace(
      /\{(\w+)\}/g,
      (_, name) => params[name] != null ? String(params[name]) : `{${name}}`,
    );
  }
  return text;
}

/* 开发模式（local target）缺失 key 提示；生产静默（i18n.md §4） */
const DEV = globalThis.location?.hostname === "localhost";
const warned = new Set();
function warnMissing(key) {
  if (!DEV || warned.has(key)) return;
  warned.add(key);
  console.warn(`[i18n] missing key "${key}" for locale "${currentLocale}"`);
}
