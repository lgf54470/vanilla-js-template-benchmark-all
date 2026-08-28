// apps/web/src/shared/lib/module-i18n.js — 模块字典幂等注册（i18n.md §1）
//
// 模块 index.js 顶部调用 registerModuleI18n(import.meta.url)：
// 以模块文件 URL 为基准解析 <模块目录>/i18n/<当前语言>.json 并合并进当前语言
// 字典。失败静默（下次访问重试），避免首屏被单个模块字典拖死。

import { getLocale, loadDictionary } from "./i18n.js";

const registered = new Set();

/**
 * @param {string} moduleMetaUrl 模块 index.js 的 import.meta.url
 */
export async function registerModuleI18n(moduleMetaUrl) {
  const locale = getLocale();
  const cacheKey = `${moduleMetaUrl}#${locale}`;
  if (registered.has(cacheKey)) return;
  const url = new URL(`./i18n/${locale}.json`, moduleMetaUrl);
  try {
    await loadDictionary(locale, url);
    registered.add(cacheKey);
  } catch {
    // 静默：字典缺失/网络失败不阻塞模块渲染
  }
}
