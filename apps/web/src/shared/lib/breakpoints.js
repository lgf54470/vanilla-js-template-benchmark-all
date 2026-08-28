// apps/web/src/shared/lib/breakpoints.js — 断点常量（Layout.md §2）
//
// 与 CSS 媒体查询同步维护：CSS 变量不能进媒体查询，媒体查询直接写 px
// （@media (max-width: 767px)）；JS 逻辑用本文件常量，两处改动必须同步。

import { BREAKPOINTS } from "@contracts/constants.js";

export { BREAKPOINTS };

/** @param {string} [mq] 覆盖测试用 */
export function isMobileViewport(mq) {
  return (mq ?? "(max-width: 767px)");
}
