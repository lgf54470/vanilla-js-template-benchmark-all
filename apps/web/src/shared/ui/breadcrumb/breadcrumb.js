import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: inline-flex; }
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}
.separator {
  color: var(--color-fg-muted);
  opacity: 0.6;
}
.current {
  color: var(--color-fg);
  font-weight: 500;
}
`;

export class DsBreadcrumb extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._items = [];
  }

  connectedCallback() {
    this.render();
  }

  get items() {
    return this._items;
  }
  set items(val) {
    this._items = val;
    this.render();
  }

  render() {
    const list = this._items.map((item, idx) => {
      const isLast = idx === this._items.length - 1;
      return `
        ${idx > 0 ? `<span class="separator">${createIcon("chevron-right")}</span>` : ""}
        <span class="${isLast ? "current" : ""}">${item.label}</span>
      `;
    }).join("");

    this.shadowRoot.innerHTML =
      `<nav class="breadcrumb" aria-label="Breadcrumb">${list}<slot></slot></nav>`;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-breadcrumb")) customElements.define("ds-breadcrumb", DsBreadcrumb);
