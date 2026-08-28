/**
 * packages/contracts/constants.js — 前后端共享常量（ARCHITECTURE.md §3，
 * packages/contracts：纯常量、无逻辑，web 与 server 的模块图都会 import）。
 *
 * 注意：主题外观相关键名被两处消费——shared/lib/appearance.js（运行时）与
 * apps/web/index.html 的 PREPAINT 内联脚本（首帧前）。改动任何键名必须同步
 * 两处，否则刷新闪白/闪暗（docs/CSS.md §1 注入通道 2）。
 */

/** 客户端偏好持久化键（localStorage，ARCHITECTURE.md §6.3）。 */
export const STORAGE_KEYS = {
  theme: "pref:theme", // system | light | dark
  locale: "pref:locale", // zh-CN | zh-TW | en
  style: "pref:style", // nova | vega | ...（style-* 类，恰有一个）
  base: "pref:base", // zinc | red | ...（base-* 类，恰有一个）
  chart: "pref:chart", // 12 图表色之一（chart-* 类，恰有一个）
  radius: "pref:radius", // --radius 基准（rem 数值字符串）
  fontSans: "pref:font-sans", // --font-sans-base 使用的字体名
  fontHeading: "pref:font-heading", // --font-heading-base 使用的字体名
  menuAppearance: "pref:menu-appearance", // menu-* 类（菜单外观）
  sidebarVariant: "pref:sidebar-variant", // sidebar | floating | inset
  sidebarCollapsible: "pref:sidebar-collapsible", // offcanvas | icon | none
  sidebarOpen: "pref:sidebar-open",
  sidebarWidth: "pref:sidebar-width",
  workspace: "pref:workspace", // 最近使用的工作空间 id
};

/** 会话令牌存储键（按 storageKind 分置于 localStorage / sessionStorage，Auth.md §1）。 */
export const AUTH_TOKEN_STORAGE_KEY = "auth:token";

/**
 * 会话时长选项（Auth.md §2）。seconds = null 表示“保持登录直到下次浏览器打开”
 * ——服务端仍发 30 天兜底 exp（SESSION_FALLBACK_SECONDS），真正生命周期由
 * sessionStorage 保证。
 */
export const SESSION_FALLBACK_SECONDS = 30 * 24 * 60 * 60;

export const SESSION_DURATIONS = [
  { id: "4h", seconds: 4 * 60 * 60, storage: "persistent" },
  { id: "8h", seconds: 8 * 60 * 60, storage: "persistent" },
  { id: "12h", seconds: 12 * 60 * 60, storage: "persistent" },
  { id: "24h", seconds: 24 * 60 * 60, storage: "persistent" },
  { id: "7d", seconds: 7 * 24 * 60 * 60, storage: "persistent" },
  { id: "14d", seconds: 14 * 24 * 60 * 60, storage: "persistent" },
  { id: "30d", seconds: 30 * 24 * 60 * 60, storage: "persistent" },
  { id: "90d", seconds: 90 * 24 * 60 * 60, storage: "persistent" },
  { id: "session", seconds: SESSION_FALLBACK_SECONDS, storage: "session" },
];

/** 侧栏宽度拖拽范围（px，ARCHITECTURE.md §5.2）。 */
export const SIDEBAR_WIDTH_LIMITS = { min: 160, max: 480 };

/** 响应式断点（px，docs/Layout.md §2 表；组件 JS 逻辑与媒体查询两处必须同步）。 */
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };

/** 外观可选值清单（主题设置面板 ds-theme-settings 的数据源，ARCHITECTURE.md §6.3）。 */
export const APPEARANCE_STYLES = [
  "nova",
  "vega",
  "maia",
  "lyra",
  "mira",
  "luma",
  "sera",
  "rhea",
];

export const APPEARANCE_BASES = [
  "zinc",
  "red",
  "orange",
  "green",
  "blue",
  "violet",
  "rose",
];

export const APPEARANCE_CHARTS = [
  "zinc",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "blue",
  "violet",
  "rose",
];

/** 自托管可变字体清单（public/fonts/，docs/CSS.md §4）。 */
export const FONT_FAMILIES = ["inter", "manrope", "geist"];

/** 三种支持语言（i18n.md §0；组件选项列表读本常量，见 i18n.md §7）。 */
export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en"];
