import { attachStyles, isComposedClickInside } from "../base.js";

const css = `
:host {
  display: inline-block;
  position: relative;
}
.popover-content {
  position: absolute;
  top: calc(100% + var(--space-2));
  z-index: 50;
  min-width: 12rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  outline: none;
}
.popover-content[hidden] {
  display: none !important;
}
.align-left { left: 0; }
.align-right { right: 0; }
`;

export class DsPopover extends HTMLElement {
  static get observedAttributes() {
    return ["open", "align"];
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

  connectedCallback() {
    this.render();
    document.addEventListener("click", this._handleOutside);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._handleOutside);
  }

  attributeChangedCallback() {
    const el = this.shadowRoot.querySelector(".popover-content");
    if (el) {
      if (this.open) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }
  }

  _handleOutside(e) {
    if (this.open && !isComposedClickInside(e, this)) {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close"));
    }
  }

  render() {
    const align = this.getAttribute("align") || "left";

    this.shadowRoot.innerHTML = `
      <div data-slot="popover-trigger" class="trigger-wrap">
        <slot name="trigger"></slot>
      </div>
      <div data-slot="popover" class="popover-content align-${align}" ${!this.open ? "hidden" : ""}>
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

if (!customElements.get("ds-popover")) customElements.define("ds-popover", DsPopover);
