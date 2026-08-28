import { attachStyles, createIcon, isComposedClickInside } from "../base.js";

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
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.overlay[hidden] {
  display: none !important;
}
.dialog-content {
  position: relative;
  width: 100%;
  max-width: 32rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-card-fg);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
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
}
.close-btn:hover {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
`;

export class DsDialog extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
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
    const content = this.shadowRoot.querySelector(".dialog-content");
    if (content && !isComposedClickInside(e, content)) {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close"));
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div data-slot="dialog-overlay" class="overlay" ${!this.open ? "hidden" : ""}>
        <div data-slot="dialog" class="dialog-content" role="dialog" aria-modal="true">
          <button data-slot="dialog-close" class="close-btn" id="btn-close" aria-label="关闭">
            ${createIcon("x")}
          </button>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector("#btn-close")?.addEventListener("click", () => {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close"));
    });

    this.shadowRoot.querySelector(".overlay")?.addEventListener("click", this._handleOutsideClick);

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-dialog")) customElements.define("ds-dialog", DsDialog);
