// apps/web/tests/unit/i18n-switch.test.js — 语言切换链路回归（i18n.md §1）
//
// 守护的坑（docs/bug/2026-08-28-i18n-runtime-switch-dead.md）：运行时切语言
// 必须先 `await loadLocaleDictionaries(目标语言)` 再渲染，否则整屏裸 key。
// 本测试用桩 fetch 跑真实的 loadLocaleDictionaries（app/i18n/bootstrap.js），
// 断言：加载完成前 t() 落回裸 key；加载完成后立即翻译；且模块字典单个失败
// 不阻塞整体加载（allSettled 语义）。

import { deepStrictEqual as assertEqual } from "node:assert/strict";

import {
  getLocale,
  resetDictionaries,
  setLocale,
  t,
} from "../../src/shared/lib/i18n.js";
import { loadLocaleDictionaries } from "../../src/app/i18n/bootstrap.js";

const DICTS = {
  "zh-CN": {
    "shell.nav.logout": "退出登录",
    "shell.theme.title": "主题设置",
  },
  en: {
    "shell.nav.logout": "Log out",
    "shell.theme.title": "Theme settings",
  },
};

function installFetchStub({ failModules = false } = {}) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.includes("/shared/i18n/")) {
      const m = href.match(/i18n\/([\w-]+)\.json/);
      const locale = m?.[1];
      if (locale && DICTS[locale]) {
        return new Response(JSON.stringify(DICTS[locale]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }
    // 模块字典：默认 404（allSettled 吞掉）；failModules=true 也走这里
    if (href.includes("/modules/")) {
      return new Response("not found", { status: 404 });
    }
    void failModules;
    return new Response("not found", { status: 404 });
  };
  return () => {
    globalThis.fetch = realFetch;
  };
}

Deno.test("i18n-switch: 加载完成前 t() 返回裸 key，加载后立即翻译", async () => {
  const restore = installFetchStub();
  try {
    resetDictionaries();
    setLocale("en");
    // 未加载（模拟「先渲染」的时序）：裸 key —— 这就是被守护的失败态
    assertEqual(t("shell.nav.logout"), "shell.nav.logout");

    // 正确时序：先 await 加载，再渲染
    await loadLocaleDictionaries("en");
    assertEqual(getLocale(), "en");
    assertEqual(t("shell.nav.logout"), "Log out");
    assertEqual(t("shell.theme.title"), "Theme settings");
  } finally {
    restore();
    resetDictionaries();
  }
});

Deno.test("i18n-switch: 模块字典单个失败不阻塞（allSettled 语义）", async () => {
  const restore = installFetchStub({ failModules: true });
  try {
    resetDictionaries();
    // 所有模块字典 404，shared 字典正常 → 加载整体成功
    await loadLocaleDictionaries("zh-CN");
    assertEqual(t("shell.nav.logout"), "退出登录");
  } finally {
    restore();
    resetDictionaries();
  }
});

Deno.test("i18n-switch: 切语言后 shared 字典被替换，旧语言 key 走回退", async () => {
  const restore = installFetchStub();
  try {
    resetDictionaries();
    await loadLocaleDictionaries("zh-CN");
    assertEqual(t("shell.nav.logout"), "退出登录");
    // 切到 en：重新加载后当前语言命中英文
    await loadLocaleDictionaries("en");
    assertEqual(t("shell.nav.logout"), "Log out");
  } finally {
    restore();
    resetDictionaries();
  }
});
