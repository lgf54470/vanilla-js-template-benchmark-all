import { BASE_COLORS, CHART_COLORS, STORAGE_KEYS, STYLES } from "@contracts/constants.js";

const DEFAULT_BASE_COLOR = "zinc";
const DEFAULT_STYLE = "nova";
const DEFAULT_CHART_COLOR = "chart-1";
const DEFAULT_THEME = "system";
const DEFAULT_RADIUS = "0.625rem";
const DEFAULT_FONT_SANS = "Inter Variable, sans-serif";
const DEFAULT_SIDEBAR_VARIANT = "sidebar";
const DEFAULT_SIDEBAR_COLLAPSIBLE = "icon";

function getStorage(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore
  }
}

export function getTheme() {
  return getStorage(STORAGE_KEYS.THEME, DEFAULT_THEME);
}

export function setTheme(theme) {
  if (!["system", "light", "dark"].includes(theme)) return;
  setStorage(STORAGE_KEYS.THEME, theme);
  applyAppearance();
}

export function getBaseColor() {
  const val = getStorage(STORAGE_KEYS.BASE_COLOR, DEFAULT_BASE_COLOR);
  return BASE_COLORS.includes(val) ? val : DEFAULT_BASE_COLOR;
}

export function setBaseColor(color) {
  if (!BASE_COLORS.includes(color)) return;
  setStorage(STORAGE_KEYS.BASE_COLOR, color);
  applyAppearance();
}

export function getStyle() {
  const val = getStorage(STORAGE_KEYS.STYLE, DEFAULT_STYLE);
  return STYLES.includes(val) ? val : DEFAULT_STYLE;
}

export function setStyle(style) {
  if (!STYLES.includes(style)) return;
  setStorage(STORAGE_KEYS.STYLE, style);
  applyAppearance();
}

export function getChartColor() {
  const val = getStorage(STORAGE_KEYS.CHART_COLOR, DEFAULT_CHART_COLOR);
  return CHART_COLORS.includes(val) ? val : DEFAULT_CHART_COLOR;
}

export function setChartColor(chart) {
  if (!CHART_COLORS.includes(chart)) return;
  setStorage(STORAGE_KEYS.CHART_COLOR, chart);
  applyAppearance();
}

export function getRadius() {
  return getStorage(STORAGE_KEYS.RADIUS, DEFAULT_RADIUS);
}

export function setRadius(radius) {
  setStorage(STORAGE_KEYS.RADIUS, radius);
  applyAppearance();
}

export function getFont() {
  return getStorage(STORAGE_KEYS.FONT_SANS, DEFAULT_FONT_SANS);
}

export function setFont(font) {
  setStorage(STORAGE_KEYS.FONT_SANS, font);
  applyAppearance();
}

export function getSidebarVariant() {
  const val = getStorage(STORAGE_KEYS.SIDEBAR_VARIANT, DEFAULT_SIDEBAR_VARIANT);
  return ["sidebar", "floating", "inset"].includes(val) ? val : DEFAULT_SIDEBAR_VARIANT;
}

export function setSidebarVariant(variant) {
  if (!["sidebar", "floating", "inset"].includes(variant)) return;
  setStorage(STORAGE_KEYS.SIDEBAR_VARIANT, variant);
  applyAppearance();
}

export function getSidebarCollapsible() {
  const val = getStorage(STORAGE_KEYS.SIDEBAR_COLLAPSIBLE, DEFAULT_SIDEBAR_COLLAPSIBLE);
  return ["icon", "offcanvas", "none"].includes(val) ? val : DEFAULT_SIDEBAR_COLLAPSIBLE;
}

export function setSidebarCollapsible(collapsible) {
  if (!["icon", "offcanvas", "none"].includes(collapsible)) return;
  setStorage(STORAGE_KEYS.SIDEBAR_COLLAPSIBLE, collapsible);
  applyAppearance();
}

export function resetAppearance() {
  if (typeof localStorage !== "undefined") {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
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

export function applyAppearance() {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  const resolved = getResolvedTheme();

  if (resolved === "dark") {
    html.classList.add("dark");
    html.setAttribute("data-theme", "dark");
    html.style.colorScheme = "dark";
  } else {
    html.classList.remove("dark");
    html.setAttribute("data-theme", "light");
    html.style.colorScheme = "light";
  }

  for (const c of BASE_COLORS) {
    html.classList.remove(`base-${c}`);
  }
  html.classList.add(`base-${getBaseColor()}`);

  for (const s of STYLES) {
    html.classList.remove(`style-${s}`);
  }
  html.classList.add(`style-${getStyle()}`);

  for (const ch of CHART_COLORS) {
    html.classList.remove(ch);
  }
  html.classList.add(getChartColor());

  html.setAttribute("data-sidebar-variant", getSidebarVariant());
  html.setAttribute("data-sidebar-collapsible", getSidebarCollapsible());
  html.style.setProperty("--radius", getRadius());
  html.style.setProperty("--font-sans-base", getFont());
}
