import { moduleRegistry } from "../../shared/core/module-registry.js";
import { eventBus } from "../../shared/core/event-bus.js";
import { initResizeHandle } from "./resize-handle.js";
import "../../shared/ui/index.js";

export class AppShell extends HTMLElement {
  constructor() {
    super();
    this.unsubscribeRouter = null;
    this.unsubscribeLocale = null;
    this.unsubscribeWorkspace = null;
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
    const handle = this.querySelector(".app-shell__resize");
    if (handle) initResizeHandle(handle);
  }

  disconnectedCallback() {
    if (this.unsubscribeRouter) this.unsubscribeRouter();
    if (this.unsubscribeLocale) this.unsubscribeLocale();
    if (this.unsubscribeWorkspace) this.unsubscribeWorkspace();
  }

  setupListeners() {
    this.unsubscribeRouter = eventBus.on("router:navigated", (e) => {
      this.updateActiveNav(e.detail.moduleId, e.detail.meta);
    });

    this.unsubscribeWorkspace = eventBus.on("workspace:changed", () => {
      const hash = globalThis.window?.location.hash;
      if (hash) {
        eventBus.emit("router:navigate", { path: hash.replace(/^#/, "") });
      }
    });

    this.unsubscribeLocale = eventBus.on("locale:changed", () => {
      this.renderSidebarItems();
    });
  }

  updateActiveNav(moduleId, meta) {
    this.querySelectorAll("ds-sidebar-menu-button").forEach((btn) => {
      const id = btn.getAttribute("data-module-id");
      btn.isActive = id === moduleId;
    });

    const breadcrumb = this.querySelector("ds-breadcrumb");
    if (breadcrumb && meta) {
      breadcrumb.items = [
        { label: "Vanilla Workbench" },
        { label: meta.title || moduleId },
      ];
    }
  }

  renderSidebarItems() {
    const menuContainer = this.querySelector("#sidebar-menu");
    if (!menuContainer) return;

    const modules = moduleRegistry.getModules();
    menuContainer.innerHTML = modules.map((m) => `
      <ds-sidebar-menu-item>
        <ds-sidebar-menu-button icon="${m.icon || "folder"}" data-module-id="${m.id}" tooltip="${
      m.title || m.id
    }">
          ${m.title || m.id}
        </ds-sidebar-menu-button>
      </ds-sidebar-menu-item>
    `).join("");

    menuContainer.querySelectorAll("ds-sidebar-menu-button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-module-id");
        eventBus.emit("router:navigate", { path: `/${id}` });
      });
    });
  }

  render() {
    this.innerHTML = `
      <ds-sidebar-provider class="app-shell">
        <ds-sidebar collapsible="icon" side="left" variant="sidebar">
          <ds-sidebar-header>
            <ds-workspace-switcher></ds-workspace-switcher>
          </ds-sidebar-header>

          <ds-sidebar-content>
            <ds-sidebar-group>
              <ds-sidebar-group-label>主菜单</ds-sidebar-group-label>
              <ds-sidebar-menu id="sidebar-menu"></ds-sidebar-menu>
            </ds-sidebar-group>
          </ds-sidebar-content>

          <ds-sidebar-footer>
            <ds-nav-user></ds-nav-user>
          </ds-sidebar-footer>
          <ds-sidebar-rail></ds-sidebar-rail>
        </ds-sidebar>

        <div class="app-shell__resize" role="separator" aria-orientation="vertical" aria-label="调整侧栏宽度" title="拖拽调整侧栏宽度，双击重置">
          <span class="handle-pill"></span>
        </div>

        <div class="app-shell__inset">
          <header class="app-shell__header">
            <div class="header-left">
              <ds-sidebar-trigger></ds-sidebar-trigger>
              <div class="header-divider"></div>
              <ds-breadcrumb></ds-breadcrumb>
            </div>
            <div class="header-right">
              <ds-lang-switch></ds-lang-switch>
              <ds-theme-switch></ds-theme-switch>
              <ds-appearance-sheet></ds-appearance-sheet>
              <button type="button" class="header-icon-btn" id="btn-header-logout" title="退出登录" aria-label="退出登录">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#log-out"></use></svg>
              </button>
            </div>
          </header>

          <main class="app-shell__main" id="main-content"></main>
        </div>
      </ds-sidebar-provider>
    `;

    this.querySelector("#btn-header-logout")?.addEventListener("click", async () => {
      const token = localStorage.getItem("auth:token") || "";
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-auth-password": token },
      }).catch(() => {});
      localStorage.removeItem("auth:token");
      sessionStorage.removeItem("auth:token");
      eventBus.emit("auth:unauthorized");
      globalThis.window?.location.reload();
    });

    this.renderSidebarItems();
  }
}

if (!customElements.get("app-shell")) {
  customElements.define("app-shell", AppShell);
}
