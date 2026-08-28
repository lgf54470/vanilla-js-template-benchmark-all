// scripts/tests/check-i18n-keys.test.js — check-i18n-keys 行为级测试
// 正向：三语对齐通过；反向：key 不一致 / 缺语言文件 / 空翻译 / 缺模块字典。

import {
  assertResult,
  runCheck,
  withWorkspace,
} from "./helpers/check-runner.js";

const SHARED_ZH = {
  "apps/web/src/shared/i18n/zh-CN.json":
    '{ "shell.nav.logout": "退出登录", "shell.theme.title": "主题设置" }',
  "apps/web/src/shared/i18n/zh-TW.json":
    '{ "shell.nav.logout": "登出", "shell.theme.title": "主題設定" }',
  "apps/web/src/shared/i18n/en.json":
    '{ "shell.nav.logout": "Log out", "shell.theme.title": "Theme settings" }',
};

const MODULE_OK = {
  "apps/web/src/modules/dashboard/module.json": "{}",
  "apps/web/src/modules/dashboard/i18n/zh-CN.json":
    '{ "dashboard.menu.title": "仪表盘" }',
  "apps/web/src/modules/dashboard/i18n/zh-TW.json":
    '{ "dashboard.menu.title": "儀表板" }',
  "apps/web/src/modules/dashboard/i18n/en.json":
    '{ "dashboard.menu.title": "Dashboard" }',
};

Deno.test("check-i18n-keys 正向：三语对齐通过", async () => {
  await withWorkspace({
    ...SHARED_ZH,
    ...MODULE_OK,
  }, async (ws) => {
    const res = await runCheck(ws, "check-i18n-keys.js");
    assertResult(res, 0, "三语 key 全部对齐");
  });
});

Deno.test("check-i18n-keys 反向：en 缺 key / 多 key 报错", async () => {
  await withWorkspace({
    ...SHARED_ZH,
    "apps/web/src/shared/i18n/en.json":
      '{ "shell.nav.logout": "Log out", "shell.extra": "x" }',
  }, async (ws) => {
    const res = await runCheck(ws, "check-i18n-keys.js");
    assertResult(res, 1, "key 集合与 zh-CN 不一致");
    assertResult(res, 1, "shell.theme.title");
    assertResult(res, 1, "shell.extra");
  });
});

Deno.test("check-i18n-keys 反向：缺 zh-TW 文件报错", async () => {
  await withWorkspace({
    "apps/web/src/shared/i18n/zh-CN.json": "{}",
    "apps/web/src/shared/i18n/en.json": "{}",
  }, async (ws) => {
    const res = await runCheck(ws, "check-i18n-keys.js");
    assertResult(res, 1, "缺少 zh-TW.json");
  });
});

Deno.test("check-i18n-keys 反向：空翻译报错", async () => {
  await withWorkspace({
    "apps/web/src/shared/i18n/zh-CN.json": '{ "shell.nav.logout": "" }',
    "apps/web/src/shared/i18n/zh-TW.json": '{ "shell.nav.logout": "登出" }',
    "apps/web/src/shared/i18n/en.json": '{ "shell.nav.logout": "Log out" }',
  }, async (ws) => {
    const res = await runCheck(ws, "check-i18n-keys.js");
    assertResult(res, 1, "为空翻译");
  });
});

Deno.test("check-i18n-keys 反向：模块有 module.json 但缺 i18n 报错", async () => {
  await withWorkspace({
    ...SHARED_ZH,
    "apps/web/src/modules/notes/module.json": "{}",
  }, async (ws) => {
    const res = await runCheck(ws, "check-i18n-keys.js");
    assertResult(res, 1, "缺 i18n/ 三语字典");
  });
});
