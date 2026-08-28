import { attachStyles, createIcon } from "../base.js";
import { createStore } from "../../core/store.js";
import { BREAKPOINTS } from "@contracts/constants.js";
import { getSidebarOpen, setSidebarOpen } from "../../lib/appearance.js";
import "../sheet/sheet.js";
import "../tooltip/tooltip.js";

// --- Provider ---
const providerCss = `
:host {
  display: block;
  width: 100%;
  height: 100%;
}
`;

export class DsSidebarProvider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const isMobile = globalThis.window ? globalThis.window.innerWidth < BREAKPOINTS.md : false;
    const initialOpen = getSidebarOpen();

    this.store = createStore({
      open: initialOpen,
      openMobile: false,
      isMobile,
      state: initialOpen ? "expanded" : "collapsed",
    });

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleResize = this._handleResize.bind(this);
  }

  connectedCallback() {
    this.render();
    globalThis.window?.addEventListener("keydown", this._handleKeyDown);
    globalThis.window?.addEventListener("resize", this._handleResize);
  }

  disconnectedCallback() {
    globalThis.window?.removeEventListener("keydown", this._handleKeyDown);
    globalThis.window?.removeEventListener("resize", this._handleResize);
  }

  _handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      this.toggleSidebar();
    }
  }

  _handleResize() {
    if (!globalThis.window) return;
    const isMobile = globalThis.window.innerWidth < BREAKPOINTS.md;
    const current = this.store.getState();
    if (current.isMobile !== isMobile) {
      this.store.setState({ isMobile });
    }
  }

  setOpen(open) {
    const isMobile = this.store.getState().isMobile;
    if (isMobile) {
      this.store.setState({ openMobile: open });
    } else {
      setSidebarOpen(open);
      this.store.setState({
        open,
        state: open ? "expanded" : "collapsed",
      });
    }
  }

  setOpenMobile(openMobile) {
    this.store.setState({ openMobile });
  }

  toggleSidebar() {
    const { isMobile, open, openMobile } = this.store.getState();
    if (isMobile) {
      this.setOpenMobile(!openMobile);
    } else {
      this.setOpen(!open);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, providerCss);
  }
}

// --- Sidebar Main Container ---
const sidebarCss = `
:host {
  display: block;
  height: 100%;
  grid-area: sidebar;
  position: relative;
  width: var(--sidebar-current-width, 16rem);
}
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-sidebar);
  color: var(--color-sidebar-fg);
  border-right: 1px solid var(--color-sidebar-border);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
:host([data-state="collapsed"]) {
  width: var(--sidebar-width-icon, 3rem);
}
:host([data-collapsible="offcanvas"][data-state="collapsed"]) {
  display: none;
}
:host([data-variant="floating"]) .sidebar {
  margin: var(--space-2);
  height: calc(100% - var(--space-4));
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-sidebar-border);
  box-shadow: var(--shadow-sm);
}
`;

export class DsSidebar extends HTMLElement {
  static get observedAttributes() {
    return ["side", "variant", "collapsible"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.unsubscribe = null;
  }

  connectedCallback() {
    this.setAttribute("data-side", this.getAttribute("side") || "left");
    this.setAttribute("data-variant", this.getAttribute("variant") || "sidebar");
    this.setAttribute("data-collapsible", this.getAttribute("collapsible") || "icon");

    const provider = this.closest("ds-sidebar-provider");
    if (provider) {
      this.unsubscribe = provider.store.subscribe((state) => {
        this.setAttribute("data-state", state.state);
        this.renderMobileOrDesktop(state);
      });
      const current = provider.store.getState();
      this.setAttribute("data-state", current.state);
      this.renderMobileOrDesktop(current);
    } else {
      this.render();
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }

  renderMobileOrDesktop(state) {
    if (state.isMobile) {
      this.shadowRoot.innerHTML = `
        <ds-sheet side="left" ${state.openMobile ? "open" : ""}>
          <div class="sidebar" style="width: 100%; border: none;">
            <slot></slot>
          </div>
        </ds-sheet>
      `;
      const sheet = this.shadowRoot.querySelector("ds-sheet");
      sheet.addEventListener("ds-close", () => {
        const provider = this.closest("ds-sidebar-provider");
        if (provider) provider.setOpenMobile(false);
      });
    } else {
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="sidebar">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, sidebarCss);
  }
}

// --- Header, Content, Footer ---
const headerCss = `
:host {
  display: block;
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-sidebar-border);
}
`;
export class DsSidebarHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, headerCss);
  }
}

