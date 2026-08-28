// shared/lib/appearance.js — 外观引擎（ARCHITECTURE.md §6.2/§6.3）。
// 在 <html> 上维护恰一个 style-* / base-* / chart-* / menu-* 类、.dark 类与
// data-sidebar-* 属性，并写 --radius/--font-*-base 内联变量；持久化键在
// packages/contracts/constants.js 的 STORAGE_KEYS（pref:*）。
//
// index.html 的 PREPAINT 内联脚本在首帧前做同一件事（防刷新闪白/闪暗）——
// 两处消费同一份键名，改动任一侧必须同步另一侧（docs/CSS.md §1 注入通道 2）。

import {
  APPEARANCE_BASES,
  APPEARANCE_CHARTS,
  APPEARANCE_STYLES,
  FONT_FAMILIES,
  STORAGE_KEYS,
} from "@contracts/constants.js";
import { emit } from "@shared/core/event-bus.js";

const html = document.documentElement;
const darkQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");

function getPref(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function setPref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 隐私模式等场景静默降级 */
  }
}

/** 用唯一类前缀替换 html 上同前缀类（恰有一个）。 */
function swapClass(prefix, value) {
  for (const name of [...html.classList]) {
    if (name.startsWith(prefix)) html.classList.remove(name);
  }
  if (value) html.classList.add(prefix + value);
}

function resolveDark(theme) {
  return theme === "dark" || (theme === "system" && darkQuery.matches);
}

function applyDark() {
  const theme = getPref(STORAGE_KEYS.theme, "system");
  const dark = resolveDark(theme);
  html.classList.toggle("dark", dark);
  // 双写 data-theme 与 colorScheme，兼容仅认 data-theme 的旧规则与原生表单控件
  html.dataset.theme = dark ? "dark" : "light";
  html.style.colorScheme = dark ? "dark" : "light";
}

function applyAll() {
  swapClass("style-", getPref(STORAGE_KEYS.style, "nova"));
  swapClass("base-", getPref(STORAGE_KEYS.base, "zinc"));
  swapClass("chart-", getPref(STORAGE_KEYS.chart, "zinc"));
  swapClass("menu-", getPref(STORAGE_KEYS.menuAppearance, ""));
  applyDark();

  const radius = getPref(STORAGE_KEYS.radius, "");
  if (radius) html.style.setProperty("--radius", radius);

  const fontSans = getPref(STORAGE_KEYS.fontSans, "inter");
  const fontHeading = getPref(STORAGE_KEYS.fontHeading, "inter");
  const sansVar = fontSans === "inter" ? "--font-sans" : `--font-${fontSans}`;
  const headingVar = fontHeading === "inter"
    ? "--font-sans"
    : `--font-${fontHeading}`;
  html.style.setProperty("--font-sans-base", `var(${sansVar})`);
  html.style.setProperty("--font-heading-base", `var(${headingVar})`);

  html.dataset.sidebarVariant = getPref(STORAGE_KEYS.sidebarVariant, "sidebar");
  html.dataset.sidebarCollapsible = getPref(
    STORAGE_KEYS.sidebarCollapsible,
    "icon",
  );
}

darkQuery.addEventListener("change", () => {
  if (getPref(STORAGE_KEYS.theme, "system") === "system") {
    applyDark();
    emit("appearance:changed", { reason: "system-theme" });
  }
});

/** 应用启动时调用一次（PREPAINT 已先行应用过，此处再对齐一次幂等）。 */
export function initAppearance() {
  applyAll();
}

export function getAppearance() {
  return {
    theme: getPref(STORAGE_KEYS.theme, "system"),
    style: getPref(STORAGE_KEYS.style, "nova"),
    base: getPref(STORAGE_KEYS.base, "zinc"),
    chart: getPref(STORAGE_KEYS.chart, "zinc"),
    menu: getPref(STORAGE_KEYS.menuAppearance, ""),
    radius: getPref(STORAGE_KEYS.radius, "0.625rem"),
    fontSans: getPref(STORAGE_KEYS.fontSans, "inter"),
    fontHeading: getPref(STORAGE_KEYS.fontHeading, "inter"),
    sidebarVariant: getPref(STORAGE_KEYS.sidebarVariant, "sidebar"),
    sidebarCollapsible: getPref(STORAGE_KEYS.sidebarCollapsible, "icon"),
  };
}

function update(key, value, allowed) {
  if (allowed && !allowed.includes(value)) return;
  setPref(key, value);
  applyAll();
  emit("appearance:changed", { key, value });
}

export const setTheme = (theme) =>
  update(STORAGE_KEYS.theme, theme, ["system", "light", "dark"]);

export const setStyle = (style) =>
  update(STORAGE_KEYS.style, style, APPEARANCE_STYLES);

export const setBase = (base) =>
  update(STORAGE_KEYS.base, base, APPEARANCE_BASES);

export const setChart = (chart) =>
  update(STORAGE_KEYS.chart, chart, APPEARANCE_CHARTS);

export const setMenuAppearance = (menu) =>
  update(STORAGE_KEYS.menuAppearance, menu);

export const setRadius = (radius) => update(STORAGE_KEYS.radius, radius);

export const setFontSans = (font) =>
  update(STORAGE_KEYS.fontSans, font, FONT_FAMILIES);

export const setFontHeading = (font) =>
  update(STORAGE_KEYS.fontHeading, font, FONT_FAMILIES);

export const setSidebarVariant = (variant) =>
  update(STORAGE_KEYS.sidebarVariant, variant, [
    "sidebar",
    "floating",
    "inset",
  ]);

export const setSidebarCollapsible = (collapsible) =>
  update(STORAGE_KEYS.sidebarCollapsible, collapsible, [
    "offcanvas",
    "icon",
    "none",
  ]);
