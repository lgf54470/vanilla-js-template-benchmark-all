// packages/contracts/constants.js — 前后端共享的纯常量/枚举（无逻辑，零依赖）
//
// 这是 web/server 唯一允许共同 import 的包（ARCHITECTURE.md §3）；不要在这里放任何
// 可执行逻辑。web 侧经 import map 的 @contracts/ 别名引用，server 侧经相对路径引用。

/** 客户端偏好存储键（localStorage/sessionStorage），统一 pref: 前缀（§6.3 / §7.4 / §11） */
export const STORAGE_KEYS = Object.freeze({
  /** system | light | dark */
  THEME: "pref:theme",
  /** zh-CN | zh-TW | en */
  LOCALE: "pref:locale",
  /** 当前工作空间 id（Workspace.md §4） */
  WORKSPACE: "pref:workspace",
  /** 侧栏展开态（"true" | "false"） */
  SIDEBAR_OPEN: "pref:sidebar-open",
  /** 侧栏展开宽度（px 数字字符串） */
  SIDEBAR_WIDTH: "pref:sidebar-width",
  /** 风格名（style-<name> 的 <name>） */
  STYLE: "pref:style",
  /** 基色名（base-<name> 的 <name>） */
  BASE: "pref:base",
  /** 图表色名（chart-<name> 的 <name>） */
  CHART: "pref:chart",
  /** 圆角基准 --radius（px 数字字符串） */
  RADIUS: "pref:radius",
  /** 正文字体（@font-face family 名） */
  FONT_SANS: "pref:font-sans",
  /** 标题字体（@font-face family 名） */
  FONT_HEADING: "pref:font-heading",
  /** 侧栏变体 sidebar | floating | inset */
  SIDEBAR_VARIANT: "pref:sidebar-variant",
  /** 侧栏折叠模式 icon | offcanvas | none */
  SIDEBAR_COLLAPSIBLE: "pref:sidebar-collapsible",
  /** 菜单外观 default | compact | spacious */
  MENU: "pref:menu",
  /** 持久会话令牌（localStorage，跨浏览器重启存活） */
  AUTH_TOKEN: "pref:auth-token",
  /** 会话级令牌（sessionStorage，浏览器关闭即清除，Auth.md §2） */
  AUTH_TOKEN_SESSION: "pref:auth-token-session",
  /** 登录时选择的会话时长选项 id */
  SESSION_DURATION: "pref:session-duration",
});

/** 会话时长选项（Auth.md §2）：8 个固定时长 + 1 个「保持登录直到下次浏览器打开」 */
export const SESSION_DURATIONS = Object.freeze([
  { id: "4h", labelKey: "auth.session.4h", hours: 4 },
  { id: "8h", labelKey: "auth.session.8h", hours: 8 },
  { id: "12h", labelKey: "auth.session.12h", hours: 12 },
  { id: "24h", labelKey: "auth.session.24h", hours: 24 },
  { id: "7d", labelKey: "auth.session.7d", days: 7 },
  { id: "14d", labelKey: "auth.session.14d", days: 14 },
  { id: "30d", labelKey: "auth.session.30d", days: 30 },
  { id: "90d", labelKey: "auth.session.90d", days: 90 },
  { id: "session", labelKey: "auth.session.sessionOnly", session: true },
]);

/** Sidebar 宽度（px）与拖拽限制（Layout.md §1.1） */
export const SIDEBAR_WIDTH_LIMITS = Object.freeze({
  MIN: 160,
  MAX: 480,
  /** 展开态默认 256px = 16rem（tokens/sidebar.css --sidebar-width） */
  DEFAULT: 256,
  /** 图标条 48px = 3rem（--sidebar-width-icon） */
  ICON: 48,
  /** 移动端 288px = 18rem（--sidebar-width-mobile） */
  MOBILE: 288,
  /** 拖拽松手宽度 < min + SNAP 时吸附折叠 */
  SNAP: 24,
});

/** 响应式断点（px，Layout.md §2；与 CSS 媒体查询同步修改） */
export const BREAKPOINTS = Object.freeze({
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
});

/** 支持的语言（i18n.md §7） */
export const SUPPORTED_LOCALES = Object.freeze(["zh-CN", "zh-TW", "en"]);
export const DEFAULT_LOCALE = "zh-CN";

