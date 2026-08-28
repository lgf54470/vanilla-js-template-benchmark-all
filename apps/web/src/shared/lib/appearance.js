/**
 * shared/lib/appearance.js — 外观引擎（ARCHITECTURE.md §6.2/§6.3）。
 *
 * 在 <html> 上维护 `style-* / base-* / chart-* / menu-* / dark` 类，
 * 并写 `--radius / --font-sans-base / --font-heading-base` 内联变量；
 * index.html 的 PREPAINT 内联脚本在首帧前做同一件事（防主题闪白），
 * 本模块运行时接管同一套类——两处行为必须保持一致。
 *
 * 暗色切换双写 `.dark` 类 + `data-theme="dark|light"` + `style.colorScheme`
 * （兼容仅认 data-theme 的旧规则与表单控件原生渲染，docs/CSS.md §2.2）。
 */
import { STORAGE_KEYS } from "/packages/contracts/constants.js";

/** 设计风格（themes/style-*.css，nova 为全集基准） */
export const STYLE_NAMES = [
  "nova",
  "vega",
  "maia",
  "lyra",
  "mira",
  "luma",
  "sera",
  "rhea",
];

/** 基色（themes/palettes-base.css） */
export const BASE_COLOR_NAMES = [
  "zinc",
  "red",
  "orange",
  "green",
  "blue",
  "violet",
  "rose",
];

/**
 * 图表色（themes/palettes-chart.css）。
 * 7 基色 + 5 补充强调色（amber/cyan/pink/teal/yellow）——文档未枚举清单，
 * 此组合为 §20 开放决策的取舍：与基色选项对齐并补足色相覆盖。
 */
export const CHART_COLOR_NAMES = [
  ...BASE_COLOR_NAMES,
  "amber",
  "cyan",
  "pink",
  "teal",
  "yellow",
];

/** 亮暗模式 */
export const THEME_MODES = ["light", "dark", "system"];

/** 菜单外观（menu-* 类，Sidebar 组件消费） */
export const MENU_APPEARANCES = ["subtle", "bold", "inverted"];

/** 可选字体族（public/fonts/*.woff2 自托管） */
export const FONT_FAMILIES = [
  "Inter Variable",
  "Manrope Variable",
  "Geist Variable",
];

/** 圆角档位（主题设置面板选项 → --radius 实际值） */
export const RADIUS_STEPS = {
  none: "0rem",
  small: "0.45rem",
  medium: "0.625rem",
  large: "0.875rem",
};

/** 默认外观 */
export const DEFAULT_APPEARANCE = {
  theme: "system",
  style: "nova",
  baseColor: "zinc",
  chartColor: "zinc",
  radius: RADIUS_STEPS.medium,
  fontBody: FONT_FAMILIES[0],
  fontHeading: FONT_FAMILIES[0],
  menu: "subtle",
};

const PREFIXES = [
  ["style-", STYLE_NAMES],
  ["base-", BASE_COLOR_NAMES],
  ["chart-", CHART_COLOR_NAMES],
  ["menu-", MENU_APPEARANCES],
];

function pick(value, list, fallback) {
  return list.includes(value) ? value : fallback;
}

/** 逐项校验并归一化外观偏好（非法值回落默认）。 */
export function normalizeAppearance(input) {
  const raw = input ?? {};
  const theme = pick(raw.theme, THEME_MODES, DEFAULT_APPEARANCE.theme);
  const radiusValues = new Set(Object.values(RADIUS_STEPS));
  const radius = RADIUS_STEPS[raw.radius] ??
    (radiusValues.has(raw.radius) ? raw.radius : undefined) ??
    DEFAULT_APPEARANCE.radius;
  return {
    theme,
    style: pick(raw.style, STYLE_NAMES, DEFAULT_APPEARANCE.style),
    baseColor: pick(
      raw.baseColor,
      BASE_COLOR_NAMES,
      DEFAULT_APPEARANCE.baseColor,
    ),
    chartColor: pick(
      raw.chartColor,
      CHART_COLOR_NAMES,
      DEFAULT_APPEARANCE.chartColor,
    ),
    radius,
    fontBody: pick(raw.fontBody, FONT_FAMILIES, DEFAULT_APPEARANCE.fontBody),
    fontHeading: pick(
      raw.fontHeading,
      FONT_FAMILIES,
      DEFAULT_APPEARANCE.fontHeading,
    ),
    menu: pick(raw.menu, MENU_APPEARANCES, DEFAULT_APPEARANCE.menu),
  };
}

