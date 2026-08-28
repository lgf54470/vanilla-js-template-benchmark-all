// apps/web/src/shared/ui/dropdown-menu/dropdown-menu.js
// <ds-dropdown-menu> / <ds-menu-item>
//
// 用法：
//   <ds-dropdown-menu>
//     <button slot="trigger">...</button>
//     <div slot="content">
//       <ds-menu-item label="设置" icon="settings" value="/settings"></ds-menu-item>
//       <div class="separator"></div>
//       <ds-menu-item label="退出登录" icon="log-out" danger value="logout"></ds-menu-item>
//     </div>
//   </ds-dropdown-menu>
//
// 交互：点击开/再点收/外点收（document 级 composedPath，CSS.md §9）、Esc 收。
// 触发器自动加 aria-haspopup + aria-expanded（Components.md §9）。
// 分隔线在 content 槽内是顶层元素，::slotted(.separator) 可命中
// （docs/bug/2026-08-28-slotted-only-matches-top-level.md 的教训：不要包一层 wrapper）。

import { attachStyles, define } from "../base.js";
import { isOutsideClick } from "../../lib/dom.js";

const MENU_CSS = `
:host{display:inline-flex;position:relative}
.wrap{position:relative;display:inline-flex}
.panel{position:absolute;top:calc(100% + .3rem);right:0;min-width:13rem;
  display:flex;flex-direction:column;gap:.125rem;padding:var(--ds-menu-padding);
  border-radius:var(--ds-menu-radius);background:var(--ds-panel-bg);
  color:var(--ds-panel-fg);box-shadow:var(--ds-panel-shadow);
  border:1px solid var(--color-border);z-index:var(--z-popover);
  pointer-events:none;opacity:0}
.panel[data-open]{pointer-events:auto;opacity:1}
::slotted(.separator){height:1px;margin:var(--ds-menu-item-padding-y) calc(-1 * var(--ds-menu-padding));
  background:var(--ds-separator-color)}
::slotted(.menu-head){padding:var(--ds-menu-item-padding-y) var(--ds-menu-item-padding-x);
  font-size:.8rem;font-weight:600;color:var(--color-fg-muted)}
::slotted(.menu-caption){padding:var(--ds-menu-item-padding-y) var(--ds-menu-item-padding-x);
  font-size:.75rem;color:var(--color-fg-muted)}
`;

class DsDropdownMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, MENU_CSS);
    this._onKeydown = (e) => {
      if (e.key === "Escape") this._setOpen(false);
    };
    this._onOutside = (e) => {
      if (this._open && isOutsideClick(e, this)) this._setOpen(false);
    };
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="wrap">
        <div class="trigger-slot"><slot name="trigger"></slot></div>
        <div class="panel" role="menu"><slot name="content"></slot></div>
      </div>`;
    this._triggerSlot = this.shadowRoot.querySelector(".trigger-slot");
    this._panel = this.shadowRoot.querySelector(".panel");

    // 点击 trigger 槽内的任意元素开/收
    this._triggerSlot.addEventListener("click", (e) => {
      e.stopPropagation();
      this._setOpen(!this._open);
    });
    document.addEventListener("keydown", this._onKeydown);
    document.addEventListener("click", this._onOutside);
  }
  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
    document.removeEventListener("click", this._onOutside);
  }
  _setOpen(open) {
    this._open = open;
    this._panel.toggleAttribute("data-open", open);
    const trigger = this._triggerSlot.querySelector("[slot='trigger']");
    if (trigger) {
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", String(open));
    }
    // 打开时把焦点移入面板首个可交互项
    if (open) {
      requestAnimationFrame(() => {
        const first = this._panel.querySelector(
          "[data-autofocus], ds-menu-item, button, a, input",
        );
        first?.focus?.();
      });
    }
  }
  get open() {
    return this._open;
  }
  /** 供消费方（WorkspaceSwitcher/NavUser）在选中后调用 */
  close() {
    this._setOpen(false);
  }
  toggle() {
    this._setOpen(!this._open);
  }
}
define("ds-dropdown-menu", DsDropdownMenu);

const ITEM_CSS = `
:host{display:block}
.item{display:flex;align-items:center;gap:.5rem;width:100%;
  padding:var(--ds-menu-item-padding-y) var(--ds-menu-item-padding-x);
  border-radius:var(--ds-menu-item-radius);font-size:.85rem;
  color:var(--color-fg);cursor:pointer;text-align:left;user-select:none}
.item:hover{background:var(--color-muted)}
.item:focus-visible{outline:2px solid var(--color-ring);outline-offset:-2px}
.item[aria-checked="true"]{color:var(--color-fg)}
.item .icon{display:inline-flex;flex:none;color:var(--color-fg-muted)}
.item .label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.item .check{display:inline-flex;flex:none;color:var(--color-primary)}
.item .desc{font-size:.75rem;color:var(--color-fg-muted)}
:host([danger]) .item{color:var(--color-danger)}
:host([danger]) .item:hover{background:var(--color-danger);color:var(--color-danger-fg)}
:host([danger]) .item .icon{color:inherit}
`;

class DsMenuItem extends HTMLElement {
  static observedAttributes = [
    "label",
    "icon",
    "value",
    "checked",
    "description",
    "danger",
  ];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, ITEM_CSS);
  }
  connectedCallback() {
    this._render();
    this.addEventListener("click", () => {
      if (this.hasAttribute("checked")) return;
      this.dispatchEvent(
        new CustomEvent("ds-menu-item-select", {
          bubbles: true,
          composed: true,
          detail: {
            value: this.getAttribute("value") ?? this.getAttribute("label"),
            item: this,
          },
        }),
      );
    });
    this.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }
    });
  }
  attributeChangedCallback() {
    if (this._root) this._render();
  }
  _render() {
    const label = this.getAttribute("label") ?? "";
    const icon = this.getAttribute("icon");
    const desc = this.getAttribute("description");
    const checked = this.hasAttribute("checked");
    this.setAttribute("role", "menuitem");
    this.tabIndex = 0;
    this.shadowRoot.innerHTML = "";
    const item = document.createElement("div");
    item.className = "item";
    item.setAttribute("aria-checked", String(checked));
    if (icon) {
      const ic = document.createElement("span");
      ic.className = "icon";
      ic.innerHTML =
        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-${icon}"></use></svg>`;
      item.append(ic);
    }
    const labelEl = document.createElement("span");
    labelEl.className = "label";
    labelEl.textContent = label;
    item.append(labelEl);
    if (desc) {
      const d = document.createElement("span");
      d.className = "desc";
      d.textContent = desc;
      item.append(d);
    }
    if (checked) {
      const ck = document.createElement("span");
      ck.className = "check";
      ck.innerHTML =
        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-circle-check"></use></svg>`;
      item.append(ck);
    }
    this.shadowRoot.append(item);
    this._root = item;
  }
}
define("ds-menu-item", DsMenuItem);
