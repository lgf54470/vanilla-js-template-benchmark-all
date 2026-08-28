/**
 * packages/contracts — 前后端共享常量与 JSDoc typedef（无任何逻辑）。
 * 前端经静态 URL `/packages/contracts/constants.js` 引用（docs/Deployment.md §2）；
 * 后端经根 deno.json 的 `@contracts/` 映射引用。
 *
 * @module contracts/constants
 */

/** 应用名（日志前缀、Header 应用名） */
export const APP_NAME = "vanilla-js-template";

/**
 * 客户端偏好存储键（localStorage，`pref:*` 命名空间）。
 * 数据库只存跨设备同步项（settings:display 等），客户端偏好一律不进库
 * ——见 ARCHITECTURE.md §6.3/§11。
 * @type {Readonly<Record<string, string>>}
 */
export const STORAGE_KEYS = Object.freeze({
  /** 亮暗模式：system | light | dark */
  THEME: "pref:theme",
  /** 界面语言：zh-CN | zh-TW | en */
  LOCALE: "pref:locale",
  /** 当前工作空间 id */
  WORKSPACE: "pref:workspace",
  /** 侧栏展开态（桌面） */
  SIDEBAR_OPEN: "pref:sidebar-open",
  /** 侧栏拖拽宽度（px 数值） */
  SIDEBAR_WIDTH: "pref:sidebar-width",
  /** 风格令牌集：style-nova / style-vega / ...（8 选 1） */
  STYLE: "pref:style",
  /** 基色调色板：base-zinc / base-red / ...（7 选 1） */
  PALETTE: "pref:palette",
  /** 图表色：chart-1..chart-12（12 选 1） */
  CHART: "pref:chart",
  /** 圆角基准（px 数值字符串） */
  RADIUS: "pref:radius",
  /** 正文字体族名 */
  FONT_SANS: "pref:font-sans",
  /** 标题字体族名 */
  FONT_HEADING: "pref:font-heading",
  /** 菜单密度外观：menu-cozy | menu-compact */
  MENU: "pref:menu",
  /** 侧栏变体：sidebar | floating | inset */
  SIDEBAR_VARIANT: "pref:sidebar-variant",
  /** 侧栏折叠模式：icon | offcanvas | none */
  SIDEBAR_COLLAPSIBLE: "pref:sidebar-collapsible",
  /** 会话令牌（localStorage 持久档；session 档存 sessionStorage 同名键） */
  AUTH_TOKEN: "auth:token",
});

/** 亮暗模式三选一 */
export const THEME_OPTIONS = Object.freeze(["system", "light", "dark"]);

/** 支持的语言（docs/i18n.md §7） */
export const SUPPORTED_LOCALES = Object.freeze(["zh-CN", "zh-TW", "en"]);
export const DEFAULT_LOCALE = "zh-CN";

/** 断点表（docs/Layout.md §2；CSS 媒体查询与 JS 常量必须同步） */
export const BREAKPOINTS = Object.freeze({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
});

/** 默认（回退）工作空间 id */
export const DEFAULT_WORKSPACE_ID = "ws_default";

/** 每请求上下文请求头（与 x-auth-password 同级，ARCHITECTURE §7.4） */
export const WORKSPACE_HEADER = "x-workspace-id";

/** 鉴权请求头：登录时携带明文密码，之后携带签发的会话令牌（ARCHITECTURE §10.1） */
export const AUTH_HEADER = "x-auth-password";

/**
 * 会话时长选项（Auth.md §2 的 2×4 网格；"session" 为底部通栏大按钮）。
 * @type {ReadonlyArray<{ id: string, labelKey: string, ms: number }>}
 */
export const SESSION_DURATIONS = Object.freeze([
  { id: "4h", labelKey: "auth.session.4h", ms: 4 * 3600_000 },
  { id: "8h", labelKey: "auth.session.8h", ms: 8 * 3600_000 },
  { id: "12h", labelKey: "auth.session.12h", ms: 12 * 3600_000 },
  { id: "24h", labelKey: "auth.session.24h", ms: 24 * 3600_000 },
  { id: "7d", labelKey: "auth.session.7d", ms: 7 * 24 * 3600_000 },
  { id: "14d", labelKey: "auth.session.14d", ms: 14 * 24 * 3600_000 },
  { id: "30d", labelKey: "auth.session.30d", ms: 30 * 24 * 3600_000 },
  { id: "90d", labelKey: "auth.session.90d", ms: 90 * 24 * 3600_000 },
]);

/** "保持登录直到下次浏览器打开" 选项 id（存 sessionStorage） */
export const SESSION_ONLY_ID = "session";

/** session 档令牌的服务端兜底过期上限（天），真正的失效由 sessionStorage 生命周期保证 */
export const SESSION_ONLY_FALLBACK_DAYS = 30;

/**
 * 统一响应包络的错误码（SCREAMING_SNAKE_CASE，ARCHITECTURE §8）。
 * @type {Readonly<Record<string, string>>}
 */
export const API_ERRORS = Object.freeze({
  AUTH_MISSING_TOKEN: "AUTH_MISSING_TOKEN",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_INVALID_PASSWORD: "AUTH_INVALID_PASSWORD",
  AUTH_REVOKED: "AUTH_REVOKED",
  AUTH_LOCKED: "AUTH_LOCKED",
  AUTH_NOT_INITIALIZED: "AUTH_NOT_INITIALIZED",
  WORKSPACE_NOT_FOUND: "WORKSPACE_NOT_FOUND",
  WORKSPACE_NOT_DELETABLE: "WORKSPACE_NOT_DELETABLE",
  WORKSPACE_NAME_REQUIRED: "WORKSPACE_NAME_REQUIRED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL: "INTERNAL",
});

/** 密码派生参数（PBKDF2-SHA256，ARCHITECTURE §10.1） */
export const PBKDF2_ITERATIONS = 100_000;

/** 登录限流：连续失败阈值与指数退避（Auth.md §6） */
export const LOGIN_LOCKOUT = Object.freeze({
  THRESHOLD: 5,
  BASE_SECONDS: 30,
  MAX_SECONDS: 1800,
});
