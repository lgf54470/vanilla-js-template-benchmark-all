/**
 * shared/lib/locales.js — 支持的语言清单（docs/i18n.md §7）。
 * 新增语言：追加到 SUPPORTED_LOCALES 并补齐所有 i18n/*.json。
 */

/** 全部支持的语言（首个为默认语言） */
export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en"];

/** 默认语言（无持久化记录时使用） */
export const DEFAULT_LOCALE = "zh-CN";

/** 归一化 locale：不在清单内回落默认语言。 @param {string} locale */
export function normalizeLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}