const contentCss = `
:host {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-2);
  gap: var(--space-2);
}
`;
export class DsSidebarContent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, contentCss);
  }
}

const footerCss = `
:host {
  display: block;
  padding: var(--space-2);
  border-top: 1px solid var(--color-sidebar-border);
}
`;
export class DsSidebarFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, footerCss);
  }
}

// --- Group & Label ---
const groupCss = `
:host {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
`;
export class DsSidebarGroup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, groupCss);
  }
}

const groupLabelCss = `
:host {
  display: flex;
  align-items: center;
  height: 2rem;
  padding-inline: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-muted);
}
:host-context(ds-sidebar[data-state="collapsed"]) {
  display: none;
}
`;
export class DsSidebarGroupLabel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, groupLabelCss);
  }
}

// --- Menu, Item & Button ---
const menuCss = `
:host {
  display: flex;
  flex-direction: column;
  gap: 2px;
  list-style: none;
}
`;
export class DsSidebarMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.setAttribute("role", "menu");
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, menuCss);
  }
}

const menuItemCss = `
:host {
  display: block;
  position: relative;
}
`;
export class DsSidebarMenuItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.setAttribute("role", "none");
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, menuItemCss);
  }
}

const menuButtonCss = `
:host {
  display: block;
  width: 100%;
}
.menu-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: 2rem;
  padding-inline: var(--space-2);
  border-radius: var(--ds-sidebar-item-radius, var(--radius-md));
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
:host([data-active="true"]) .menu-btn {
  background-color: var(--color-sidebar-accent);
  color: var(--color-sidebar-primary, var(--color-primary));
  font-weight: 600;
}
.menu-btn:focus-visible {
  outline: 2px solid var(--color-sidebar-ring);
  outline-offset: 1px;
}
.icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
.label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host-context(ds-sidebar[data-state="collapsed"]) .label {
  display: none;
}
:host-context(ds-sidebar[data-state="collapsed"]) .menu-btn {
  justify-content: center;
  padding-inline: 0;
}
`;

export class DsSidebarMenuButton extends HTMLElement {
  static get observedAttributes() {
    return ["icon", "is-active", "title", "tooltip"];
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

  get isActive() {
    return this.getAttribute("is-active") === "true";
  }
  set isActive(v) {
    this.setAttribute("is-active", v ? "true" : "false");
    this.setAttribute("data-active", v ? "true" : "false");
  }

  render() {
    const icon = this.getAttribute("icon");
    const title = this.getAttribute("tooltip") || this.getAttribute("title") || "";
    const active = this.getAttribute("is-active") === "true";
    this.setAttribute("data-active", active ? "true" : "false");

    this.shadowRoot.innerHTML = `
      <button class="menu-btn" type="button" title="${title}" aria-current="${
      active ? "page" : "false"
    }">
        ${icon ? createIcon(icon) : ""}
        <span class="label"><slot></slot></span>
      </button>
    `;
    attachStyles(this.shadowRoot, menuButtonCss);
  }
}

// --- Submenu ---
const subMenuCss = `
:host {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 0.875rem;
  padding-left: 0.625rem;
  padding-block: 0.125rem;
  border-left: 1px solid var(--color-sidebar-border);
}
:host-context(ds-sidebar[data-state="collapsed"]) {
  display: none !important;
}
`;
export class DsSidebarMenuSub extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<slot></slot>`;
    attachStyles(this.shadowRoot, subMenuCss);
  }
}

const subMenuItemCss = `
:host {
  display: block;
}
.sub-item-btn {
  display: flex;
  align-items: center;
  width: 100%;
  height: 1.75rem;
  padding-inline: var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-sidebar-fg);
  cursor: pointer;
}
.sub-item-btn:hover {
  color: var(--color-sidebar-accent-fg);
  background-color: var(--color-sidebar-accent);
}
:host([data-active="true"]) .sub-item-btn {
  color: var(--color-sidebar-primary, var(--color-primary));
  font-weight: 600;
  background-color: var(--color-sidebar-accent);
}
`;
export class DsSidebarMenuSubItem extends HTMLElement {
  static get observedAttributes() {
    return ["is-active"];
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
    const active = this.getAttribute("is-active") === "true";
    this.setAttribute("data-active", active ? "true" : "false");
    this.shadowRoot.innerHTML = `
      <div class="sub-item-btn">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, subMenuItemCss);
  }
}

