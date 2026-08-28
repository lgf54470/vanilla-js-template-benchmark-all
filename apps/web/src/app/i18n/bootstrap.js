// apps/web/src/app/i18n/bootstrap.js — 字典启动加载（i18n.md §1）
//
// loadLocaleDictionaries(locale)：
//   1. 加载 shared/i18n/<locale>.json（shell 级通用文案）；
//   2. 加载全部模块 modules/<id>/i18n/<locale>.json（只拉当前语言）——
//      侧栏菜单 labelKey 首屏就需要翻译，不能等模块被访问。
// 幂等：重复调用只补缺失的字典（loadDictionary 合并）。模块字典单个失败静默
// 跳过（模块懒加载时 registerModuleI18n 兜底，i18n.md §1）。

import { loadDictionary, setLocale } from "../../shared/lib/i18n.js";
import { moduleRegistry } from "../../modules/registry.generated.js";

const MODULE_DICT_URL = (id, locale) =>
  new URL(`../../modules/${id}/i18n/${locale}.json`, import.meta.url);

/**
 * 加载指定语言的全部字典并设为当前语言。
 * @param {string} locale zh-CN | zh-TW | en
 */
export async function loadLocaleDictionaries(locale) {
  setLocale(locale);
  // shell 级字典失败视为致命（首屏文案依赖它），向上抛出由装配层处理
  await loadDictionary(
    locale,
    new URL(`../../shared/i18n/${locale}.json`, import.meta.url),
  );
  await Promise.allSettled(
    moduleRegistry.map((m) =>
      loadDictionary(locale, MODULE_DICT_URL(m.id, locale))
    ),
  );
}
