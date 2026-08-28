// apps/web/src/shared/lib/locales.js — 支持语言常量与展示标签（i18n.md §7）
//
// SUPPORTED_LOCALES 与 packages/contracts/constants.js 的常量同源（re-export），
// 新增语言只需改 contracts 一处 + 补字典；<ds-lang-switch> 自动读本文件。

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@contracts/constants.js";

/** 语言 → 显示名（lang-switch 下拉选项） */
export const LOCALE_LABELS = Object.freeze({
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
});

export { DEFAULT_LOCALE, SUPPORTED_LOCALES };
