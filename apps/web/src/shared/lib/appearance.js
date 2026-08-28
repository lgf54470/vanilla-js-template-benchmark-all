// apps/web/src/shared/lib/appearance.js — 外观引擎
//
// 在 <html> 上维护 style-*/base-*/chart-*/menu-* 类、.dark 类、data-theme、
// data-sidebar-variant/data-sidebar-collapsible 属性，并写 --radius/--font-* 内联变量
// （ARCHITECTURE.md §6.2 / §6.3）。偏好持久化到 localStorage（键 pref:*，见
// packages/contracts/constants.js 的 STORAGE_KEYS）。
// index.html 的 PREPAINT 内联脚本在首帧前做同一件事（防主题闪白），本引擎运行时接管。
// 侧栏宽度/展开态同样经本引擎持久化（拖拽松手/收起切换时写，拖拽过程中不写）。

import { STORAGE_KEYS } from "@contracts/constants.js";

export const APPEARANCE_DEFAULTS = Object.freeze({
  theme: "system", // system | light | dark
  style: "nova", // 8 风格之一
  base: "zinc", // 7 基色之一
  chart: "zinc", // 12 图表色之一
  radius: 10, // --radius 基准（px），默认 0.625rem
  fontSans: "Inter Variable",
  fontHeading: "Inter Variable",
  menu: "default", // 菜单外观：default | compact | spacious
  sidebarVariant: "sidebar", // sidebar | floating | inset
  sidebarCollapsible: "icon", // icon | offcanvas | none
  sidebarWidth: 256, // 展开态宽度（px）
  sidebarOpen: true,
});

const PREF_KEY_MAP = {
  theme: STORAGE_KEYS.THEME,
  style: STORAGE_KEYS.STYLE,
  base: STORAGE_KEYS.BASE,
  chart: STORAGE_KEYS.CHART,
  radius: STORAGE_KEYS.RADIUS,
  fontSans: STORAGE_KEYS.FONT_SANS,
  fontHeading: STORAGE_KEYS.FONT_HEADING,
  menu: STORAGE_KEYS.MENU,
  sidebarVariant: STORAGE_KEYS.SIDEBAR_VARIANT,
  sidebarCollapsible: STORAGE_KEYS.SIDEBAR_COLLAPSIBLE,
  sidebarWidth: STORAGE_KEYS.SIDEBAR_WIDTH,
  sidebarOpen: STORAGE_KEYS.SIDEBAR_OPEN,
};

const NUMERIC_KEYS = new Set(["radius", "sidebarWidth"]);
const BOOLEAN_KEYS = new Set(["sidebarOpen"]);
const RADIUS_LIMITS = { min: 4, max: 24 };

function parsePref(key, raw) {
  if (BOOLEAN_KEYS.has(key)) return raw === "true";
  if (NUMERIC_KEYS.has(key)) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (key === "radius" && (n < RADIUS_LIMITS.min || n > RADIUS_LIMITS.max)) {
      return null;
    }
    if (key === "sidebarWidth") return Math.min(Math.max(n, 160), 480);
    return n;
  }
  return raw;
}

