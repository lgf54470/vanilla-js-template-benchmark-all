// shared/lib/breakpoints.js — 断点常量与媒体查询判断（docs/Layout.md §2）。
// 数值与 index.html PREPAINT 无关，但与 CSS 媒体查询必须同步改（CSS 变量不能进
// 媒体查询，媒体查询直接写 px 值）。

export { BREAKPOINTS } from "@contracts/constants.js";

/** < md 断点（Sidebar 切换为 Sheet 覆盖模式）。 */
export function isMobile() {
  return globalThis.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`).matches;
}

export function matchBreakpoint(name) {
  const width = BREAKPOINTS[name];
  return globalThis.matchMedia(`(min-width: ${width}px)`).matches;
}
