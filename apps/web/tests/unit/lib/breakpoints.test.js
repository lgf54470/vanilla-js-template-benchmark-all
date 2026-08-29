// apps/web/tests/unit/lib/breakpoints.test.js — 断点常量（Layout.md §2）
// 与 CSS 媒体查询同步维护；JS 侧用 BREAKPOINTS 与 isMobileViewport()。
import { deepStrictEqual as assertEqual } from "node:assert/strict";
import {
  BREAKPOINTS,
  isMobileViewport,
} from "../../../src/shared/lib/breakpoints.js";

Deno.test("breakpoints: 四档断点常量与移动端媒体查询", () => {
  assertEqual(BREAKPOINTS.SM, 640);
  assertEqual(BREAKPOINTS.MD, 768);
  assertEqual(BREAKPOINTS.LG, 1024);
  assertEqual(BREAKPOINTS.XL, 1280);
  // 移动端判定用 767px（与 Layout.md / CSS 的 @media (max-width: 767px) 同步）
  assertEqual(isMobileViewport(), "(max-width: 767px)");
});
