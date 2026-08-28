import { attachStyles, createIcon } from "../base.js";
import { waitForTransition } from "../../lib/dom.js";

const css = `
:host { display: block; }
.backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-dialog);
  background-color: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.backdrop[hidden] {
  display: none !important;
}
.dialog-content {
  position: relative;
  width: 100%;
  max-width: 32rem;
  background-color: var(--color-card);
  color: var(--color-card-fg);
  border-radius: var(--ds-dialog-radius, var(--radius-xl));
  border: var(--ds-card-border, 1px solid var(--color-border));
  box-shadow: var(--shadow-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}
.dialog-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-fg);
  line-height: var(--leading-tight);
}
.dialog-description {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  margin-top: var(--space-1);
}
.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--color-fg-muted);
  cursor: pointer;
}
.close-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
`;

export class DsDialog extends HTMLElement {
  static get observedAttributes() {
    return ["open", "title", "description"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._handleKeyDown);
  }

  attributeChangedCallback(name) {
    if (name === "open") {
      if (this.open) {
        document.addEventListener("keydown", this._handleKeyDown);
      } else {
        document.removeEventListener("keydown", this._handleKeyDown);
      }
    }
    this.render();
  }

  get open() {
    return this.hasAttribute("open");
  }
  set open(v) {
    if (v) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  _handleKeyDown(e) {
    if (e.key === "Escape" && this.open) {
      this.close();
    }
  }

  async close() {
    const backdrop = this.shadowRoot.querySelector(".backdrop");
    await waitForTransition(backdrop);
    this.open = false;
    this.dispatchEvent(new CustomEvent("ds-close", { bubbles: true }));
  }

  render() {
    const isOpen = this.open;
    const title = this.getAttribute("title");
    const description = this.getAttribute("description");

    this.shadowRoot.innerHTML = `
      <div class="backdrop" ${!isOpen ? "hidden" : ""} role="dialog" aria-modal="true">
        <div class="dialog-content">
          ${
      (title || description)
        ? `
            <div class="dialog-header">
              <div>
                ${title ? `<div class="dialog-title">${title}</div>` : ""}
                ${description ? `<div class="dialog-description">${description}</div>` : ""}
              </div>
              <button class="close-btn" type="button" aria-label="Close dialog">
                ${createIcon("x")}
              </button>
            </div>
          `
        : ""
    }
          <div class="dialog-body">
            <slot></slot>
          </div>
          <div class="dialog-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.shadowRoot.querySelector(".close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    const backdrop = this.shadowRoot.querySelector(".backdrop");
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) this.close();
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-dialog")) customElements.define("ds-dialog", DsDialog);
