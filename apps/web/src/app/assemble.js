// apps/web/src/app/assemble.js — 应用装配（M4 壳层）
//
// 职责：
//   1. 注册全部共享 UI + 壳层组件（import 副作用）；
//   2. 初始化 http 客户端默认值（token/workspace 提供器注入）；
//   3. 登录门控：无令牌 → 登录页；有令牌 → AppShell；
//   4. AppShell 装配：侧栏菜单（moduleRegistry 驱动 + labelKey 翻译）、
//      workspace-switcher（GET /api/workspaces + i18n: 前缀处理）、
//      nav-user（profile/account 掩码）、Header 事件、主题设置联动；
//   5. 路由：hash 路由 → 动态 import 模块 index.js 挂载到 <main>；
//   6. 语言切换：先 loadLocaleDictionaries 再重建壳 + 重挂当前路由
//      （i18n.md §1 时序：字典未就绪就渲染会整屏裸 key）。
//
// 全局一次性订阅（bootstrap）：auth:unauthorized → 退回登录页；
// workspace:changed → 重挂当前模块（组件树完全 unmount 再 mount）。

import "../shared/ui/index.js";
import "./shell/app-shell.js";
import "./header/header.js";
import "./theme-settings/theme-settings.js";

import { appearance } from "../shared/lib/appearance.js";
import { getLocale, t } from "../shared/lib/i18n.js";
import { maskValue } from "../shared/lib/mask.js";
import { http, setHttpClientDefaults } from "../shared/core/http-client.js";
import {
  clearAuthToken,
  getAuthToken,
  logout,
} from "../shared/core/auth-client.js";
import {
  getWorkspaceId,
  setWorkspaceId,
} from "../shared/core/workspace-client.js";
import { router } from "../shared/core/router.js";
import { on } from "../shared/core/event-bus.js";
import {
  DEFAULT_LOCALE,
  STORAGE_KEYS,
  SUPPORTED_LOCALES,
} from "@contracts/constants.js";
import { moduleRegistry } from "../modules/registry.generated.js";
import { loadLocaleDictionaries } from "./i18n/bootstrap.js";
import { mountLogin } from "./login/login.js";

const APP_NAME = "vanilla-js-template";
const app = document.querySelector("#app");

// 模块挂载点与当前状态（模块级变量，供全局订阅闭包读取）
let shell = null;
let mainEl = null;
let sidebarMenuEl = null;
let currentRoute = null;
let moduleCleanup = null;

setHttpClientDefaults({ getToken: getAuthToken, getWorkspaceId });

/** 统一 http 请求（模块 ctx 用） */
function request(path, init) {
  return http().request(path, init);
}

// ---- 入口 ----

export async function bootstrap() {
  const saved = localStorage.getItem(STORAGE_KEYS.LOCALE);
  const locale = SUPPORTED_LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
  try {
    await loadLocaleDictionaries(locale);
  } catch (err) {
    console.warn("[i18n] 启动字典加载失败，回退默认语言", err);
    await loadLocaleDictionaries(DEFAULT_LOCALE).catch(() => {});
  }

  // 全局一次性订阅
  router.onRoute(({ path }) => {
    if (shell) mountRoute(path);
  });
  on("auth:unauthorized", () => {
    clearAuthToken();
    renderGate();
  });
  on("workspace:changed", () => {
    if (shell && currentRoute) mountRoute(currentRoute);
  });
  appearance.on((s) => {
    const sidebar = shell?.querySelector("ds-sidebar");
    if (sidebar) {
      sidebar.setAttribute("variant", s.sidebarVariant);
      sidebar.setAttribute("collapsible", s.sidebarCollapsible);
    }
    const header = shell?.querySelector("ds-app-header");
    if (header) header.setAttribute("theme", s.theme);
  });

  renderGate();
}

// ---- 门控 ----

function renderGate() {
  if (getAuthToken()) {
    renderShell();
  } else {
    teardown();
    mountLogin(app, { onLogin: renderShell, appName: APP_NAME });
  }
}

// ---- 壳装配 ----

function renderShell() {
  teardown();
  const state = appearance.getState();
  app.innerHTML = `<ds-app-shell></ds-app-shell>`;
  shell = app.querySelector("ds-app-shell");

  // 侧栏骨架（ds-app-shell 已渲染 provider 两列网格，这里填内容）
  const sidebar = shell.querySelector(".app-shell__sidebar");
  sidebar.setAttribute("variant", state.sidebarVariant);
  sidebar.setAttribute("collapsible", state.sidebarCollapsible);
  sidebar.innerHTML = `
    <ds-sidebar-header>
      <ds-workspace-switcher></ds-workspace-switcher>
    </ds-sidebar-header>
    <ds-sidebar-content>
      <ds-sidebar-group>
        <ds-sidebar-menu></ds-sidebar-menu>
      </ds-sidebar-group>
    </ds-sidebar-content>
    <ds-sidebar-footer>
      <ds-nav-user></ds-nav-user>
    </ds-sidebar-footer>
    <ds-sidebar-rail></ds-sidebar-rail>`;

  // Header
  shell.querySelector(".app-shell__header").innerHTML =
    `<ds-app-header theme="${state.theme}" locale="${getLocale()}"
      appname="${APP_NAME}"></ds-app-header>`;

  mainEl = shell.querySelector(".app-shell__main");
  buildSidebarMenu();
  loadWorkspaces();
  loadUser();
  wireShellEvents();
  mountRoute(router.path);
}

function teardown() {
  moduleCleanup?.();
  moduleCleanup = null;
  shell = null;
  mainEl = null;
  sidebarMenuEl = null;
  app.innerHTML = "";
}

