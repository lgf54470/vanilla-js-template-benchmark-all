// apps/web/src/shared/ui/tooltip/tooltip.js — <ds-tooltip>
//
// 触发器可以是自身（hover/focus 目标 = host）或通过 data-tooltip 指向外部元素。
// Sidebar 收起态菜单项复用：<ds-sidebar-menu-item data-tooltip="文案">。
// 定位：简单上方居中（浮层，--ds-tooltip-*），全站 no-motion 下瞬时显隐。

import { attachStyles, define } from "../base.js";

const TOOLTIP_CSS = `
:host{position:relative;display:inline-block}
.tip{position:absolute;left:50%;bottom:calc(100% + .4rem);transform:translateX(-50%);
  padding:.25rem .5rem;border-radius:var(--ds-tooltip-radius);
  background:var(--ds-tooltip-bg);color:var(--ds-tooltip-fg);
  font-size:.75rem;line-height:1.4;white-space:nowrap;z-index:var(--z-tooltip);
  pointer-events:none;opacity:0}
:host([data-open]) .tip{opacity:1}
`;

class DsTooltip extends HTMLElement {
  static observedAttributes = ["content", "data-open"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, TOOLTIP_CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <slot></slot>
      <div class="tip" role="tooltip"></div>`;
    this._tip = this.shadowRoot.querySelector(".tip");
    this._tip.textContent = this.getAttribute("content") ?? "";
    this.addEventListener("mouseenter", () => this._show(true));
    this.addEventListener("mouseleave", () => this._show(false));
    this.addEventListener("focusin", () => this._show(true));
    this.addEventListener("focusout", () => this._show(false));
  }
  attributeChangedCallback(name, _old, value) {
    if (name === "content") {
      if (this._tip) this._tip.textContent = value ?? "";
    } else if (name === "data-open") {
      // 外部（如 sidebar 收起态）通过 data-open 属性强制显隐
    }
  }
  _show(open) {
    this.toggleAttribute("data-open", open);
  }
}
define("ds-tooltip", DsTooltip);
