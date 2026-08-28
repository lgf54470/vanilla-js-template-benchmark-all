import { attachStyles, isComposedClickInside } from "../base.js";

const css = `
:host {
  display: inline-block;
  position: relative;
}
.menu-panel {
  position: absolute;
  z-index: 50;
  min-width: 9rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-fg);
  padding: 4px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  outline: none;
  box-sizing: border-box;
}
.menu-panel[hidden] {
  display: none !important;
}
.side-down { top: calc(100% + 4px); }
.side-up { bottom: calc(100% + 4px); }
.align-left { left: 0; }
.align-right { right: 0; }
`;

export class DsDropdownMenu extends HTMLElement {
  static get observedAttributes() {
    return ["open", "side", "align"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleOutside = this._handleOutside.bind(this);
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(val) {
    if (val) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  close() {
    this.open = false;
  }

  connectedCallback() {
    this.render();
    document.addEventListener("click", this._handleOutside);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._handleOutside);
  }

  attributeChangedCallback() {
    const el = this.shadowRoot.querySelector(".menu-panel");
    if (el) {
      if (this.open) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }
  }

  _handleOutside(e) {
    if (this.open && !isComposedClickInside(e, this)) {
      this.close();
      this.dispatchEvent(new CustomEvent("ds-close"));
    }
  }

  render() {
    const side = this.getAttribute("side") || "down";
    const align = this.getAttribute("align") || "left";

    this.shadowRoot.innerHTML = `
      <div data-slot="dropdown-menu-trigger" class="trigger-wrap">
        <slot name="trigger"></slot>
      </div>
      <div data-slot="dropdown-menu" class="menu-panel side-${side} align-${align}" ${
      !this.open ? "hidden" : ""
    }>
        <slot></slot>
      </div>
    `;

    this.shadowRoot.querySelector(".trigger-wrap")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.open = !this.open;
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-dropdown-menu")) {
  customElements.define("ds-dropdown-menu", DsDropdownMenu);
}