// ---- 侧栏菜单（moduleRegistry 驱动，i18n.md §1 labelKey 翻译） ----

function buildSidebarMenu() {
  sidebarMenuEl = shell.querySelector("ds-sidebar-menu");
  sidebarMenuEl.innerHTML = "";
  for (const m of moduleRegistry) {
    if (m.submodules?.length) {
      const collapsible = document.createElement("ds-collapsible");
      collapsible.setAttribute("label", t(m.labelKey));
      const sub = document.createElement("ds-sidebar-menu-sub");
      for (const s of m.submodules) {
        const item = document.createElement("ds-sidebar-menu-sub-item");
        item.setAttribute("label", t(s.labelKey));
        item.setAttribute("route", s.route);
        item.dataset.route = s.route;
        sub.append(item);
      }
      collapsible.append(sub);
      sidebarMenuEl.append(collapsible);
    } else {
      const item = document.createElement("ds-sidebar-menu-item");
      item.setAttribute("icon", m.icon);
      item.setAttribute("label", t(m.labelKey));
      item.setAttribute("title", t(m.labelKey));
      item.setAttribute("route", m.route);
      item.dataset.route = m.route;
      sidebarMenuEl.append(item);
    }
  }
}

function updateActive(path) {
  const items = sidebarMenuEl?.querySelectorAll("[data-route]") ?? [];
  for (const item of items) {
    item.setAttribute("isactive", String(item.dataset.route === path));
  }
  // 子项激活时展开所属 collapsible
  const collapsibles = sidebarMenuEl?.querySelectorAll("ds-collapsible") ?? [];
  for (const coll of collapsibles) {
    const subActive = [...coll.querySelectorAll("[data-route]")].some(
      (i) => i.dataset.route === path,
    );
    coll.toggleAttribute("open", subActive);
  }
}

// ---- 路由与模块挂载 ----

function resolveModule(path) {
  for (const m of moduleRegistry) {
    if (m.route === path) return m;
    if (m.submodules?.some((s) => s.route === path)) return m;
  }
  return null;
}

async function mountRoute(path) {
  const mod = resolveModule(path) ?? moduleRegistry[0];
  currentRoute = mod.submodules?.some((s) => s.route === path)
    ? path
    : mod.route;
  updateActive(currentRoute);
  moduleCleanup?.();
  moduleCleanup = null;
  mainEl.innerHTML = "";
  try {
    const { mount } = await import(`../modules/${mod.id}/index.js`);
    const ctx = {
      t,
      http: request,
      locale: getLocale(),
      workspaceId: getWorkspaceId(),
      navigate: (p) => router.navigate(p),
    };
    moduleCleanup = mount(mainEl, ctx) ?? (() => {});
  } catch (err) {
    console.error(`[assemble] 模块 ${mod.id} 挂载失败`, err);
    mainEl.innerHTML = `
      <div class="page-container">
        <ds-page-placeholder icon="circle-alert" title="模块加载失败"
          description="${t("shell.login.error.failed")}"></ds-page-placeholder>
      </div>`;
  }
}

// ---- 工作空间 / 用户 ----

async function loadWorkspaces() {
  const switcher = shell?.querySelector("ds-workspace-switcher");
  if (!switcher) return;
  try {
    const data = await request("/api/workspaces");
    const items = data.map((w) => ({
      id: w.id,
      name: w.name.startsWith("i18n:") ? t(w.name.slice(5)) : w.name,
      icon: w.icon,
    }));
    switcher.setAttribute("items", JSON.stringify(items));
    switcher.setAttribute("value", getWorkspaceId());
  } catch (err) {
    console.warn("[assemble] 工作空间加载失败", err);
  }
}

async function loadUser() {
  const navUser = shell?.querySelector("ds-nav-user");
  if (!navUser) return;
  try {
    const [profile, account] = await Promise.all([
      request("/api/settings/profile"),
      request("/api/settings/account"),
    ]);
    const name = profile.nickname || account?.name ||
      t("shell.nav.userFallback");
    navUser.setAttribute("name", name);
    if (account?.email) {
      navUser.setAttribute("email", maskValue(account.email, "email"));
    }
  } catch {
    // 保留组件占位（用户/未绑定邮箱）
  }
}

// ---- 壳事件 ----

function wireShellEvents() {
  shell.addEventListener("ds-sidebar-menu-select", (e) => {
    const route = e.detail?.route;
    if (route) router.navigate(route);
  });
  shell.addEventListener("workspace-switcher-select", (e) => {
    const id = e.detail?.workspaceId;
    if (!id) return;
    setWorkspaceId(id);
    shell.querySelector("ds-workspace-switcher")?.setAttribute("value", id);
  });
  shell.addEventListener("nav-user-action", (e) => {
    const action = e.detail?.action;
    if (action === "logout") return doLogout();
    if (action === "settings" || action === "profile") {
      router.navigate("/settings/profile");
    }
    if (action === "account") router.navigate("/settings/account");
  });
  shell.addEventListener("ds-theme-switch-change", (e) => {
    if (e.detail?.value) appearance.setTheme(e.detail.value);
  });
  shell.addEventListener("ds-lang-switch-change", (e) => {
    if (e.detail?.value) handleLocaleChanged(e.detail.value);
  });
  shell.addEventListener("app-header-logout", doLogout);
}

async function handleLocaleChanged(locale) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
  } catch {
    // 隐私模式静默
  }
  await loadLocaleDictionaries(locale);
  const path = currentRoute ?? router.path;
  renderShell(); // 重建壳（菜单/工作空间名/Header 文案重新翻译）
  if (router.path !== path) router.navigate(path); // 同步地址栏后重挂
}

async function doLogout() {
  await logout();
  renderGate();
}