/** 创建外观引擎实例；storage/doc 可注入便于单测 */
export function createAppearance({ storage = null, doc = null } = {}) {
  const documentRef = doc ?? globalThis.document;
  const win = documentRef?.defaultView ?? globalThis;
  const store = storage ??
    (() => {
      try {
        return globalThis.localStorage;
      } catch {
        return null;
      }
    })();

  let state = { ...APPEARANCE_DEFAULTS };
  const listeners = new Set();
  let media = null;
  let systemDark = false;

  function readPref(key) {
    if (!store) return null;
    try {
      return store.getItem(key);
    } catch {
      return null;
    }
  }

  function writePref(key, value) {
    if (!store) return;
    try {
      store.setItem(key, String(value));
    } catch {
      // 隐私模式等场景静默
    }
  }

  function resolveDark() {
    if (state.theme === "dark") return true;
    if (state.theme === "light") return false;
    return systemDark;
  }

  function apply() {
    const el = documentRef?.documentElement;
    if (!el) return;
    const dark = resolveDark();
    el.classList.toggle("dark", dark);
    el.setAttribute("data-theme", dark ? "dark" : "light");
    el.style.colorScheme = dark ? "dark" : "light";
    for (const cls of [...el.classList]) {
      if (
        cls.startsWith("style-") || cls.startsWith("base-") ||
        cls.startsWith("chart-") || cls.startsWith("menu-")
      ) {
        el.classList.remove(cls);
      }
    }
    el.classList.add(
      `style-${state.style}`,
      `base-${state.base}`,
      `chart-${state.chart}`,
      `menu-${state.menu}`,
    );
    el.dataset.sidebarVariant = state.sidebarVariant;
    el.dataset.sidebarCollapsible = state.sidebarCollapsible;
    el.style.setProperty("--radius", `${state.radius}px`);
    el.style.setProperty(
      "--font-sans-base",
      `${state.fontSans}, system-ui, sans-serif`,
    );
    el.style.setProperty(
      "--font-heading-base",
      `${state.fontHeading}, system-ui, sans-serif`,
    );
    notify();
  }

  function notify() {
    const snapshot = { ...state, dark: resolveDark() };
    for (const fn of listeners) {
      try {
        fn(snapshot);
      } catch (err) {
        console.error("[appearance] listener 抛错", err);
      }
    }
  }

  /** 合并状态并应用 + 持久化变更键 */
  function set(patch, { persist = true } = {}) {
    const changed = {};
    for (const [key, value] of Object.entries(patch)) {
      if (key in state && state[key] !== value) {
        state[key] = value;
        changed[key] = value;
      }
    }
    if (Object.keys(changed).length === 0) return;
    if (persist) {
      for (const key of Object.keys(changed)) {
        writePref(PREF_KEY_MAP[key], changed[key]);
      }
    }
    apply();
  }

  /** 订阅外观变化（含 dark 推导值）；返回取消订阅函数 */
  function on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function setTheme(theme) {
    set({ theme });
  }

  function setStyle(style) {
    set({ style });
  }

  function setBase(base) {
    set({ base });
  }

  function setChart(chart) {
    set({ chart });
  }

  function setRadius(radius) {
    set({ radius });
  }

  function setFontSans(fontSans) {
    set({ fontSans });
  }

  function setFontHeading(fontHeading) {
    set({ fontHeading });
  }

  function setMenu(menu) {
    set({ menu });
  }

  function setSidebarVariant(sidebarVariant) {
    set({ sidebarVariant });
  }

  function setSidebarCollapsible(sidebarCollapsible) {
    set({ sidebarCollapsible });
  }

  function setSidebarWidth(sidebarWidth) {
    set({ sidebarWidth });
  }

  function setSidebarOpen(sidebarOpen) {
    set({ sidebarOpen });
  }

  function getState() {
    return { ...state, dark: resolveDark() };
  }

  /** 重新读取持久化偏好（PREPAINT 之后首次接管时幂等） */
  function load() {
    const next = { ...APPEARANCE_DEFAULTS };
    for (const [key, prefKey] of Object.entries(PREF_KEY_MAP)) {
      const raw = readPref(prefKey);
      if (raw === null || raw === "") continue;
      const parsed = parsePref(key, raw);
      if (parsed !== null) next[key] = parsed;
    }
    state = next;
  }

  // 构造：加载偏好 → 监听系统主题 → 应用
  load();
  if (win.matchMedia) {
    media = win.matchMedia("(prefers-color-scheme: dark)");
    systemDark = media.matches;
    media.addEventListener?.("change", () => {
      systemDark = media.matches;
      if (state.theme === "system") apply();
    });
  }
  apply();

  return {
    getState,
    set,
    on,
    apply,
    load,
    setTheme,
    setStyle,
    setBase,
    setChart,
    setRadius,
    setFontSans,
    setFontHeading,
    setMenu,
    setSidebarVariant,
    setSidebarCollapsible,
    setSidebarWidth,
    setSidebarOpen,
  };
}

/** 全局单例（浏览器环境）；测试用 createAppearance({ storage, doc }) */
export const appearance = globalThis.document ? createAppearance() : null;
