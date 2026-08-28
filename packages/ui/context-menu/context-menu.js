import { attachStyles, isComposedClickInside } from "../base.js";

const css = `
:host { display: contents; }
.context-panel {
  position: fixed;
  z-index: 60;
  min-width: 10rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
  padding: var(--space-1);
  box-shadow: var(--shadow-lg);
}
.context-panel[hidden] { display: none !important; }
`;

export class DsContextMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleOutside = this._handleOutside.bind(this);
    this._handleContextMenu = this._handleContextMenu.bind(this);
  }

  connectedCallback() {
    this.render();
    this.parentElement?.addEventListener("contextmenu", this._handleContextMenu);
    document.addEventListener("click", this._handleOutside);
  }

  disconnectedCallback() {
    this.parentElement?.removeEventListener("contextmenu", this._handleContextMenu);
    document.removeEventListener("click", this._handleOutside);
  }

  _handleContextMenu(e) {
    e.preventDefault();
    const panel = this.shadowRoot.querySelector(".context-panel");
    if (panel) {
      panel.style.left = `${e.clientX}px`;
      panel.style.top = `${e.clientY}px`;
      panel.removeAttribute("hidden");
    }
  }

  _handleOutside(e) {
    const panel = this.shadowRoot.querySelector(".context-panel");
    if (panel && !isComposedClickInside(e, panel)) {
      panel.setAttribute("hidden", "");
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div data-slot="context-menu" class="context-panel" hidden>
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-context-menu")) customElements.define("ds-context-menu", DsContextMenu);
