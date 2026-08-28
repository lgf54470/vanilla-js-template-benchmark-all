import { attachStyles, createIcon } from "../base.js";
import { SIDEBAR_WIDTH_LIMITS } from "@contracts/constants.js";

const css = `
:host {
  display: contents;
}
.sidebar-provider {
  display: flex;
  width: 100%;
  min-height: 100vh;
  position: relative;
  background-color: var(--color-bg);
  color: var(--color-fg);
}
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  z-index: 20;
  width: var(--sidebar-width, 16rem);
  flex-shrink: 0;
  background-color: var(--color-sidebar);
  color: var(--color-sidebar-fg);
  border-right: 1px solid var(--color-sidebar-border);
  box-sizing: border-box;
}
.sidebar-container[data-variant="floating"] {
  border: 1px solid var(--color-sidebar-border);
  border-radius: var(--radius-xl);
  margin: var(--space-2);
  height: calc(100vh - var(--space-4));
  box-shadow: var(--shadow-sm);
}
.sidebar-container[data-variant="inset"] {
  background-color: var(--color-sidebar);
  border-right: none;
}
.sidebar-container[data-state="collapsed"] {
  width: var(--sidebar-width-icon, 3rem);
}
.trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.trigger-btn:hover {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
.menu-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-sidebar-fg);
  cursor: pointer;
  user-select: none;
  border: none;
  background: transparent;
  text-align: left;
  box-sizing: border-box;
}
.menu-btn:hover {
  background-color: var(--color-sidebar-accent);
  color: var(--color-sidebar-accent-fg);
}
.menu-btn--active {
  background-color: var(--color-sidebar-accent);
  color: var(--color-sidebar-accent-fg);
  font-weight: 600;
}
`;

class SidebarStore {
  constructor(initialState = {}) {
    this.state = {
      open: true,
      openMobile: false,
      variant: "sidebar",
      collapsible: "icon",
      width: SIDEBAR_WIDTH_LIMITS.default,
      ...initialState,
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export class DsSidebarProvider extends HTMLElement {
  constructor() {
    super();
    this.store = new SidebarStore();
  }

  connectedCallback() {
    this.classList.add("sidebar-provider");
    this.setAttribute("data-slot", "sidebar-provider");
  }

  setOpen(open) {
    this.store.setState({ open });
    const sidebar = this.querySelector("ds-sidebar");
    if (sidebar) sidebar.setAttribute("data-state", open ? "expanded" : "collapsed");
  }

  toggleSidebar() {
    this.setOpen(!this.store.getState().open);
  }
}

export class DsSidebar extends HTMLElement {
  static get observedAttributes() {
    return ["collapsible", "variant", "side", "data-state"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const variant = this.getAttribute("variant") || "sidebar";
    const state = this.getAttribute("data-state") || "expanded";

    this.shadowRoot.innerHTML = `
      <div data-slot="sidebar" class="sidebar-container" data-variant="${variant}" data-state="${state}">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

export class DsSidebarTrigger extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <button data-slot="sidebar-trigger" class="trigger-btn" type="button" aria-label="切换侧栏">
        ${createIcon("panel-left")}
      </button>
    `;
    this.shadowRoot.querySelector("button")?.addEventListener("click", () => {
      const provider = this.closest("ds-sidebar-provider");
      if (provider && typeof provider.toggleSidebar === "function") {
        provider.toggleSidebar();
      }
    });
    attachStyles(this.shadowRoot, css);
  }
}

export class DsSidebarMenuButton extends HTMLElement {
  static get observedAttributes() {
    return ["icon", "tooltip", "is-active", "data-module-id"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get isActive() {
    return this.hasAttribute("is-active");
  }

  set isActive(val) {
    if (val) this.setAttribute("is-active", "");
    else this.removeAttribute("is-active");
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const icon = this.getAttribute("icon");
    const tooltip = this.getAttribute("tooltip") || "";
    const active = this.isActive;

    this.shadowRoot.innerHTML = `
      <button data-slot="sidebar-menu-button" type="button" class="menu-btn ${
      active ? "menu-btn--active" : ""
    }" title="${tooltip}">
        ${icon ? createIcon(icon) : ""}
        <span class="label" style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><slot></slot></span>
      </button>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

export class DsSidebarHeader extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-header");
  }
}
export class DsSidebarContent extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-content");
  }
}
export class DsSidebarFooter extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-footer");
  }
}
export class DsSidebarGroup extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-group");
  }
}
export class DsSidebarGroupLabel extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-group-label");
  }
}
export class DsSidebarMenu extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-menu");
  }
}
export class DsSidebarMenuItem extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-menu-item");
  }
}
export class DsSidebarRail extends HTMLElement {
  connectedCallback() {
    this.setAttribute("data-slot", "sidebar-rail");
  }
}

if (!customElements.get("ds-sidebar-provider")) {
  customElements.define("ds-sidebar-provider", DsSidebarProvider);
}
if (!customElements.get("ds-sidebar")) customElements.define("ds-sidebar", DsSidebar);
if (!customElements.get("ds-sidebar-trigger")) {
  customElements.define("ds-sidebar-trigger", DsSidebarTrigger);
}
if (!customElements.get("ds-sidebar-menu-button")) {
  customElements.define("ds-sidebar-menu-button", DsSidebarMenuButton);
}
if (!customElements.get("ds-sidebar-header")) {
  customElements.define("ds-sidebar-header", DsSidebarHeader);
}
if (!customElements.get("ds-sidebar-content")) {
  customElements.define("ds-sidebar-content", DsSidebarContent);
}
if (!customElements.get("ds-sidebar-footer")) {
  customElements.define("ds-sidebar-footer", DsSidebarFooter);
}
if (!customElements.get("ds-sidebar-group")) {
  customElements.define("ds-sidebar-group", DsSidebarGroup);
}
if (!customElements.get("ds-sidebar-group-label")) {
  customElements.define("ds-sidebar-group-label", DsSidebarGroupLabel);
}
if (!customElements.get("ds-sidebar-menu")) customElements.define("ds-sidebar-menu", DsSidebarMenu);
if (!customElements.get("ds-sidebar-menu-item")) {
  customElements.define("ds-sidebar-menu-item", DsSidebarMenuItem);
}
if (!customElements.get("ds-sidebar-rail")) customElements.define("ds-sidebar-rail", DsSidebarRail);
