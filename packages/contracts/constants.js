/**
 * LocalStorage / SessionStorage 持久化键
 */
export const STORAGE_KEYS = {
  THEME: "pref:theme",
  BASE_COLOR: "pref:base-color",
  STYLE: "pref:style",
  CHART_COLOR: "pref:chart-color",
  RADIUS: "pref:radius",
  FONT_SANS: "pref:font-sans",
  FONT_HEADING: "pref:font-heading",
  SIDEBAR_VARIANT: "pref:sidebar-variant",
  SIDEBAR_COLLAPSIBLE: "pref:sidebar-collapsible",
  SIDEBAR_WIDTH: "pref:sidebar-width",
  SIDEBAR_OPEN: "pref:sidebar-open",
  LOCALE: "pref:locale",
  WORKSPACE: "pref:workspace",
  AUTH_TOKEN: "auth:token",
  AUTH_STORAGE_KIND: "auth:storage-kind",
};

/**
 * 响应式断点 (px)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * 侧栏宽度限制 (px)
 */
export const SIDEBAR_WIDTH_LIMITS = {
  min: 160,
  max: 480,
  default: 256,
  snapThreshold: 184, // min + 24px
  iconWidth: 48,
};

/**
 * 支持的语言
 */
export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en"];
export const DEFAULT_LOCALE = "zh-CN";

/**
 * 会话时长选项 (2x4 网格 + 1个会话按钮)
 */
export const SESSION_DURATIONS = [
  { id: "4h", seconds: 4 * 3600, labelKey: "auth.duration.4h", storageKind: "persistent" },
  { id: "8h", seconds: 8 * 3600, labelKey: "auth.duration.8h", storageKind: "persistent" },
  { id: "12h", seconds: 12 * 3600, labelKey: "auth.duration.12h", storageKind: "persistent" },
  { id: "24h", seconds: 24 * 3600, labelKey: "auth.duration.24h", storageKind: "persistent" },
  { id: "7d", seconds: 7 * 86400, labelKey: "auth.duration.7d", storageKind: "persistent" },
  { id: "14d", seconds: 14 * 86400, labelKey: "auth.duration.14d", storageKind: "persistent" },
  { id: "30d", seconds: 30 * 86400, labelKey: "auth.duration.30d", storageKind: "persistent" },
  { id: "90d", seconds: 90 * 86400, labelKey: "auth.duration.90d", storageKind: "persistent" },
  { id: "session", seconds: null, labelKey: "auth.duration.session", storageKind: "session" },
];

/**
 * 6 个系统初始工作空间定义
 */
export const SEED_WORKSPACES = [
  { id: "ws_default", nameKey: "workspace.seed.default", icon: "home", sortOrder: 0, isSystem: 1 },
  { id: "ws_work", nameKey: "workspace.seed.work", icon: "briefcase", sortOrder: 1, isSystem: 1 },
  {
    id: "ws_study",
    nameKey: "workspace.seed.study",
    icon: "graduation-cap",
    sortOrder: 2,
    isSystem: 1,
  },
  { id: "ws_life", nameKey: "workspace.seed.life", icon: "heart", sortOrder: 3, isSystem: 1 },
  {
    id: "ws_entertainment",
    nameKey: "workspace.seed.entertainment",
    icon: "gamepad-2",
    sortOrder: 4,
    isSystem: 1,
  },
  { id: "ws_travel", nameKey: "workspace.seed.travel", icon: "plane", sortOrder: 5, isSystem: 1 },
];

/**
 * 8 大风格集列表
 */
export const STYLES = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"];

/**
 * 7 大基色列表
 */
export const BASE_COLORS = ["zinc", "red", "orange", "green", "blue", "violet", "rose"];

/**
 * 12 组图表色系
 */
export const CHART_COLORS = [
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
];

/**
 * 自托管字体选项
 */
export const FONTS = [
  { id: "inter", name: "Inter", value: "Inter Variable, sans-serif" },
  { id: "manrope", name: "Manrope", value: "Manrope Variable, sans-serif" },
  { id: "geist", name: "Geist", value: "Geist Variable, sans-serif" },
];

/**
 * 圆角预设选项
 */
export const RADII = [
  { value: "0", label: "0" },
  { value: "0.3rem", label: "0.3" },
  { value: "0.5rem", label: "0.5" },
  { value: "0.625rem", label: "0.625" },
  { value: "0.75rem", label: "0.75" },
  { value: "1.0rem", label: "1.0" },
];
