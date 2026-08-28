/**
 * app/i18n/bootstrap.js — 字典加载与语言切换（docs/i18n.md §1）。
 *
 * 启动：initI18n() 读 pref:locale → 依次加载 zh-CN 兜底字典与目标语言
 * 字典（shared/i18n + 全部模块 i18n，只加载当前语言）→ 激活并写
 * <html lang>。
 *
 * 切换：setLocale(locale) 由壳层在 lang-switch 交互后调用——先加载
 * 字典就绪再激活 + 广播 locale:changed（main.js 据此重挂壳层/登录页，
 * 避免字典未就绪渲染出旧语言或裸 key）。
 *
 * 按语言幂等、失败静默可重试（fetchJson 空字典语义）。
 */
import { fetchJson } from "/src/shared/lib/fetch-json.js";
import { DEFAULT_LOCALE, normalizeLocale } from "/src/shared/lib/locales.js";
import {
  getActiveLocale,
  registerDictionary,
  setActiveLocale,
} from "/src/shared/i18n/translate.js";
import { emit } from "/src/shared/core/event-bus.js";
import { STORAGE_KEYS } from "/packages/contracts/constants.js";
import { MODULE_REGISTRY } from "/src/modules/registry.generated.js";

/** 已完成加载的语言（幂等） */
const loadedLocales = new Set();

/**
 * 加载某语言的全部字典（shared + 各模块）并注册。
 * @param {string} locale
 */
export async function loadLocaleDictionaries(locale) {
  const loc = normalizeLocale(locale);
  if (loadedLocales.has(loc)) return;
  const urls = [
    new URL(`../../shared/i18n/${loc}.json`, import.meta.url).href,
    ...MODULE_REGISTRY.map(
      (m) => `/src/modules/${m.id}/i18n/${loc}.json`,
    ),
  ];
  const dicts = await Promise.all(urls.map((u) => fetchJson(u)));
  const merged = Object.assign({}, ...dicts);
  loadedLocales.add(loc);
  registerDictionary(loc, merged);
  // 当前语言即目标语言时注册生效（先 add 再 register，重试安全）
  if (loc !== "zh-CN" && getActiveLocale() === loc) {
    registerDictionary(loc, merged);
  }
}

/** 读持久化语言（无记录回落默认语言）。 */
function storedLocale() {
  try {
    return normalizeLocale(
      globalThis.localStorage?.getItem(STORAGE_KEYS.locale) ?? "",
    );
  } catch {
    return DEFAULT_LOCALE;
  }
}

/**
 * 启动初始化：字典就绪后才返回（main.js 在渲染前 await）。
 * @returns {Promise<void>}
 */
export async function initI18n() {
  const locale = storedLocale();
  await loadLocaleDictionaries("zh-CN"); // 兜底语言常驻
  if (locale !== "zh-CN") await loadLocaleDictionaries(locale);
  setActiveLocale(locale);
  document.documentElement.lang = locale;
}

/**
 * 切换语言：持久化 → 字典就绪 → 激活 + 广播 locale:changed。
 * @param {string} locale
 */
export async function setLocale(locale) {
  const loc = normalizeLocale(locale);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEYS.locale, loc);
  } catch {
    /* 隐私模式等场景下静默跳过持久化 */
  }
  await loadLocaleDictionaries(loc);
  setActiveLocale(loc);
  document.documentElement.lang = loc;
  emit("locale:changed", { locale: loc });
}
