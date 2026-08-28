import { attachStyles } from "../base.js";
import { isComposedClickInside } from "../../lib/dom.js";

const css = `
:host {
  position: relative;
  display: inline-block;
}
.menu-panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: var(--z-dropdown);
  min-width: 12rem;
  margin-top: var(--space-1);
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
  border-radius: var(--ds-popover-radius, var(--radius-lg));
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: var(--space-1);
  display: flex;
  flex-direction: column;
}
.menu-panel[hidden] {
  display: none !important;
}
.menu-panel--right {
  left: auto;
  right: 0;
}
.menu-panel--up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: var(--space-1);
}
`;

export class DsDropdownMenu extends HTMLElement {
  static get observedAttributes() {
    return ["open", "align", "side"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    this.render();
    document.addEventListener("click", this._handleOutsideClick);
    document.addEventListener("keydown", this._handleKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._handleOutsideClick);
    document.removeEventListener("keydown", this._handleKeyDown);
  }

  get open() {
    return this.hasAttribute("open");
  }
  set open(v) {
    if (v) this.setAttribute("open", "");
    else this.removeAttribute("open");
    this.render();
  }

  get align() {
    return this.getAttribute("align") || "left";
  }
  get side() {
    return this.getAttribute("side") || "down";
  }

  toggle() {
    this.open = !this.open;
  }

  close() {
    if (this.open) {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close", { bubbles: true }));
    }
  }

  _handleOutsideClick(e) {
    if (this.open && !isComposedClickInside(e, this)) {
      this.close();
    }
  }

  _handleKeyDown(e) {
    if (e.key === "Escape" && this.open) {
      this.close();
    }
  }

  render() {
    const isOpen = this.open;
    const alignClass = this.align === "right" ? "menu-panel--right" : "";
    const sideClass = this.side === "up" ? "menu-panel--up" : "";

    this.shadowRoot.innerHTML = `
      <div class="trigger-container">
        <slot name="trigger"></slot>
      </div>
      <div class="menu-panel ${alignClass} ${sideClass}" ${!isOpen ? "hidden" : ""} role="menu">
        <slot></slot>
      </div>
    `;

    const triggerSlot = this.shadowRoot.querySelector(".trigger-container");
    triggerSlot.onclick = (e) => {
      e.stopPropagation();
      this.toggle();
    };

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-dropdown-menu")) {
  customElements.define("ds-dropdown-menu", DsDropdownMenu);
}
