/**
 * packages/contracts — 前后端共享常量（无逻辑）。
 *
 * 该目录同时作为前端静态第二根（URL 前缀 /packages/contracts，见
 * docs/Deployment.md §2），因此浏览器与 Deno 两侧都只允许用相对/绝对 URL
 * import 本文件，禁止引入任何运行时依赖。
 */

/**
 * localStorage 持久化键（客户端偏好，`pref:*` 命名约定）。
 * 见 ARCHITECTURE.md §6.3（主题）、§7（工作空间）、§11（语言）、§5.2（侧栏）。
 */
export const STORAGE_KEYS = {
  /** 外观偏好（风格/基色/图表色/暗色等，具体子键见 shared/lib/appearance.js） */
  theme: "pref:theme",
  /** 设计风格（style-* 类，8 选 1，默认 nova） */
  style: "pref:style",
  /** 基色（base-* 类，7 选 1，默认 zinc） */
  baseColor: "pref:base-color",
  /** 图表色（chart-* 类，12 选 1，默认 zinc） */
  chartColor: "pref:chart-color",
  /** 圆角基准值（写到 <html> 的 --radius 内联变量） */
  radius: "pref:radius",
  /** 正文字体（--font-sans-base 的字体族名） */
  fontBody: "pref:font-body",
  /** 标题字体（--font-heading-base 的字体族名） */
  fontHeading: "pref:font-heading",
  /** 菜单外观（menu-* 类） */
  menu: "pref:menu",
  /** 当前语言（zh-CN / zh-TW / en） */
  locale: "pref:locale",
  /** 当前工作空间 id（跨设备同步则写入 settings 表） */
  workspace: "pref:workspace",
  /** 侧栏展开/折叠（SidebarProvider 读取，无记录时默认展开） */
  sidebarOpen: "pref:sidebar-open",
  /** 侧栏像素宽度（拖拽调宽松手时持久化） */
  sidebarWidth: "pref:sidebar-width",
  /** 侧栏变体（sidebar | floating | inset） */
  sidebarVariant: "pref:sidebar-variant",
  /** 侧栏折叠模式（offcanvas | icon | none） */
  sidebarCollapsible: "pref:sidebar-collapsible",
};

/**
 * 可选会话时长（单一密码鉴权的登录页 2×4 网格，ARCHITECTURE.md §10.2）。
 * label 交由 i18n 字典渲染，这里只放 id 与秒数。
 */
export const SESSION_DURATIONS = [
  { id: "4h", seconds: 4 * 60 * 60 },
  { id: "8h", seconds: 8 * 60 * 60 },
  { id: "12h", seconds: 12 * 60 * 60 },
  { id: "24h", seconds: 24 * 60 * 60 },
  { id: "7d", seconds: 7 * 24 * 60 * 60 },
  { id: "14d", seconds: 14 * 24 * 60 * 60 },
  { id: "30d", seconds: 30 * 24 * 60 * 60 },
  { id: "90d", seconds: 90 * 24 * 60 * 60 },
  /** 仅当前浏览器会话（令牌存 sessionStorage，关闭即失效） */
  { id: "session", sessionOnly: true },
];