/** 当前是否应处于暗色（system 时跟随操作系统）。 */
export function resolveDark(theme) {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ??
    false;
}

/** 主题字体写入时的完整字体栈（保留 CJK 兜底；PREPAINT 内联脚本做同一件事）。 */
export function fontStack(family) {
  return `"${family}", system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
}

function swapClasses(el, prefix, list, current) {
  for (const name of list) {
    el.classList.toggle(`${prefix}${name}`, name === current);
  }
}

/** 把外观偏好写到 <html>（类 + 内联变量 + data-theme/colorScheme 双写）。 */
export function applyAppearance(prefs) {
  const el = document.documentElement;
  const dark = resolveDark(prefs.theme);

  for (const [prefix, list] of PREFIXES) {
    swapClasses(
      el,
      prefix,
      list,
      prefs[
        prefix === "style-"
          ? "style"
          : prefix === "base-"
          ? "baseColor"
          : prefix === "chart-"
          ? "chartColor"
          : "menu"
      ],
    );
  }

  el.classList.toggle("dark", dark);
  el.setAttribute("data-theme", dark ? "dark" : "light");
  el.style.colorScheme = dark ? "dark" : "light";

  el.style.setProperty("--radius", prefs.radius);
  el.style.setProperty("--font-sans-base", fontStack(prefs.fontBody));
  el.style.setProperty("--font-heading-base", fontStack(prefs.fontHeading));
}

/** 从 localStorage 读外观偏好（读不到/异常时返回默认值）。 */
export function getStoredAppearance() {
  try {
    return normalizeAppearance({
      theme: localStorage.getItem(STORAGE_KEYS.theme) ?? undefined,
      style: localStorage.getItem(STORAGE_KEYS.style) ?? undefined,
      baseColor: localStorage.getItem(STORAGE_KEYS.baseColor) ?? undefined,
      chartColor: localStorage.getItem(STORAGE_KEYS.chartColor) ?? undefined,
      radius: localStorage.getItem(STORAGE_KEYS.radius) ?? undefined,
      fontBody: localStorage.getItem(STORAGE_KEYS.fontBody) ?? undefined,
      fontHeading: localStorage.getItem(STORAGE_KEYS.fontHeading) ??
        undefined,
      menu: localStorage.getItem(STORAGE_KEYS.menu) ?? undefined,
    });
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

function persist(prefs) {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, prefs.theme);
    localStorage.setItem(STORAGE_KEYS.style, prefs.style);
    localStorage.setItem(STORAGE_KEYS.baseColor, prefs.baseColor);
    localStorage.setItem(STORAGE_KEYS.chartColor, prefs.chartColor);
    localStorage.setItem(STORAGE_KEYS.radius, prefs.radius);
    localStorage.setItem(STORAGE_KEYS.fontBody, prefs.fontBody);
    localStorage.setItem(STORAGE_KEYS.fontHeading, prefs.fontHeading);
    localStorage.setItem(STORAGE_KEYS.menu, prefs.menu);
  } catch {
    /* 隐私模式等场景下静默跳过持久化 */
  }
}

let systemListener = null;

/**
 * 更新外观偏好：归一化 → 持久化 → 应用到 <html> → 广播事件。
 * @param {Partial<ReturnType<typeof normalizeAppearance>>} patch
 */
export function setAppearance(patch) {
  const current = getStoredAppearance();
  const next = normalizeAppearance({ ...current, ...patch });
  persist(next);
  applyAppearance(next);
  document.dispatchEvent(
    new CustomEvent("appearancechange", { detail: next }),
  );
  return next;
}

/**
 * 启动外观引擎：应用已持久化的偏好并接管 PREPAINT 写入的类。
 * theme 为 system 时监听操作系统亮暗变化。返回当前偏好。
 */
export function initAppearance() {
  const prefs = getStoredAppearance();
  applyAppearance(prefs);

  if (systemListener) {
    globalThis.matchMedia?.removeEventListener?.(
      "prefers-color-scheme",
      systemListener,
    );
    systemListener = null;
  }
  if (prefs.theme === "system" && globalThis.matchMedia) {
    const mq = globalThis.matchMedia("(prefers-color-scheme: dark)");
    systemListener = () => applyAppearance(getStoredAppearance());
    mq.addEventListener("change", systemListener);
  }
  return prefs;
}
