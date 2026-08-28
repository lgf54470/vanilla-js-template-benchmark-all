// apps/web/src/shared/lib/i18n.js — 字典存储 + t() 翻译（i18n.md §2-§4）
//
// 字典经 fetchJSON 加载（i18n.md §1），本文件只维护「locale → key → 文案」的
// 内存表与查询函数。回退链：当前语言 → zh-CN → 原样返回 key（本地开发打 warn）。
// 插值：t(key, { name: "x" }) 做 {name} 字符串替换（i18n.md §3），
// 数字/日期格式化用 Intl，不经 i18n JSON。

import { fetchJSON } from "./fetch-json.js";
import { DEFAULT_LOCALE } from "./locales.js";

/** locale → { key: 文案 } */
const dictionaries = {};
let currentLocale = DEFAULT_LOCALE;

/** 是否为本地开发（决定缺失 key 是否打 warn，i18n.md §4） */
function isDev() {
  if (typeof location === "undefined") return false;
  return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

/** 当前语言 */
export function getLocale() {
  return currentLocale;
}

/**
 * 设置当前语言（只改内存状态 + <html lang>；字典加载走 loadLocaleDictionaries）。
 * @param {string} locale
 */
export function setLocale(locale) {
  currentLocale = locale;
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

/**
 * 合并一个字典（幂等：同 key 后加载覆盖先加载，便于 shared 先行、模块后补）。
 * @param {string} locale
 * @param {string|URL} url
 */
export async function loadDictionary(locale, url) {
  const data = await fetchJSON(url);
  dictionaries[locale] = { ...dictionaries[locale], ...data };
}

/** 单测/调试用：直接注入字典内容（不触发网络） */
export function injectDictionary(locale, data) {
  dictionaries[locale] = { ...dictionaries[locale], ...data };
}

/** 清空字典（测试隔离用） */
export function resetDictionaries() {
  for (const k of Object.keys(dictionaries)) delete dictionaries[k];
}

/**
 * 翻译：key 支持点号路径；回退当前 → zh-CN → 原样返回 key（本地开发 warn）。
 * @param {string} key
 * @param {Record<string,string|number>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  let value = dictionaries[currentLocale]?.[key];
  if (value === undefined && currentLocale !== "zh-CN") {
    value = dictionaries["zh-CN"]?.[key];
  }
  if (value === undefined) {
    if (isDev()) {
      console.warn(`[i18n] missing key "${key}" for locale "${currentLocale}"`);
    }
    return key;
  }
  return String(value).replace(
    /\{(\w+)\}/g,
    (_, name) =>
      params[name] !== undefined ? String(params[name]) : `{${name}}`,
  );
}