/** 默认工作空间（Workspace.md §2） */
export const DEFAULT_WORKSPACE_ID = "ws_default";

/** 系统工作空间 id（is_system=1，不可删除，Workspace.md §2） */
export const SYSTEM_WORKSPACE_IDS = Object.freeze([
  "ws_default",
  "ws_work",
  "ws_study",
  "ws_life",
  "ws_entertainment",
  "ws_travel",
]);

/** 工作空间种子元数据（Workspace.md §2；name 走 i18n key） */
export const SEED_WORKSPACES = Object.freeze([
  {
    id: "ws_default",
    nameKey: "workspace.seed.default",
    icon: "home",
    order: 0,
  },
  {
    id: "ws_work",
    nameKey: "workspace.seed.work",
    icon: "briefcase",
    order: 1,
  },
  {
    id: "ws_study",
    nameKey: "workspace.seed.study",
    icon: "graduation-cap",
    order: 2,
  },
  { id: "ws_life", nameKey: "workspace.seed.life", icon: "heart", order: 3 },
  {
    id: "ws_entertainment",
    nameKey: "workspace.seed.entertainment",
    icon: "gamepad-2",
    order: 4,
  },
  {
    id: "ws_travel",
    nameKey: "workspace.seed.travel",
    icon: "plane",
    order: 5,
  },
]);

/** 每请求上下文请求头（Auth.md §3 / Workspace.md §4） */
export const HEADERS = Object.freeze({
  /** 登录请求携带明文密码；登录成功后同一头名携带会话令牌 */
  AUTH: "x-auth-password",
  WORKSPACE: "x-workspace-id",
});

/** 统一响应包络错误码（SCREAMING_SNAKE_CASE，ARCHITECTURE.md §8） */
export const ERROR_CODES = Object.freeze({
  AUTH_INVALID_PASSWORD: "AUTH_INVALID_PASSWORD",
  AUTH_MISSING_TOKEN: "AUTH_MISSING_TOKEN",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_REVOKED: "AUTH_REVOKED",
  AUTH_LOCKED: "AUTH_LOCKED",
  WORKSPACE_NOT_FOUND: "WORKSPACE_NOT_FOUND",
  WORKSPACE_IS_SYSTEM: "WORKSPACE_IS_SYSTEM",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
});

/** 部署目标（Deployment.md §1） */
export const DEPLOY_TARGETS = Object.freeze([
  "local",
  "cloudflare",
  "vercel",
  "deno",
  "docker",
]);

/** 主题：8 风格 / 7 基色 / 12 图表色（CSS.md §2） */
export const STYLES = Object.freeze([
  "nova",
  "vega",
  "maia",
  "lyra",
  "mira",
  "luma",
  "sera",
  "rhea",
]);
export const BASE_COLORS = Object.freeze([
  "zinc",
  "red",
  "orange",
  "green",
  "blue",
  "violet",
  "rose",
]);
export const CHART_COLORS = Object.freeze([
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "violet",
  "rose",
]);

/** 字体选项（tokens/typography.css 的 @font-face family 名，Design.md §2） */
export const FONT_OPTIONS = Object.freeze([
  "Inter Variable",
  "Manrope Variable",
  "Geist Variable",
]);

/** 图标 sprite 名称（public/icons.svg，Design.md §5）——仅作集中登记，供画廊/文档引用 */
export const ICON_NAMES = Object.freeze([
  "home",
  "briefcase",
  "graduation-cap",
  "heart",
  "gamepad-2",
  "plane",
  "folder",
  "panel-left",
  "settings",
  "user",
  "log-out",
  "moon",
  "sun",
  "laptop",
  "languages",
  "eye",
  "eye-off",
  "check",
  "circle-check",
  "chevron-down",
  "chevron-right",
  "chevron-up",
  "plus",
  "search",
  "more-horizontal",
  "more-vertical",
  "x",
  "bell",
  "info",
  "alert-triangle",
  "circle-alert",
  "sparkles",
  "layout-dashboard",
  "list-tree",
  "key",
  "scroll-text",
  "monitor",
  "book-open",
  "notebook-pen",
  "tag",
  "trash",
  "edit",
  "copy",
  "refresh",
  "arrow-right",
  "arrow-left",
  "external-link",
  "shield",
  "database",
  "server",
  "globe",
  "cable",
  "activity",
  "gauge",
  "wrench",
]);
