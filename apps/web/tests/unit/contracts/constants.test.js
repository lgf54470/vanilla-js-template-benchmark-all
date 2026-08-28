// apps/web/tests/unit/contracts/constants.test.js — contracts 常量基础测试
import { deepStrictEqual as assertEquals } from "node:assert/strict";
import {
  DEFAULT_WORKSPACE_ID,
  SESSION_DURATIONS,
  STORAGE_KEYS,
} from "../../../../../packages/contracts/constants.js";

Deno.test("STORAGE_KEYS 统一 pref: 前缀", () => {
  for (const key of Object.values(STORAGE_KEYS)) {
    if (!key.startsWith("pref:")) {
      throw new Error(`存储键 ${key} 缺少 pref: 前缀`);
    }
  }
});

Deno.test("SESSION_DURATIONS 含 8 个固定时长 + 1 个会话级选项", () => {
  assertEquals(SESSION_DURATIONS.length, 9);
  const fixed = SESSION_DURATIONS.filter((d) => !d.session);
  assertEquals(fixed.length, 8);
  assertEquals(SESSION_DURATIONS.at(-1).session, true);
});

Deno.test("默认工作空间为 ws_default", () => {
  assertEquals(DEFAULT_WORKSPACE_ID, "ws_default");
});
