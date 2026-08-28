import { eventBus } from "../../shared/core/event-bus.js";
import { moduleRegistry } from "../../shared/core/module-registry.js";
import { initSidebarResize } from "./resize-handle.js";
import { t } from "../../shared/lib/i18n.js";
import "../../shared/ui/sidebar/sidebar.js";
import "../../shared/ui/breadcrumb/breadcrumb.js";
import "../../shared/ui/theme-switch/theme-switch.js";
import "../../shared/ui/lang-switch/lang-switch.js";
import "../../shared/ui/appearance-sheet/appearance-sheet.js";
import "../../shared/ui/workspace-switcher/workspace-switcher.js";
import "../../shared/ui/nav-user/nav-user.js";

const BASE_UI_COMPONENTS = [
  { id: "calendar", name: "Calendar", icon: "calendar" },
  { id: "button", name: "Button", icon: "square" },
  { id: "dialog", name: "Dialog", icon: "square" },
  { id: "card", name: "Card", icon: "credit-card" },
  { id: "table", name: "Table", icon: "table" },
  { id: "tabs", name: "Tabs", icon: "folder" },
  { id: "input", name: "Input", icon: "edit-3" },
  { id: "select", name: "Select", icon: "chevron-down" },
  { id: "checkbox", name: "Checkbox", icon: "check-square" },
  { id: "switch", name: "Switch", icon: "toggle-left" },
  { id: "radio-group", name: "Radio Group", icon: "circle" },
  { id: "slider", name: "Slider", icon: "sliders" },
  { id: "sheet", name: "Sheet", icon: "sidebar" },
  { id: "drawer", name: "Drawer", icon: "arrow-up" },
  { id: "toast", name: "Toast", icon: "bell" },
  { id: "badge", name: "Badge", icon: "tag" },
  { id: "avatar", name: "Avatar", icon: "user" },
  { id: "accordion", name: "Accordion", icon: "chevron-down" },
  { id: "collapsible", name: "Collapsible", icon: "maximize-2" },
  { id: "popover", name: "Popover", icon: "layers" },
  { id: "tooltip", name: "Tooltip", icon: "info" },
  { id: "dropdown-menu", name: "Dropdown Menu", icon: "more-vertical" },
  { id: "breadcrumb", name: "Breadcrumb", icon: "navigation" },
  { id: "pagination", name: "Pagination", icon: "chevrons-right" },
  { id: "progress", name: "Progress", icon: "trending-up" },
  { id: "skeleton", name: "Skeleton", icon: "loader" },
  { id: "empty", name: "Empty", icon: "inbox" },
  { id: "carousel", name: "Carousel", icon: "play" },
  { id: "chart", name: "Chart", icon: "bar-chart-2" },
  { id: "aspect-ratio", name: "Aspect Ratio", icon: "maximize" },
  { id: "typography", name: "Typography", icon: "type" },
];

export class AppShell extends HTMLElement {
  constructor() {
    super();
    this.unsubscribeNav = null;
    this.unsubscribeWorkspace = null;
    this.unsubscribeLocale = null;
    this.cleanupResize = null;
    this.docsOpen = true;
    this.componentsOpen = true;
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
    this.cleanupResize = initSidebarResize(this);
  }

  disconnectedCallback() {
    if (this.unsubscribeNav) this.unsubscribeNav();
    if (this.unsubscribeWorkspace) this.unsubscribeWorkspace();
    if (this.unsubscribeLocale) this.unsubscribeLocale();
    if (this.cleanupResize) this.cleanupResize();
  }

  setupListeners() {
    this.unsubscribeNav = eventBus.on("router:navigated", (e) => {
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
      const groupLabel = this.querySelector("#main-menu-label");
      if (groupLabel) groupLabel.textContent = t("sidebar.mainMenu");
      const activeBtn = this.querySelector("ds-sidebar-menu-button[data-module-id]");
      const activeId = activeBtn?.getAttribute("data-module-id");
      if (activeId) {
        this.updateActiveNav(activeId, { title: t(`modules.${activeId}`) });
      }
    });
  }

  updateActiveNav(moduleId, meta) {
    this.querySelectorAll("ds-sidebar-menu-button").forEach((btn) => {
      const id = btn.getAttribute("data-module-id");
      btn.isActive = id === moduleId;
    });

    this.querySelectorAll("[data-slot='sidebar-menu-sub-item'] a").forEach((link) => {
      const id = link.getAttribute("data-module-id");
      const active = id === moduleId;
      link.classList.toggle("active", active);
      if (active) {
        if (id === "notes" || id === "passwords") {
          this.docsOpen = true;
          const subList = this.querySelector("#docs-sub-menu");
          const toggleBtn = this.querySelector("#btn-docs-toggle");
          if (subList) subList.removeAttribute("hidden");
          if (toggleBtn) toggleBtn.setAttribute("data-open", "true");
        }
      }
    });

    const hash = globalThis.location?.hash || "";
    if (hash.startsWith("#/components")) {
      const match = hash.match(/[?&]c=([a-z0-9-]+)/);
      const activeCompId = match ? match[1] : "calendar";
      this.querySelectorAll(".comp-sub-link").forEach((link) => {
        const cid = link.getAttribute("data-comp-id");
        link.classList.toggle("active", cid === activeCompId);
      });
    }

    const breadcrumb = this.querySelector("ds-breadcrumb");
    if (breadcrumb && meta) {
      breadcrumb.items = [
        { label: "Vanilla Workbench" },
        { label: t(`modules.${moduleId}`) || meta.title || moduleId },
      ];
    }
  }

