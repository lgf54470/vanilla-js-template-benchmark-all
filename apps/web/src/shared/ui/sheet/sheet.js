import { attachStyles, createIcon } from "../base.js";
import { waitForTransition } from "../../lib/dom.js";

const css = `
:host { display: block; }
.backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-sheet);
  background-color: var(--color-overlay);
  display: flex;
}
.backdrop[hidden] {
  display: none !important;
}
.sheet-panel {
  position: fixed;
  background-color: var(--color-card);
  color: var(--color-card-fg);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.sheet--left {
  top: 0; bottom: 0; left: 0;
  width: var(--sidebar-width-mobile, 18rem);
  border-right: 1px solid var(--color-border);
}
.sheet--right {
  top: 0; bottom: 0; right: 0;
  width: 24rem;
  max-width: 100%;
  border-left: 1px solid var(--color-border);
}
.sheet--top {
  top: 0; left: 0; right: 0;
  height: 16rem;
  border-bottom: 1px solid var(--color-border);
}
.sheet--bottom {
  bottom: 0; left: 0; right: 0;
  height: 16rem;
  border-top: 1px solid var(--color-border);
}
.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.sheet-title {
  font-size: var(--text-base);
  font-weight: 600;
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
.sheet-body {
  flex: 1;
  padding: var(--space-4);
}
`;

export class DsSheet extends HTMLElement {
  static get observedAttributes() {
    return ["open", "side", "title"];
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
      if (this.open) document.addEventListener("keydown", this._handleKeyDown);
      else document.removeEventListener("keydown", this._handleKeyDown);
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

  get side() {
    return this.getAttribute("side") || "left";
  }

  _handleKeyDown(e) {
    if (e.key === "Escape" && this.open) this.close();
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

    this.shadowRoot.innerHTML = `
      <div class="backdrop" ${!isOpen ? "hidden" : ""} role="dialog" aria-modal="true">
        <div class="sheet-panel sheet--${this.side}">
          <div class="sheet-header">
            <div class="sheet-title">${title || ""}</div>
            <button class="close-btn" type="button" aria-label="Close sheet">
              ${createIcon("x")}
            </button>
          </div>
          <div class="sheet-body">
            <slot></slot>
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
if (!customElements.get("ds-sheet")) customElements.define("ds-sheet", DsSheet);
