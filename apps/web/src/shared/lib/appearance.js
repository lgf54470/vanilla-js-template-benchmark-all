import {
  BASE_COLORS,
  CHART_COLORS,
  FONTS,
  SIDEBAR_WIDTH_LIMITS,
  STORAGE_KEYS,
  STYLES,
} from "@contracts/constants.js";
import { eventBus } from "../core/event-bus.js";

const DEFAULT_BASE_COLOR = "zinc";
const DEFAULT_STYLE = "nova";
const DEFAULT_CHART_COLOR = "chart-1";
const DEFAULT_THEME = "system";
const DEFAULT_RADIUS = "0.625rem";
const DEFAULT_FONT_SANS = FONTS[0].value;
const DEFAULT_FONT_HEADING = "inherit";
const DEFAULT_SIDEBAR_VARIANT = "sidebar";
const DEFAULT_SIDEBAR_COLLAPSIBLE = "icon";

function getStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch {
    // Ignore localStorage errors
  }
}

let mediaQueryListener = null;

export function getTheme() {
  return getStorage(STORAGE_KEYS.THEME, DEFAULT_THEME);
}

export function setTheme(theme) {
  setStorage(STORAGE_KEYS.THEME, theme);
  applyAppearance();
}

export function getBaseColor() {
  const val = getStorage(STORAGE_KEYS.BASE_COLOR, DEFAULT_BASE_COLOR);
  return BASE_COLORS.includes(val) ? val : DEFAULT_BASE_COLOR;
}

export function setBaseColor(color) {
  if (BASE_COLORS.includes(color)) {
    setStorage(STORAGE_KEYS.BASE_COLOR, color);
    applyAppearance();
  }
}

export function getStyle() {
  const val = getStorage(STORAGE_KEYS.STYLE, DEFAULT_STYLE);
  return STYLES.includes(val) ? val : DEFAULT_STYLE;
}

export function setStyle(style) {
  if (STYLES.includes(style)) {
    setStorage(STORAGE_KEYS.STYLE, style);
    applyAppearance();
  }
}

export function getChartColor() {
  const val = getStorage(STORAGE_KEYS.CHART_COLOR, DEFAULT_CHART_COLOR);
  return CHART_COLORS.includes(val) ? val : DEFAULT_CHART_COLOR;
}

export function setChartColor(chart) {
  if (CHART_COLORS.includes(chart)) {
    setStorage(STORAGE_KEYS.CHART_COLOR, chart);
    applyAppearance();
  }
}

export function getRadius() {
  return getStorage(STORAGE_KEYS.RADIUS, DEFAULT_RADIUS);
}

export function setRadius(radius) {
  const val = typeof radius === "number" ? `${radius}rem` : radius;
  setStorage(STORAGE_KEYS.RADIUS, val);
  applyAppearance();
}

export function getFontSans() {
  return getStorage(STORAGE_KEYS.FONT_SANS, DEFAULT_FONT_SANS);
}

export function setFontSans(font) {
  setStorage(STORAGE_KEYS.FONT_SANS, font);
  applyAppearance();
}

export function getFontHeading() {
  return getStorage(STORAGE_KEYS.FONT_HEADING, DEFAULT_FONT_HEADING);
}

export function setFontHeading(font) {
  setStorage(STORAGE_KEYS.FONT_HEADING, font);
  applyAppearance();
}

export function getSidebarVariant() {
  return getStorage(STORAGE_KEYS.SIDEBAR_VARIANT, DEFAULT_SIDEBAR_VARIANT);
}

export function setSidebarVariant(variant) {
  setStorage(STORAGE_KEYS.SIDEBAR_VARIANT, variant);
  applyAppearance();
}

export function getSidebarCollapsible() {
  return getStorage(STORAGE_KEYS.SIDEBAR_COLLAPSIBLE, DEFAULT_SIDEBAR_COLLAPSIBLE);
}

export function setSidebarCollapsible(mode) {
  setStorage(STORAGE_KEYS.SIDEBAR_COLLAPSIBLE, mode);
  applyAppearance();
}

export function getSidebarWidth() {
  const val = Number(getStorage(STORAGE_KEYS.SIDEBAR_WIDTH, SIDEBAR_WIDTH_LIMITS.default));
  return isNaN(val) ? SIDEBAR_WIDTH_LIMITS.default : val;
}

export function setSidebarWidth(width) {
  const clamped = Math.max(
    SIDEBAR_WIDTH_LIMITS.min,
    Math.min(SIDEBAR_WIDTH_LIMITS.max, width),
  );
  setStorage(STORAGE_KEYS.SIDEBAR_WIDTH, clamped);
  applyAppearance();
}

export function getSidebarOpen() {
  const val = getStorage(STORAGE_KEYS.SIDEBAR_OPEN, "true");
  return val === "true";
}

export function setSidebarOpen(open) {
  setStorage(STORAGE_KEYS.SIDEBAR_OPEN, open ? "true" : "false");
  applyAppearance();
}

export function getResolvedTheme() {
  const theme = getTheme();
  if (theme === "system") {
    if (typeof globalThis.window !== "undefined" && globalThis.matchMedia) {
      return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return theme;
}

export function getAppearanceState() {
  return {
    theme: getTheme(),
    resolvedTheme: getResolvedTheme(),
    baseColor: getBaseColor(),
    style: getStyle(),
    chartColor: getChartColor(),
    radius: getRadius(),
    fontSans: getFontSans(),
    fontHeading: getFontHeading(),
    sidebarVariant: getSidebarVariant(),
    sidebarCollapsible: getSidebarCollapsible(),
    sidebarWidth: getSidebarWidth(),
    sidebarOpen: getSidebarOpen(),
  };
}

export function applyAppearance() {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  const state = getAppearanceState();

  // 1. Dark Mode
  if (state.resolvedTheme === "dark") {
    html.classList.add("dark");
    html.setAttribute("data-theme", "dark");
    html.style.colorScheme = "dark";
  } else {
    html.classList.remove("dark");
    html.setAttribute("data-theme", "light");
    html.style.colorScheme = "light";
  }

  // 2. Base Color Class (恰有一个)
  for (const c of BASE_COLORS) {
    html.classList.remove(`base-${c}`);
  }
  html.classList.add(`base-${state.baseColor}`);

  // 3. Style Class (恰有一个)
  for (const s of STYLES) {
    html.classList.remove(`style-${s}`);
  }
  html.classList.add(`style-${state.style}`);

  // 4. Chart Color Class (恰有一个)
  for (const ch of CHART_COLORS) {
    html.classList.remove(ch);
  }
  html.classList.add(state.chartColor);

  // 5. Data Attributes & Inline Variables
  html.setAttribute("data-sidebar-variant", state.sidebarVariant);
  html.setAttribute("data-sidebar-collapsible", state.sidebarCollapsible);

  html.style.setProperty("--radius", state.radius);
  html.style.setProperty("--font-sans-base", state.fontSans);
  html.style.setProperty("--font-heading-base", state.fontHeading);

  eventBus.emit("appearance:changed", state);
}

export function initAppearance() {
  if (typeof window === "undefined") return;

  if (globalThis.matchMedia && !mediaQueryListener) {
    const mq = globalThis.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryListener = () => {
      if (getTheme() === "system") {
        applyAppearance();
      }
    };
    mq.addEventListener("change", mediaQueryListener);
  }

  applyAppearance();
}