  renderSidebarItems() {
    const menuContainer = this.querySelector("#sidebar-menu");
    if (!menuContainer) return;

    const modules = moduleRegistry.getModules();
    const topModules = modules.filter((m) =>
      m.id !== "notes" && m.id !== "passwords" && m.id !== "components"
    );
    const subModules = modules.filter((m) => m.id === "notes" || m.id === "passwords");

    const topItemsHtml = topModules.map((m) => {
      const title = t(`modules.${m.id}`) || m.title || m.id;
      return `
        <ds-sidebar-menu-item>
          <ds-sidebar-menu-button icon="${
        m.icon || "folder"
      }" data-module-id="${m.id}" tooltip="${title}">
            ${title}
          </ds-sidebar-menu-button>
        </ds-sidebar-menu-item>
      `;
    }).join("");

    const subListHtml = subModules.map((m) => {
      const title = t(`modules.${m.id}`) || m.title || m.id;
      return `
        <li data-slot="sidebar-menu-sub-item">
          <a href="#/${m.id}" data-module-id="${m.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><use href="/icons.svg#${
        m.icon || "file-text"
      }"></use></svg>
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</span>
          </a>
        </li>
      `;
    }).join("");

    const docsTitle = t("sidebar.docs");
    const docsToggleHtml = `
      <li data-slot="sidebar-menu-item" class="relative" style="list-style: none;">
        <button type="button" class="menu-toggle-btn" id="btn-docs-toggle" data-open="${
      this.docsOpen ? "true" : "false"
    }" title="${docsTitle}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><use href="/icons.svg#book-open"></use></svg>
          <span class="menu-label" style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${docsTitle}</span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
        </button>
        <ul data-slot="sidebar-menu-sub" id="docs-sub-menu" ${!this.docsOpen ? "hidden" : ""}>
          ${subListHtml}
        </ul>
      </li>
    `;

    const compTitle = t("sidebar.components") || "组件库";
    const compListHtml = BASE_UI_COMPONENTS.map((c) => `
      <li data-slot="sidebar-menu-sub-item">
        <a href="#/components?c=${c.id}" class="comp-sub-link" data-comp-id="${c.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><use href="/icons.svg#${c.icon}"></use></svg>
          <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}</span>
        </a>
      </li>
    `).join("");

    const compToggleHtml = `
      <li data-slot="sidebar-menu-item" class="relative" style="list-style: none;">
        <button type="button" class="menu-toggle-btn" id="btn-comps-toggle" data-open="${
      this.componentsOpen ? "true" : "false"
    }" title="${compTitle}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><use href="/icons.svg#component"></use></svg>
          <span class="menu-label" style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${compTitle}</span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
        </button>
        <ul data-slot="sidebar-menu-sub" id="comps-sub-menu" style="max-height: 18rem; overflow-y: auto;" ${
      !this.componentsOpen ? "hidden" : ""
    }>
          ${compListHtml}
        </ul>
      </li>
    `;

    menuContainer.innerHTML = topItemsHtml + docsToggleHtml + compToggleHtml;

    menuContainer.querySelectorAll("ds-sidebar-menu-button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-module-id");
        eventBus.emit("router:navigate", { path: `/${id}` });
      });
    });

    menuContainer.querySelectorAll("[data-slot='sidebar-menu-sub-item'] a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const href = a.getAttribute("href");
        if (href.startsWith("#")) {
          const path = href.replace(/^#/, "");
          eventBus.emit("router:navigate", { path });
        }
      });
    });

    menuContainer.querySelector("#btn-docs-toggle")?.addEventListener("click", () => {
      this.docsOpen = !this.docsOpen;
      const subList = menuContainer.querySelector("#docs-sub-menu");
      const btn = menuContainer.querySelector("#btn-docs-toggle");
      if (this.docsOpen) {
        subList?.removeAttribute("hidden");
        btn?.setAttribute("data-open", "true");
      } else {
        subList?.setAttribute("hidden", "");
        btn?.setAttribute("data-open", "false");
      }
    });

    menuContainer.querySelector("#btn-comps-toggle")?.addEventListener("click", () => {
      this.componentsOpen = !this.componentsOpen;
      const subList = menuContainer.querySelector("#comps-sub-menu");
      const btn = menuContainer.querySelector("#btn-comps-toggle");
      if (this.componentsOpen) {
        subList?.removeAttribute("hidden");
        btn?.setAttribute("data-open", "true");
      } else {
        subList?.setAttribute("hidden", "");
        btn?.setAttribute("data-open", "false");
      }
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
              <ds-sidebar-group-label id="main-menu-label">${
      t("sidebar.mainMenu")
    }</ds-sidebar-group-label>
              <ds-sidebar-menu id="sidebar-menu"></ds-sidebar-menu>
            </ds-sidebar-group>
          </ds-sidebar-content>

          <ds-sidebar-footer>
            <ds-nav-user></ds-nav-user>
          </ds-sidebar-footer>
          <ds-sidebar-rail></ds-sidebar-rail>
        </ds-sidebar>

        <div class="app-shell__resize" role="separator" aria-orientation="vertical" aria-label="${
      t("sidebar.resize")
    }" title="${t("sidebar.resize")}">
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
              <button type="button" class="header-icon-btn" id="btn-header-logout" title="${
      t("header.logout")
    }" aria-label="${t("header.logout")}">
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
