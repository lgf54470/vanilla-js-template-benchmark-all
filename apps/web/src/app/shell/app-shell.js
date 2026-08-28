/**
 * app/shell/app-shell.js — 应用壳装配（ARCHITECTURE §5、docs/Layout.md）。
 *
 * 结构（§5.2 组合树）：
 *   <ds-sidebar-provider class="app-shell">   顶层两列网格
 *   ├── <ds-sidebar collapsible side="left">  header=workspace-switcher /
 *   │     content=模块菜单（registry 驱动）/ footer=nav-user / rail
 *   ├── .app-shell__resize                    右缘 12px 拖拽手柄（Layout §1.1）
 *   └── <ds-sidebar-inset class="app-shell__inset">
 *         ├── <header>  trigger + 应用名 + 弹性空白 + lang/theme/theme-settings + 登出
 *         └── <main>    唯一滚动区（模块懒加载挂载点）
 *
 * 拖拽调宽契约（Layout.md §1.1，防回归）：拖拽期间只写 CSS 变量
 * （--sidebar-width + --sidebar-current-width 同帧双写），pointerup 才
 * setSidebarWidth() 持久化；宽度 < min+24 吸附折叠（先清拖拽内联变量）。
 */
import { ensurePageStyles } from "/src/shared/lib/page-styles.js";
import {
  applySidebarChrome,
  getSidebarCollapsible,
  getSidebarVariant,
  setSidebarWidth,
  SIDEBAR_WIDTH_LIMITS,
} from "/src/shared/lib/appearance.js";
import { maskValue } from "/src/shared/lib/mask.js";
import { apiFetch } from "/src/shared/core/http-client.js";
import { logout } from "/src/shared/core/auth-client.js";
import {
  getCurrentWorkspaceId,
  listWorkspaces,
  setCurrentWorkspaceId,
} from "/src/shared/core/workspace-client.js";
import {
  currentPath,
  navigate,
  reload,
  subscribe,
} from "/src/shared/core/router.js";
import { on } from "/src/shared/core/event-bus.js";
import { t } from "/src/shared/i18n/translate.js";
import { createIcon } from "/src/shared/ui/base.js";
import { toast } from "/src/shared/ui/toast/toast-host.js";
import { MODULE_REGISTRY } from "/src/modules/registry.generated.js";
import { setupRouter } from "../router/router.js";
import "./theme-settings.js";

/* 组件注册（side-effect import） */
import "/src/shared/ui/sidebar/sidebar.js";
import "/src/shared/ui/sidebar/sidebar-slots.js";
import "/src/shared/ui/sidebar-provider/sidebar-provider.js";
import "/src/shared/ui/sidebar-inset/sidebar-inset.js";
import "/src/shared/ui/sidebar-rail/sidebar-rail.js";
import "/src/shared/ui/sidebar-trigger/sidebar-trigger.js";
import "/src/shared/ui/sidebar-menu-button/sidebar-menu-button.js";
import "/src/shared/ui/collapsible/collapsible.js";
import "/src/shared/ui/workspace-switcher/workspace-switcher.js";
import "/src/shared/ui/nav-user/nav-user.js";
import "/src/shared/ui/theme-switch/theme-switch.js";
import "/src/shared/ui/lang-switch/lang-switch.js";
import "/src/shared/ui/icon-button/icon-button.js";

const APP_TITLE = "vanilla-js-template";

/** @param {string} tag @param {Record<string, string>} [attrs] */
function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

export class AppShell {
  /** @param {HTMLElement} host 挂载容器（#app） */
  constructor(host) {
    this.#host = host;
  }

  #host;
  /** @type {Record<string, HTMLElement>} */
  #els = {};
  /** @type {Array<() => void>} */
  #teardown = [];
  /** @type {Array<{ route: string, el: HTMLElement }>} */
  #menuButtons = [];
  #routerHandle = null;

