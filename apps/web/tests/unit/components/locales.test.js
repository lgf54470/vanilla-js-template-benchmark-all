// apps/web/tests/unit/components/locales.test.js — 语言切换组件数据源单测
//
// <ds-lang-switch> 遍历 SUPPORTED_LOCALES 渲染选项、用 LOCALE_LABELS 显示名。
// 本测试守护：支持语言恒为三语且与字典目录一致；每个语言都有显示名；
// DEFAULT_LOCALE 必在支持集合内。import map 由根 deno.json 解析 @contracts。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
} from "../../../src/shared/lib/locales.js";

Deno.test("locales：支持三语且全部有显示名", () => {
  assertEqual([...SUPPORTED_LOCALES].sort(), ["en", "zh-CN", "zh-TW"]);
  for (const loc of SUPPORTED_LOCALES) {
    assertEqual(typeof LOCALE_LABELS[loc], "string");
    assertEqual(LOCALE_LABELS[loc].length > 0, true);
  }
});

Deno.test("locales：DEFAULT_LOCALE 在支持集合内", () => {
  assertEqual(SUPPORTED_LOCALES.includes(DEFAULT_LOCALE), true);
});
