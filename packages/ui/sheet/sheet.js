import { attachStyles, isComposedClickInside } from "../base.js";

const css = `
:host {
  display: contents;
}
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: var(--color-overlay);
  display: flex;
}
.overlay[hidden] {
  display: none !important;
}
.sheet-panel {
  position: fixed;
  z-index: 51;
  background-color: var(--color-card);
  color: var(--color-card-fg);
  box-shadow: var(--shadow-xl);
  overflow-y: auto;
}
.side-right {
  top: 0;
  right: 0;
  bottom: 0;
  border-left: 1px solid var(--color-border);
}
.side-left {
  top: 0;
  left: 0;
  bottom: 0;
  border-right: 1px solid var(--color-border);
}
.side-top {
  top: 0;
  left: 0;
  right: 0;
  border-bottom: 1px solid var(--color-border);
}
.side-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid var(--color-border);
}
`;

export class DsSheet extends HTMLElement {
  static get observedAttributes() {
    return ["open", "side"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
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
    document.addEventListener("keydown", this._handleKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._handleKeydown);
  }

  attributeChangedCallback() {
    const overlay = this.shadowRoot.querySelector(".overlay");
    if (overlay) {
      if (this.open) overlay.removeAttribute("hidden");
      else overlay.setAttribute("hidden", "");
    }
  }

  _handleKeydown(e) {
    if (this.open && e.key === "Escape") {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close"));
    }
  }

  _handleOutsideClick(e) {
    const panel = this.shadowRoot.querySelector(".sheet-panel");
    if (panel && !isComposedClickInside(e, panel)) {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close"));
    }
  }

  render() {
    const side = this.getAttribute("side") || "right";

    this.shadowRoot.innerHTML = `
      <div data-slot="sheet-overlay" class="overlay" ${!this.open ? "hidden" : ""}>
        <div data-slot="sheet" class="sheet-panel side-${side}" role="dialog" aria-modal="true">
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".overlay")?.addEventListener("click", this._handleOutsideClick);
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-sheet")) customElements.define("ds-sheet", DsSheet);
