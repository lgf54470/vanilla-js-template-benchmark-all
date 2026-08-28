/**
 * shared/lib/appearance.js — 外观引擎（ARCHITECTURE §6.2/§6.3）。
 *
 * 在 <html> 上维护四类状态（与 index.html 的 PREPAINT 内联脚本同一契约，
 * PREPAINT 负责首帧前应用，本模块负责运行时接管与变更）：
 * - 类：style-*（8 选 1）/ base-*（7 选 1）/ chart-*（12 选 1 或无）/ menu-*
 *   / dark（亮暗）
 * - 属性：data-theme="dark|light"（兼容旧规则）+ data-sidebar-variant /
 *   data-sidebar-collapsible（壳层消费）
 * - 内联变量：--radius（主题设置圆角）、--font-sans-base / --font-heading-base
 *   （主题设置字体）、style.colorScheme（表单控件原生渲染跟随亮暗）
 *
 * 全部偏好持久化在 localStorage（pref:* 键，packages/contracts/constants.js），
 * 不进数据库。本模块只做纯状态应用，不碰任何 UI 组件。
 */

import { STORAGE_KEYS } from "@contracts/constants.js";

/** 8 个风格令牌集（themes/style-*.css） */
export const STYLE_OPTIONS = Object.freeze([
  "style-nova",
  "style-vega",
  "style-maia",
  "style-lyra",
  "style-mira",
  "style-luma",
  "style-sera",
  "style-rhea",
]);

/** 7 个基色调色板（themes/palettes-base.css） */
export const PALETTE_OPTIONS = Object.freeze([
  "base-zinc",
  "base-red",
  "base-orange",
  "base-green",
  "base-blue",
  "base-violet",
  "base-rose",
]);

/** 12 个图表色方案（themes/palettes-chart.css）；空串 = 不挂类（zinc 兜底） */
export const CHART_OPTIONS = Object.freeze([
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
  "chart-9",
  "chart-10",
  "chart-11",
  "chart-12",
]);

/** 主题设置可选正文字体（@font-face 见 tokens/typography.css） */
export const FONT_OPTIONS = Object.freeze([
  "Inter Variable",
  "Manrope Variable",
  "Geist Variable",
]);

/** 菜单密度外观 */
export const MENU_OPTIONS = Object.freeze(["menu-cozy", "menu-compact"]);

/** 侧栏变体 / 折叠模式（壳层消费；docs/Layout.md §3） */
export const SIDEBAR_VARIANTS = Object.freeze(["sidebar", "floating", "inset"]);
export const SIDEBAR_COLLAPSIBLES = Object.freeze([
  "icon",
  "offcanvas",
  "none",
]);

/** token 圆角基准（tokens/radius.css），主题设置面板写 --radius 时以此为参照 */
export const DEFAULT_RADIUS_PX = 10; // 0.625rem

/**
 * 外观状态（storage 缺省即用默认值）。
 * @typedef {object} AppearanceState
 * @property {"system"|"light"|"dark"} theme
 * @property {string} style
 * @property {string} palette
 * @property {string} chart  "chart-N" 或 ""（无类，zinc 兜底）
 * @property {number|null} radiusPx  null = 用 tokens/radius.css 默认
 * @property {string|null} fontSans
 * @property {string|null} fontHeading
 * @property {string} menu
 * @property {string} sidebarVariant
 * @property {string} sidebarCollapsible
 */

