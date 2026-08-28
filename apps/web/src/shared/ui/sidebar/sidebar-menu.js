// apps/web/src/shared/ui/sidebar/sidebar-menu.js
// <ds-sidebar-menu> / <ds-sidebar-menu-item> / <ds-sidebar-menu-button>
// / <ds-sidebar-menu-sub> / <ds-sidebar-menu-sub-item>
//
// 一级菜单项：isActive 高亮当前路由；收起态自动显示 tooltip（内容取 title）。
// 图标 + 标签；收起态只显示图标（CSS 隐藏标签）。点击 → ds-sidebar-menu-select
// 事件（detail: { route }），由壳层路由接手。

import { attachStyles, define } from "../base.js";
import { iconSvg } from "../../lib/icons.js";

const MENU_CSS = `
:host{display:flex;flex-direction:column;gap:.125rem;padding:.25rem}
`;

class DsSidebarMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, MENU_CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = "<slot></slot>";
  }
}
define("ds-sidebar-menu", DsSidebarMenu);

const ITEM_CSS = `
:host{display:block;position:relative}
button{display:flex;align-items:center;gap:.6rem;width:100%;
  padding:var(--ds-sidebar-menu-item-padding-y) var(--ds-menu-item-padding-x);
  border-radius:var(--ds-sidebar-menu-item-radius);color:var(--color-sidebar-fg);
  cursor:pointer;text-align:left;background:transparent;line-height:1.3}
button:hover{background:var(--color-sidebar-accent);color:var(--color-sidebar-accent-fg)}
button[data-active="true"]{background:var(--color-sidebar-accent);
  color:var(--color-sidebar-accent-fg);font-weight:600}
button:focus-visible{outline:2px solid var(--color-sidebar-ring);outline-offset:-2px}
.icon{display:inline-flex;flex:none;color:var(--color-sidebar-fg)}
button:hover .icon,button[data-active="true"] .icon{color:var(--color-sidebar-accent-fg)}
.label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 收起态：隐藏标签，图标居中（icon 条形态） */
:host-context(ds-sidebar[data-collapsible="icon"][data-state="collapsed"]) .label{display:none}
:host-context(ds-sidebar[data-collapsible="icon"][data-state="collapsed"]) button{
  justify-content:center;padding:var(--ds-sidebar-menu-item-padding-y) 0}
/* 收起态 tooltip：由 JS 置 data-tooltip-shown 强制显示 */
.tip{position:absolute;left:calc(100% + .5rem);top:50%;transform:translateY(-50%);
  padding:.25rem .5rem;border-radius:var(--ds-tooltip-radius);
  background:var(--ds-tooltip-bg);color:var(--ds-tooltip-fg);font-size:.75rem;
  white-space:nowrap;pointer-events:none;opacity:0;z-index:var(--z-tooltip)}
button[data-tooltip-shown="true"] ~ .tip{opacity:1}
`;

