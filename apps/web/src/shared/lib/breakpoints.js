/**
 * shared/lib/breakpoints.js — 断点常量（docs/Layout.md §2）。
 * CSS 媒体查询直接写 px（如 max-width: 767px），JS 逻辑用本常量，两处必须同步。
 */
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };

/** @returns {boolean} 当前视口是否为移动端（< md）。 */
export function isMobileViewport() {
  return globalThis.matchMedia?.(`(max-width: ${BREAKPOINTS.md - 1}px)`)
    .matches ?? false;
}

/** 移动端媒体查询对象（addEventListener("change") 监听切换）。 */
export function mobileMediaQuery() {
  return globalThis.matchMedia?.(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}
