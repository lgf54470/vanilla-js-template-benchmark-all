/**
 * web/server 共享常量（无逻辑）。新增常量前先确认是否真的需要跨端共享——
 * 仅 web 使用的放 apps/web/src/shared/lib，仅 server 使用的放对应模块。
 */

/** 应用名（Header 展示 / 日志项目名）。 */
export const APP_NAME = "vanilla-js-template";

/**
 * 客户端偏好存储键。约定：一律 `pref:*` 前缀，只进 localStorage/sessionStorage，
 * 不进数据库（数据库只存需要跨设备同步的内容，见 ARCHITECTURE §9.3）。
 * @type {Readonly<Record<string, string>>}
 */
export const STORAGE_KEYS = {
  THEME: "pref:theme",
  STYLE: "pref:style",
  BASE: "pref:base",
  CHART: "pref:chart",
  MENU: "pref:menu",
  RADIUS: "pref:radius",
  FONT_SANS: "pref:font-sans",
  FONT_HEADING: "pref:font-heading",
  SIDEBAR_VARIANT: "pref:sidebar-variant",
  SIDEBAR_COLLAPSIBLE: "pref:sidebar-collapsible",
  SIDEBAR_OPEN: "pref:sidebar-open",
  SIDEBAR_WIDTH: "pref:sidebar-width",
  LOCALE: "pref:locale",
  WORKSPACE: "pref:workspace",
  AUTH_TOKEN: "pref:auth-token",
};

/**
 * `app_settings` 键命名空间（server 侧）。命名空间前缀决定归属模块，
 * 跨模块读取其他 key 视同跨模块耦合（Database.md §1.1）。
 * @type {Readonly<Record<string, string>>}
 */
export const SETTINGS_KEYS = {
  AUTH: "settings:auth",
  AUTH_LOCKOUT: "settings:auth-lockout",
  PROFILE: "settings:profile",
  ACCOUNT: "settings:account",
  DISPLAY: "settings:display",
  WORKSPACE: "settings:workspace",
};

/** 系统种子工作空间的默认 id（x-workspace-id 缺失时的回退目标）。 */
export const DEFAULT_WORKSPACE_ID = "ws_default";

/**
 * 会话时长选项（Auth.md §2 的 2×4 网格 + 底部大按钮）。
 * `browser-session`：服务端令牌设 30 天兜底上限，真正生命周期由
 * sessionStorage 保证（浏览器关闭即清除）。
 */
export const SESSION_DURATIONS = [
  { id: "4h", ms: 4 * 3600_000, storage: "persistent" },
  { id: "8h", ms: 8 * 3600_000, storage: "persistent" },
  { id: "12h", ms: 12 * 3600_000, storage: "persistent" },
  { id: "24h", ms: 24 * 3600_000, storage: "persistent" },
  { id: "7d", ms: 7 * 86_400_000, storage: "persistent" },
  { id: "14d", ms: 14 * 86_400_000, storage: "persistent" },
  { id: "30d", ms: 30 * 86_400_000, storage: "persistent" },
  { id: "90d", ms: 90 * 86_400_000, storage: "persistent" },
  { id: "browser-session", ms: 30 * 86_400_000, storage: "session" },
];

/** 统一响应包络的 ok 字段取值（ARCHITECTURE §8）。 */
export const RESPONSE_OK = true;
export const RESPONSE_FAIL = false;