class DsSidebarMenuItem extends HTMLElement {
  static observedAttributes = [
    "icon",
    "label",
    "title",
    "route",
    "isactive",
    "data-tooltip-shown",
  ];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, ITEM_CSS);
    this._hover = false;
    this._focus = false;
  }
  connectedCallback() {
    this._render();
    this.addEventListener("mouseenter", () => this._updateTooltip(true));
    this.addEventListener("mouseleave", () => this._updateTooltip(false));
    this.addEventListener("focusin", () => this._updateTooltip(true));
    this.addEventListener("focusout", () => this._updateTooltip(false));
    this.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("ds-sidebar-menu-select", {
          bubbles: true,
          composed: true,
          detail: { route: this.getAttribute("route"), item: this },
        }),
      );
    });
    // 订阅 provider：收起态变化时刷新 tooltip 判定
    const provider = this.closest("ds-sidebar-provider");
    if (provider?.store) {
      this._unsub = provider.store.subscribe(() =>
        this._updateTooltip(this._hover || this._focus)
      );
    }
  }
  disconnectedCallback() {
    this._unsub?.();
  }
  attributeChangedCallback() {
    if (this._btn) this._render();
  }
  _isCollapsed() {
    const sidebar = this.closest("ds-sidebar");
    return sidebar?.dataset.collapsible === "icon" &&
      sidebar?.dataset.state === "collapsed";
  }
  _updateTooltip(active) {
    this._hover = active;
    this._btn?.setAttribute(
      "data-tooltip-shown",
      String(active && this._isCollapsed()),
    );
  }
  _render() {
    const icon = this.getAttribute("icon");
    const label = this.getAttribute("label") ?? "";
    const title = this.getAttribute("title") ?? label;
    const active = this.getAttribute("isactive") === "true";
    this.setAttribute("role", "menuitem");
    this.shadowRoot.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-active", String(active));
    btn.setAttribute("aria-current", active ? "page" : "false");
    if (title) btn.title = title;
    if (icon) {
      const ic = document.createElement("span");
      ic.className = "icon";
      ic.innerHTML = iconSvg(icon, 16);
      btn.append(ic);
    }
    const labelEl = document.createElement("span");
    labelEl.className = "label";
    labelEl.textContent = label;
    btn.append(labelEl);
    this.shadowRoot.append(btn);
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.textContent = title;
    this.shadowRoot.append(tip);
    this._btn = btn;
  }
}
define("ds-sidebar-menu-item", DsSidebarMenuItem);

// 兼容别名：<ds-sidebar-menu-button> = <ds-sidebar-menu-item>（shadcn 组合树命名）
class DsSidebarMenuButton extends DsSidebarMenuItem {}
define("ds-sidebar-menu-button", DsSidebarMenuButton);

const SUB_CSS = `
:host{display:block}
.sub{display:flex;flex-direction:column;gap:.125rem;padding-left:1.2rem}
`;

class DsSidebarMenuSub extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, SUB_CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = '<div class="sub"><slot></slot></div>';
  }
}
define("ds-sidebar-menu-sub", DsSidebarMenuSub);

const SUB_ITEM_CSS = `
:host{display:block}
button{display:flex;align-items:center;gap:.5rem;width:100%;
  padding:.35rem var(--ds-menu-item-padding-x);border-radius:var(--ds-sidebar-menu-item-radius);
  color:var(--color-sidebar-fg);cursor:pointer;text-align:left;background:transparent;
  font-size:.85rem}
button:hover{background:var(--color-sidebar-accent);color:var(--color-sidebar-accent-fg)}
button[data-active="true"]{background:var(--color-sidebar-accent);
  color:var(--color-sidebar-accent-fg);font-weight:600}
button:focus-visible{outline:2px solid var(--color-sidebar-ring);outline-offset:-2px}
.dot{width:.35rem;height:.35rem;border-radius:50%;background:currentColor;flex:none;opacity:.6}
.label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;

class DsSidebarMenuSubItem extends HTMLElement {
  static observedAttributes = ["label", "route", "isactive"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, SUB_ITEM_CSS);
  }
  connectedCallback() {
    this._render();
    this.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("ds-sidebar-menu-select", {
          bubbles: true,
          composed: true,
          detail: { route: this.getAttribute("route"), item: this },
        }),
      );
    });
  }
  attributeChangedCallback() {
    if (this._btn) this._render();
  }
  _render() {
    const label = this.getAttribute("label") ?? "";
    const active = this.getAttribute("isactive") === "true";
    this.shadowRoot.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-active", String(active));
    btn.setAttribute("aria-current", active ? "page" : "false");
    const dot = document.createElement("span");
    dot.className = "dot";
    const labelEl = document.createElement("span");
    labelEl.className = "label";
    labelEl.textContent = label;
    btn.append(dot, labelEl);
    this.shadowRoot.append(btn);
    this._btn = btn;
  }
}
define("ds-sidebar-menu-sub-item", DsSidebarMenuSubItem);
