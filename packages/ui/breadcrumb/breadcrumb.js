import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: block;
}
.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  list-style: none;
  padding: 0;
  margin: 0;
}
.breadcrumb-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.breadcrumb-link {
  color: var(--color-fg-muted);
  text-decoration: none;
}
.breadcrumb-link:hover {
  color: var(--color-fg);
}
.breadcrumb-page {
  color: var(--color-fg);
  font-weight: 500;
}
.separator {
  color: var(--color-fg-muted);
  display: flex;
  align-items: center;
}
`;

export class DsBreadcrumb extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._items = [];
  }

  get items() {
    return this._items;
  }

  set items(val) {
    this._items = Array.isArray(val) ? val : [];
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <nav data-slot="breadcrumb" aria-label="breadcrumb">
        <ol data-slot="breadcrumb-list" class="breadcrumb-list">
          ${
      this._items.map((item, idx) => {
        const isLast = idx === this._items.length - 1;
        return `
              <li data-slot="breadcrumb-item" class="breadcrumb-item">
                ${
          isLast
            ? `<span data-slot="breadcrumb-page" class="breadcrumb-page">${item.label}</span>`
            : `<a data-slot="breadcrumb-link" class="breadcrumb-link" href="${
              item.href || "#"
            }">${item.label}</a><span data-slot="breadcrumb-separator" class="separator">${
              createIcon("chevron-right")
            }</span>`
        }
              </li>
            `;
      }).join("")
    }
        </ol>
      </nav>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-breadcrumb")) customElements.define("ds-breadcrumb", DsBreadcrumb);