/** @returns {AppearanceState} 从 localStorage 读取全部偏好（带默认值） */
export function readState() {
  const s = (key, fallback) => localStorage.getItem(key) ?? fallback;
  const n = (key) => {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  return {
    theme: s(STORAGE_KEYS.THEME, "system"),
    style: s(STORAGE_KEYS.STYLE, "style-nova"),
    palette: s(STORAGE_KEYS.PALETTE, "base-zinc"),
    chart: s(STORAGE_KEYS.CHART, ""),
    radiusPx: n(STORAGE_KEYS.RADIUS),
    fontSans: localStorage.getItem(STORAGE_KEYS.FONT_SANS),
    fontHeading: localStorage.getItem(STORAGE_KEYS.FONT_HEADING),
    menu: s(STORAGE_KEYS.MENU, "menu-cozy"),
    sidebarVariant: s(STORAGE_KEYS.SIDEBAR_VARIANT, "sidebar"),
    sidebarCollapsible: s(STORAGE_KEYS.SIDEBAR_COLLAPSIBLE, "icon"),
  };
}

/** 系统是否偏好暗色 */
export function prefersSystemDark() {
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ??
    false;
}

/** 解析最终亮暗：system 跟随系统，light/dark 强制 */
export function resolveDark(theme) {
  return theme === "dark" || (theme === "system" && prefersSystemDark());
}

const FONT_SANS_FALLBACK = "ui-sans-serif, system-ui, sans-serif";
const FONT_HEADING_FALLBACK =
  '"Inter Variable", ui-sans-serif, system-ui, sans-serif';

/** 组合正文字体族栈（PREPAINT 内联脚本镜像同一规则，改动须两处同步） */
export function composeSansStack(family) {
  return family ? `"${family}", ${FONT_SANS_FALLBACK}` : null;
}

/** 组合标题字体族栈（PREPAINT 内联脚本镜像同一规则，改动须两处同步） */
export function composeHeadingStack(family) {
  return family ? `"${family}", ${FONT_HEADING_FALLBACK}` : null;
}

/**
 * 把外观状态应用到 <html>（幂等：全量覆盖四类状态，无残留类）。
 * @param {AppearanceState} state
 */
export function applyState(state) {
  const html = document.documentElement;

  // 类：先全清再挂（恰一个 style-*/base-*，至多一个 chart-*/menu-*）
  for (const cls of [...html.classList]) {
    if (
      /^style-/.test(cls) || /^base-/.test(cls) || /^chart-/.test(cls) ||
      /^menu-/.test(cls) || cls === "dark"
    ) {
      html.classList.remove(cls);
    }
  }
  html.classList.add(state.style, state.palette);
  if (state.chart) html.classList.add(state.chart);
  html.classList.add(state.menu);
  html.classList.toggle("dark", resolveDark(state.theme));

  // 属性与 colorScheme
  html.dataset.theme = resolveDark(state.theme) ? "dark" : "light";
  html.style.colorScheme = resolveDark(state.theme) ? "dark" : "light";
  html.dataset.sidebarVariant = state.sidebarVariant;
  html.dataset.sidebarCollapsible = state.sidebarCollapsible;

  // 内联变量：仅覆盖有偏好的项（null/空 → 清除内联，回落令牌默认）
  setVar(
    html,
    "--radius",
    state.radiusPx != null ? `${state.radiusPx}px` : null,
  );
  setVar(html, "--font-sans-base", composeSansStack(state.fontSans));
  setVar(html, "--font-heading-base", composeHeadingStack(state.fontHeading));
}

function setVar(el, name, value) {
  if (value == null || value === "") el.style.removeProperty(name);
  else el.style.setProperty(name, value);
}

/**
 * 更新单个偏好并持久化 + 立即应用。
 * @param {keyof AppearanceState|string} key readState() 返回的字段名
 * @param {string|number|null} value
 * @returns {AppearanceState} 应用后的完整状态
 */
export function updatePref(key, value) {
  const storageKey = {
    theme: STORAGE_KEYS.THEME,
    style: STORAGE_KEYS.STYLE,
    palette: STORAGE_KEYS.PALETTE,
    chart: STORAGE_KEYS.CHART,
    radiusPx: STORAGE_KEYS.RADIUS,
    fontSans: STORAGE_KEYS.FONT_SANS,
    fontHeading: STORAGE_KEYS.FONT_HEADING,
    menu: STORAGE_KEYS.MENU,
    sidebarVariant: STORAGE_KEYS.SIDEBAR_VARIANT,
    sidebarCollapsible: STORAGE_KEYS.SIDEBAR_COLLAPSIBLE,
  }[key];
  if (!storageKey) throw new Error(`appearance: 未知偏好字段 ${key}`);

  if (value == null || value === "") localStorage.removeItem(storageKey);
  else localStorage.setItem(storageKey, String(value));

  const state = readState();
  applyState(state);
  return state;
}

/**
 * 初始化：应用存储的外观 + system 模式跟随系统亮暗变化。
 * PREPAINT 已在首帧前应用过一次，这里运行时接管（幂等）。
 * @returns {() => void} 清理函数（移除系统主题监听）
 */
export function initAppearance() {
  applyState(readState());
  const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  const onChange = () => applyState(readState());
  mq?.addEventListener("change", onChange);
  return () => mq?.removeEventListener("change", onChange);
}
