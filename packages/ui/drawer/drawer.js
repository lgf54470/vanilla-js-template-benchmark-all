import { attachStyles, isComposedClickInside } from "../base.js";

const css = `
:host { display: contents; }
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: var(--color-overlay);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  backdrop-filter: blur(2px);
}
.overlay[hidden] { display: none !important; }
.drawer-content {
  width: 100%;
  max-width: 32rem;
  background-color: var(--color-card);
  color: var(--color-fg);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  padding: var(--space-4);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
}
.handle {
  width: 100px;
  height: 4px;
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  margin: 0 auto var(--space-3) auto;
}
`;

export class DsDrawer extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
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
  }

  attributeChangedCallback() {
    const el = this.shadowRoot.querySelector(".overlay");
    if (el) {
      if (this.open) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }
  }

  _handleOutside(e) {
    const content = this.shadowRoot.querySelector(".drawer-content");
    if (content && !isComposedClickInside(e, content)) {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close"));
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div data-slot="drawer-overlay" class="overlay" ${!this.open ? "hidden" : ""}>
        <div data-slot="drawer" class="drawer-content" role="dialog" aria-modal="true">
          <div data-slot="drawer-handle" class="handle"></div>
          <slot></slot>
        </div>
      </div>
    `;
    this.shadowRoot.querySelector(".overlay")?.addEventListener("click", this._handleOutside);
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-drawer")) customElements.define("ds-drawer", DsDrawer);