// --- Rail & Trigger ---
const railCss = `
:host {
  position: absolute;
  top: 0;
  bottom: 0;
  right: -2px;
  width: 4px;
  cursor: ew-resize;
  background: transparent;
  z-index: 10;
}
:host(:hover) {
  background-color: var(--color-sidebar-ring);
}
`;
export class DsSidebarRail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<div></div>`;
    this.addEventListener("click", () => {
      const provider = this.closest("ds-sidebar-provider");
      if (provider) provider.toggleSidebar();
    });
    attachStyles(this.shadowRoot, railCss);
  }
}

const triggerCss = `
:host { display: inline-flex; }
.trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.trigger-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
`;
export class DsSidebarTrigger extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <button class="trigger-btn" type="button" aria-label="Toggle Sidebar" title="切换侧栏 (Ctrl+B)">
        ${createIcon("panel-left")}
      </button>
    `;
    this.shadowRoot.querySelector("button").addEventListener("click", () => {
      const provider = document.querySelector("ds-sidebar-provider");
      if (provider) provider.toggleSidebar();
    });
    attachStyles(this.shadowRoot, triggerCss);
  }
}

// --- Collapsible ---
const collapsibleCss = `
:host { display: block; }
.collapsible-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
}
.chevron {
  color: var(--color-fg-muted);
  transform: rotate(0deg);
}
:host([data-state="open"]) .chevron {
  transform: rotate(90deg);
}
.collapsible-content[hidden] {
  display: none !important;
}
`;

export class DsCollapsible extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
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

  get open() {
    return this.hasAttribute("open");
  }
  set open(v) {
    if (v) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  toggle() {
    this.open = !this.open;
  }

  render() {
    const isOpen = this.open;
    this.setAttribute("data-state", isOpen ? "open" : "closed");

    this.shadowRoot.innerHTML = `
      <div class="collapsible-container">
        <div class="collapsible-trigger">
          <slot name="trigger"></slot>
          <span class="chevron">${createIcon("chevron-right")}</span>
        </div>
        <div class="collapsible-content" ${!isOpen ? "hidden" : ""}>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".collapsible-trigger").addEventListener("click", () => {
      this.toggle();
    });

    attachStyles(this.shadowRoot, collapsibleCss);
  }
}

// Register all sidebar custom elements
if (!customElements.get("ds-sidebar-provider")) {
  customElements.define("ds-sidebar-provider", DsSidebarProvider);
}
if (!customElements.get("ds-sidebar")) customElements.define("ds-sidebar", DsSidebar);
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
if (!customElements.get("ds-sidebar-menu-button")) {
  customElements.define("ds-sidebar-menu-button", DsSidebarMenuButton);
}
if (!customElements.get("ds-sidebar-menu-sub")) {
  customElements.define("ds-sidebar-menu-sub", DsSidebarMenuSub);
}
if (!customElements.get("ds-sidebar-menu-sub-item")) {
  customElements.define("ds-sidebar-menu-sub-item", DsSidebarMenuSubItem);
}
if (!customElements.get("ds-sidebar-rail")) customElements.define("ds-sidebar-rail", DsSidebarRail);
if (!customElements.get("ds-sidebar-trigger")) {
  customElements.define("ds-sidebar-trigger", DsSidebarTrigger);
}
if (!customElements.get("ds-collapsible")) customElements.define("ds-collapsible", DsCollapsible);
