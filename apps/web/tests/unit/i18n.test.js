// apps/web/tests/unit/i18n.test.js — i18n 核心（t 回退链 / 插值 / 字典加载）
// 覆盖 i18n.md §3/§4：当前语言 → zh-CN → 原样返回 key；{name} 插值；
// loadDictionary 走 fetchJSON（data: URL，验证 fetch 路径而非 import attributes）。

import { deepStrictEqual as assertEqual } from "node:assert/strict";

import {
  getLocale,
  injectDictionary,
  loadDictionary,
  resetDictionaries,
  setLocale,
  t,
} from "../../src/shared/lib/i18n.js";

Deno.test("i18n: 无字典时原样返回 key", () => {
  resetDictionaries();
  assertEqual(t("foo.bar"), "foo.bar");
});

Deno.test("i18n: 当前语言命中", () => {
  resetDictionaries();
  injectDictionary("en", { "hello.world": "Hello World" });
  setLocale("en");
  assertEqual(t("hello.world"), "Hello World");
});

Deno.test("i18n: en 缺失 → 回退 zh-CN", () => {
  resetDictionaries();
  injectDictionary("zh-CN", { "a.b": "中文" });
  injectDictionary("en", { "a.c": "English" });
  setLocale("en");
  assertEqual(t("a.b"), "中文"); // en 无 a.b → zh-CN
  assertEqual(t("a.c"), "English"); // en 有 → 不回退
});

Deno.test("i18n: 两语言都缺失 → 原样返回 key", () => {
  resetDictionaries();
  injectDictionary("zh-CN", { "a.b": "中文" });
  setLocale("zh-CN");
  assertEqual(t("not.exists"), "not.exists");
});

Deno.test("i18n: {name} 插值", () => {
  resetDictionaries();
  injectDictionary("zh-CN", { "notes.toast.deleted": "已删除「{title}」" });
  setLocale("zh-CN");
  assertEqual(t("notes.toast.deleted", { title: "笔记A" }), "已删除「笔记A」");
  // 未提供的占位符原样保留
  assertEqual(t("notes.toast.deleted"), "已删除「{title}」");
});

Deno.test("i18n: loadDictionary 经 fetch 加载（data: URL，禁 import attributes）", async () => {
  resetDictionaries();
  setLocale("en");
  const url = `data:application/json,${
    encodeURIComponent(
      JSON.stringify({ "shell.nav.logout": "Log out" }),
    )
  }`;
  await loadDictionary("en", url);
  assertEqual(t("shell.nav.logout"), "Log out");
});

Deno.test("i18n: setLocale/getLocale 同步", () => {
  setLocale("zh-TW");
  assertEqual(getLocale(), "zh-TW");
  setLocale("zh-CN");
  assertEqual(getLocale(), "zh-CN");
});

Deno.test("i18n: 后加载字典覆盖先加载（模块后补 shared）", () => {
  resetDictionaries();
  injectDictionary("zh-CN", { "a.b": "初值" });
  injectDictionary("zh-CN", { "a.b": "覆盖值" });
  assertEqual(t("a.b"), "覆盖值");
});
