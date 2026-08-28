/**
 * shared/lib/module-i18n.js — 模块私有字典兜底注册（docs/i18n.md §1）。
 *
 * 模块 index.js 挂载时调用 registerModuleI18n(import.meta.url)：
 * 幂等拉取本模块 i18n/<locale>.json（当前语言 + zh-CN 兜底），失败静默。
 * bootstrap 启动时已加载过全部模块的当前语言字典；本函数覆盖
 * "模块在字典加载后才被访问/新增模块"的场景。
 */
import { fetchJson } from "./fetch-json.js";
import { getActiveLocale, registerDictionary } from "../i18n/translate.js";

/** 已注册过的模块 URL（幂等） */
const registered = new Set();

/**
 * @param {string} moduleMetaUrl 模块 index.js 的 import.meta.url
 * @returns {Promise<void>}
 */
export async function registerModuleI18n(moduleMetaUrl) {
  if (registered.has(moduleMetaUrl)) return;
  registered.add(moduleMetaUrl);
  const locales = [...new Set([getActiveLocale(), "zh-CN"])];
  await Promise.all(
    locales.map(async (locale) => {
      const dict = await fetchJson(
        new URL(`./i18n/${locale}.json`, moduleMetaUrl),
      );
      registerDictionary(locale, dict);
    }),
  );
}
