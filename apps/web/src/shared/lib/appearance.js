// shared/lib/appearance.js —— 外观引擎（ARCHITECTURE §6.2/§6.3）
//
// 职责：在 <html> 上维护 style-* / base-* / chart-* / menu-* 类、.dark 类
// （并双写 data-theme 与 style.colorScheme）、data-sidebar-* 属性与
// --radius / --font-sans-base / --font-heading-base 内联变量；
// 偏好持久化到 localStorage（pref:*，见 @contracts/constants.js）。
//
// index.html 的 PREPAINT 内联脚本在首帧前做同一件事（防主题闪白）。
// 两处的选项列表 / 默认值 / 键名 / 类名必须严格一致——改动需同步。

import { STORAGE_KEYS } from "@contracts/constants.js";

/** 风格集（themes/style-*.css，delta 于 nova 基准）。 */
export const STYLE_OPTIONS = [
  "nova",
  "vega",
  "maia",
  "lyra",
  "mira",
  "luma",
  "sera",
  "rhea",
];

/** 基色调色板（themes/palettes-base.css）。 */
export const BASE_OPTIONS = [
  "zinc",
  "red",
  "orange",
  "green",
  "blue",
  "violet",
  "rose",
];

/** 图表强调色（themes/palettes-chart.css）；""=跟随基色。 */
export const CHART_OPTIONS = [
  "",
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "orange",
  "pink",
  "red",
  "teal",
  "violet",
];

/** 菜单外观（--ds-menu-* 变体，定义于 style-nova.css 文件尾）。 */
export const MENU_OPTIONS = [
  "default",
  "inverted",
  "default-translucent",
  "inverted-translucent",
];

/** 正文字体/标题字体候选（tokens/typography.css 的 @font-face）。 */
export const FONT_OPTIONS = [
  { id: "inherit", css: null },
  { id: "inter", css: '"Inter Variable"' },
  { id: "manrope", css: '"Manrope Variable"' },
  { id: "geist", css: '"Geist Variable"' },
];

/** 主题模式（亮/暗/跟随系统）。 */
export const THEME_MODES = ["light", "dark", "system"];

/** 侧栏变体与折叠模式（data-sidebar-* 属性值，M4 Sidebar 消费）。 */
export const SIDEBAR_VARIANTS = ["sidebar", "floating", "inset"];
export const SIDEBAR_COLLAPSIBLES = ["offcanvas", "icon", "none"];

const DEFAULTS = {
  theme: "system",
  style: "nova",
  base: "zinc",
  chart: "",
  menu: "default",
  radius: "0.625rem",
  fontSans: "inherit",
  fontHeading: "inherit",
  sidebarVariant: "sidebar",
  sidebarCollapsible: "icon",
};

const KEY_MAP = {
  theme: STORAGE_KEYS.THEME,
  style: STORAGE_KEYS.STYLE,
  base: STORAGE_KEYS.BASE,
  chart: STORAGE_KEYS.CHART,
  menu: STORAGE_KEYS.MENU,
  radius: STORAGE_KEYS.RADIUS,
  fontSans: STORAGE_KEYS.FONT_SANS,
  fontHeading: STORAGE_KEYS.FONT_HEADING,
  sidebarVariant: STORAGE_KEYS.SIDEBAR_VARIANT,
  sidebarCollapsible: STORAGE_KEYS.SIDEBAR_COLLAPSIBLE,
};

const VALIDATORS = {
  theme: (v) => THEME_MODES.includes(v),
  style: (v) => STYLE_OPTIONS.includes(v),
  base: (v) => BASE_OPTIONS.includes(v),
  chart: (v) => CHART_OPTIONS.includes(v),
  menu: (v) => MENU_OPTIONS.includes(v),
  radius: (v) => typeof v === "string" && /^\d*\.?\d+(rem|px)$/.test(v),
  fontSans: (v) => FONT_OPTIONS.some((f) => f.id === v),
  fontHeading: (v) => FONT_OPTIONS.some((f) => f.id === v),
  sidebarVariant: (v) => SIDEBAR_VARIANTS.includes(v),
  sidebarCollapsible: (v) => SIDEBAR_COLLAPSIBLES.includes(v),
};

const FONT_CSS = new Map(FONT_OPTIONS.map((f) => [f.id, f.css]));

const listeners = new Set();
const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)") ?? {
  matches: false,
  addEventListener() {},
};
let systemListenerAttached = false;

/**
 * 读取全部偏好（localStorage → 校验 → 非法值回退默认）。
 * @returns {Record<string, string>}
 */
export function readPrefs() {
  const prefs = { ...DEFAULTS };
  if (typeof localStorage === "undefined") return prefs;
  for (const [key, storageKey] of Object.entries(KEY_MAP)) {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null && VALIDATORS[key](raw)) prefs[key] = raw;
  }
  return prefs;
}

/** 持久化单个偏好（值先校验，非法直接丢弃）。 */
function writePref(key, value) {
  if (!VALIDATORS[key](value)) return;
  try {
    localStorage.setItem(KEY_MAP[key], value);
  } catch {
    // 隐私模式等存储不可用场景：静默降级为仅本次会话生效。
  }
}

/** 解析最终亮暗：system 时跟随系统。 */
export function resolveTheme(mode) {
  if (mode === "system") return media.matches ? "dark" : "light";
  return mode;
}

function onSystemChange() {
  if (readPrefs().theme === "system") applyAppearance(readPrefs());
}

function ensureSystemListener() {
  if (systemListenerAttached) return;
  media.addEventListener("change", onSystemChange);
  systemListenerAttached = true;
}

/**
 * 把偏好套用到 <html>：类、data-*、内联变量。幂等，可反复调用。
 * @param {Record<string, string>} prefs readPrefs() 的返回值
 */
export function applyAppearance(prefs) {
  const root = document.documentElement;

  const swapClass = (prefix, id) => {
    for (const cls of [...root.classList]) {
      if (cls.startsWith(`${prefix}-`)) root.classList.remove(cls);
    }
    if (id) root.classList.add(`${prefix}-${id}`);
  };

  swapClass("style", prefs.style);
  swapClass("base", prefs.base);
  swapClass("chart", prefs.chart);
  swapClass("menu", prefs.menu);

  const resolved = resolveTheme(prefs.theme);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  if (prefs.theme === "system") ensureSystemListener();

  root.style.setProperty("--radius", prefs.radius);
  for (
    const [prop, prefKey] of [
      ["--font-sans-base", "fontSans"],
      ["--font-heading-base", "fontHeading"],
    ]
  ) {
    const css = FONT_CSS.get(prefs[prefKey]) ?? null;
    if (css) root.style.setProperty(prop, css);
    else root.style.removeProperty(prop);
  }

  root.dataset.sidebarVariant = prefs.sidebarVariant;
  root.dataset.sidebarCollapsible = prefs.sidebarCollapsible;
}

/** 立即应用当前持久化偏好（应用启动时调用一次）。 */
export function initAppearance() {
  const prefs = readPrefs();
  applyAppearance(prefs);
  return prefs;
}

/** @param {(prefs: Record<string, string>) => void} fn */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  const prefs = readPrefs();
  for (const fn of listeners) fn(prefs);
}

/** 设置并持久化单项偏好，随后立即套用。 */
export function setPreference(key, value) {
  writePref(key, value);
  applyAppearance(readPrefs());
  emit();
}

/** 主题三态便捷入口（setPreference("theme", m) 的别名）。 */
export function setThemeMode(mode) {
  setPreference("theme", mode);
}