  async mount() {
    ensurePageStyles(import.meta.url, "./app-shell.css");
    this.#host.innerHTML = `
      <ds-sidebar-provider class="app-shell">
        <ds-sidebar collapsible="icon" side="left">
          <ds-sidebar-header>
            <ds-workspace-switcher></ds-workspace-switcher>
          </ds-sidebar-header>
          <ds-sidebar-content></ds-sidebar-content>
          <ds-sidebar-footer>
            <ds-nav-user></ds-nav-user>
          </ds-sidebar-footer>
          <ds-sidebar-rail></ds-sidebar-rail>
        </ds-sidebar>
        <div class="app-shell__resize" role="separator"
          aria-orientation="vertical"
          aria-label="${t("shell.sidebarResize", "拖拽调整侧栏宽度")}"></div>
        <div class="app-shell__resize-bubble" hidden></div>
        <ds-sidebar-inset class="app-shell__inset">
          <header class="app-shell__header">
            <ds-sidebar-trigger></ds-sidebar-trigger>
            <span class="app-shell__title">${APP_TITLE}</span>
            <span class="app-shell__spacer"></span>
            <ds-lang-switch></ds-lang-switch>
            <ds-theme-switch compact></ds-theme-switch>
            <ds-theme-settings></ds-theme-settings>
            <ds-icon-button icon="log-out" class="app-shell__logout"
              aria-label="${t("nav.logout", "退出登录")}"></ds-icon-button>
          </header>
          <main class="app-shell__main"></main>
        </ds-sidebar-inset>
      </ds-sidebar-provider>`;

    this.#els = {
      provider: this.#host.querySelector("ds-sidebar-provider"),
      sidebar: this.#host.querySelector("ds-sidebar"),
      content: this.#host.querySelector("ds-sidebar-content"),
      switcher: this.#host.querySelector("ds-workspace-switcher"),
      navUser: this.#host.querySelector("ds-nav-user"),
      main: this.#host.querySelector(".app-shell__main"),
      resize: this.#host.querySelector(".app-shell__resize"),
      bubble: this.#host.querySelector(".app-shell__resize-bubble"),
      logoutBtn: this.#host.querySelector(".app-shell__logout"),
    };

    this.#applySidebarChrome();
    this.#bindProviderState();
    this.#bindSidebarChange();
    this.#bindResizeHandle();
    this.#bindHeader();
    this.#bindSwitcher();
    this.#bindNavUser();
    this.#buildMenu();

    this.#routerHandle = setupRouter(this.#els.main);
    this.#teardown.push(
      subscribe((path) => this.#syncActive(path)),
    );

    await Promise.all([this.#loadWorkspaces(), this.#loadProfile()]);
  }

  destroy() {
    for (const off of this.#teardown) off();
    this.#teardown = [];
    this.#routerHandle?.destroy();
    this.#routerHandle = null;
    this.#host.replaceChildren();
  }

  /* ── 侧栏外观（折叠模式/变体 → 组件属性 + 网格列同步） ── */

  #applySidebarChrome() {
    this.#els.sidebar.setAttribute("collapsible", getSidebarCollapsible());
    this.#els.sidebar.setAttribute("variant", getSidebarVariant());
  }

  #bindSidebarChange() {
    const handler = () => {
      applySidebarChrome();
      this.#applySidebarChrome();
      this.#syncGridWidth(this.#els.provider.store.get());
    };
    document.addEventListener("sidebar-change", handler);
    this.#teardown.push(() =>
      document.removeEventListener("sidebar-change", handler)
    );
  }

  /** provider store → 网格列宽 --sidebar-current-width（Layout.md §1）。 */
  #bindProviderState() {
    const { provider } = this.#els;
    this.#syncGridWidth(provider.store.get());
    this.#teardown.push(
      provider.store.subscribe((s) => this.#syncGridWidth(s)),
    );
  }

  #syncGridWidth(s = {}) {
    const collapsed = (s.state ?? "expanded") === "collapsed";
    const collapsible = this.#els.sidebar.getAttribute("collapsible") ?? "icon";
    let width = "var(--sidebar-width)";
    if (collapsed && collapsible === "icon") {
      width = "var(--sidebar-width-icon)";
    } else if (collapsed && collapsible === "offcanvas") width = "0px";
    this.#els.provider.style.setProperty("--sidebar-current-width", width);
  }

  /* ── 拖拽调宽（Layout.md §1.1） ── */

  #bindResizeHandle() {
    const { provider, sidebar, resize, bubble } = this.#els;
    let dragging = false;
    let startX = 0;
    let startW = 0;
    let pendingW = 0;
    let raf = 0;

    const apply = (w) => {
      // 同帧双写：面板令牌（元素内联优先于继承）+ 网格列
      document.documentElement.style.setProperty("--sidebar-width", `${w}px`);
      provider.style.setProperty("--sidebar-current-width", `${w}px`);
      bubble.textContent = `${Math.round(w)}px`;
    };

    resize.addEventListener("pointerdown", (e) => {
      const s = provider.store.get();
      if (s.isMobile || s.state === "collapsed") return;
      dragging = true;
      startX = e.clientX;
      startW = sidebar.getBoundingClientRect().width;
      pendingW = startW;
      resize.setPointerCapture(e.pointerId);
      document.body.classList.add("sidebar-resizing");
      bubble.hidden = false;
      apply(startW);
    });

    resize.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const delta = e.clientX - startX;
      pendingW = Math.min(
        SIDEBAR_WIDTH_LIMITS.max,
        Math.max(SIDEBAR_WIDTH_LIMITS.min, startW + delta),
      );
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          apply(pendingW);
        });
      }
    });

    const finish = () => {
      if (!dragging) return;
      dragging = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      document.body.classList.remove("sidebar-resizing");
      bubble.hidden = true;
      if (pendingW < SIDEBAR_WIDTH_LIMITS.min + 24) {
        // 吸附折叠：先清拖拽内联变量（恢复持久化令牌），再收起
        document.documentElement.style.removeProperty("--sidebar-width");
        provider.style.removeProperty("--sidebar-current-width");
        applySidebarChrome();
        provider.setOpen(false);
      } else {
        setSidebarWidth(pendingW); // 持久化 + 重写令牌（广播 sidebar-change）
        this.#syncGridWidth(provider.store.get());
      }
    };
    resize.addEventListener("pointerup", finish);
    resize.addEventListener("pointercancel", finish);
  }

  /* ── Header ── */

  #bindHeader() {
    this.#els.logoutBtn.addEventListener("click", () => this.#doLogout());
  }

  async #doLogout() {
    await logout(); // auth:changed{token:null} → main.js 拆壳回登录页
  }

  /* ── 工作空间 ── */

  async #loadWorkspaces() {
    const items = await listWorkspaces();
    if (!items.length) return;
    const { switcher } = this.#els;
    switcher.items = items;
    const saved = getCurrentWorkspaceId();
    switcher.currentId = items.some((w) => w.id === saved)
      ? saved
      : items[0].id;
    setCurrentWorkspaceId(switcher.currentId);
  }

  #bindSwitcher() {
    const { switcher } = this.#els;
    switcher.addEventListener(
      "workspace-switcher-select",
      (e) => setCurrentWorkspaceId(e.detail.workspaceId),
    );
    // 切换工作空间 → 当前模块重挂（Workspace.md §4 切换时序）
    this.#teardown.push(
      on("workspace:changed", () => reload()),
    );
    switcher.addEventListener("workspace-switcher-create", async (e) => {
      const res = await apiFetch("/api/workspaces", {
        method: "POST",
        body: e.detail,
      });
      if (res.ok) {
        toast.success(t("workspace.created", "工作空间已创建"));
        await this.#loadWorkspaces();
      } else {
        toast.error(t("workspace.createFailed", "创建失败，请稍后再试"));
      }
    });
  }

  /* ── 用户资料（Components.md §5：壳层拉取并掩码后下发） ── */

  async #loadProfile() {
    const res = await apiFetch("/api/settings/account");
    if (!res.ok || !res.data) return;
    const { navUser } = this.#els;
    if (res.data.name) navUser.name = String(res.data.name);
    if (res.data.email) navUser.email = maskValue(res.data.email, "email");
  }

  #bindNavUser() {
    const { navUser } = this.#els;
    navUser.addEventListener("nav-user-navigate", (e) => {
      navigateTo(e.detail.href);
    });
    navUser.addEventListener("nav-user-logout", () => this.#doLogout());
  }

  /* ── 侧栏菜单（registry 驱动，ARCHITECTURE §4.2） ── */

  #buildMenu() {
    const content = this.#els.content;
    if (!MODULE_REGISTRY.length) return;
    const group = el("ds-sidebar-group");
    const label = el("ds-sidebar-group-label");
    label.textContent = t("shell.mainMenu", "主菜单");
    const menu = el("ds-sidebar-menu");

    for (const mod of MODULE_REGISTRY) {
      const item = el("ds-sidebar-menu-item");
      if (mod.submodules?.length) {
        item.append(this.#buildParentButton(mod));
        item.append(this.#buildSubMenu(mod));
      } else {
        item.append(this.#buildLeafButton(mod.route, mod.icon, mod.labelKey));
      }
      menu.append(item);
    }
    group.append(label, menu);
    content.append(group);
  }

  /** 有子模块的父级：chevron 按钮 + 折叠的子菜单列表。 */
  #buildParentButton(mod) {
    const btn = this.#buildLeafButton(mod.route, mod.icon, mod.labelKey, {
      chevron: true,
    });
    btn.addEventListener("click", () => {
      const collapsible = this.#els.content.querySelector(
        `[data-module="${mod.id}"]`,
      );
      if (!collapsible) return;
      collapsible.open = !collapsible.open;
      btn.dataset.chevronOpen = String(collapsible.open);
    });
    return btn;
  }

  #buildSubMenu(mod) {
    const collapsible = el("ds-collapsible", { class: "app-shell__submenu" });
    collapsible.setAttribute("data-module", mod.id);
    collapsible.setAttribute("default-open", "");
    const sub = el("ds-sidebar-menu-sub");
    for (const s of mod.submodules) {
      const subItem = el("ds-sidebar-menu-sub-item");
      const btn = el("ds-sidebar-menu-button", { size: "sm" });
      btn.setAttribute("title", t(s.labelKey, s.id));
      const text = document.createElement("span");
      text.textContent = t(s.labelKey, s.id);
      btn.append(text);
      btn.addEventListener("click", () => navigateTo(s.route));
      this.#menuButtons.push({ route: s.route, el: btn });
      subItem.append(btn);
      sub.append(subItem);
    }
    collapsible.append(sub);
    return collapsible;
  }

  /**
   * @param {string} route
   * @param {string} icon
   * @param {string} labelKey
   * @param {{ chevron?: boolean }} [options]
   */
  #buildLeafButton(route, icon, labelKey, options = {}) {
    const btn = el("ds-sidebar-menu-button", {
      title: t(labelKey, labelKey),
    });
    if (options.chevron) btn.setAttribute("chevron", "");
    if (icon) btn.append(createIcon(icon));
    const text = document.createElement("span");
    text.textContent = t(labelKey, labelKey);
    btn.append(text);
    if (!options.chevron) {
      btn.addEventListener("click", () => navigateTo(route));
    }
    this.#menuButtons.push({ route, el: btn });
    return btn;
  }

  /** 当前路由高亮（精确 + 子路径，ARCHITECTURE §5.2）。 */
  #syncActive(path) {
    for (const { route, el: btn } of this.#menuButtons) {
      const active = path === route || path.startsWith(`${route}/`);
      btn.toggleAttribute("is-active", active);
    }
  }
}

/** @param {string} path */
function navigateTo(path) {
  if (path !== currentPath()) navigate(path);
}
