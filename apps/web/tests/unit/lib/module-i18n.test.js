// apps/web/tests/unit/lib/module-i18n.test.js — 模块字典幂等注册（i18n.md §1）
// registerModuleI18n 以模块 URL 为基准拉 <模块>/i18n/<当前语言>.json 并合并字典；
// 同一 (模块,语言) 只拉一次（幂等）；拉取失败静默不抛。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import {
  getLocale,
  resetDictionaries,
  setLocale,
  t,
} from "../../../src/shared/lib/i18n.js";
import { registerModuleI18n } from "../../../src/shared/lib/module-i18n.js";

const MOD_BASE = "http://localhost:8787/src/modules/notes/index.js";
const DICT_URL = "http://localhost:8787/src/modules/notes/i18n/zh-CN.json";

Deno.test("module-i18n: 注册模块字典后 t() 立即命中; 二次注册幂等", async () => {
  const realFetch = globalThis.fetch;
  let fetches = 0;
  globalThis.fetch = (url) => {
    if (String(url) === DICT_URL) {
      fetches += 1;
      return new Response(
        JSON.stringify({ "notes.title": "笔记" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  };
  try {
    resetDictionaries();
    setLocale("zh-CN");
    await registerModuleI18n(MOD_BASE);
    assertEqual(t("notes.title"), "笔记");
    assertEqual(getLocale(), "zh-CN");
    // 幂等：再次注册不重复拉取
    await registerModuleI18n(MOD_BASE);
    assertEqual(fetches, 1);
  } finally {
    globalThis.fetch = realFetch;
    resetDictionaries();
  }
});

Deno.test("module-i18n: 拉取失败静默（不阻塞调用方）", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => new Response("boom", { status: 500 });
  try {
    resetDictionaries();
    setLocale("en");
    await registerModuleI18n(MOD_BASE); // 不应 throw
    assertEqual(t("notes.missing"), "notes.missing"); // key 仍在（无字典）
  } finally {
    globalThis.fetch = realFetch;
    resetDictionaries();
  }
});
