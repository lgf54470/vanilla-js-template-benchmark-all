import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.tabs-list {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background-color: var(--color-muted);
  padding: 0.25rem;
  color: var(--color-fg-muted);
  gap: 0.25rem;
}
.tab-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: var(--radius-md);
  padding: 0.375rem 0.75rem;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--color-fg-muted);
}
.tab-trigger--active {
  background-color: var(--color-card);
  color: var(--color-fg);
  box-shadow: var(--shadow-xs);
}
`;

export class DsTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._items = [];
    this._value = "";
  }

  get items() {
    return this._items;
  }
  set items(val) {
    this._items = Array.isArray(val) ? val : [];
    if (this._items.length > 0 && !this._value) this._value = this._items[0].value;
    this.render();
  }

  get value() {
    return this._value;
  }
  set value(val) {
    this._value = val;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div data-slot="tabs-list" class="tabs-list" role="tablist">
        ${
      this._items.map((it) => {
        const active = it.value === this._value;
        return `
            <button
              data-slot="tabs-trigger"
              role="tab"
              aria-selected="${active}"
              class="tab-trigger ${active ? "tab-trigger--active" : ""}"
              data-value="${it.value}"
            >
              ${it.label}
            </button>
          `;
      }).join("")
    }
      </div>
    `;

    this.shadowRoot.querySelectorAll(".tab-trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-value");
        this.value = val;
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: val } }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-tabs")) customElements.define("ds-tabs", DsTabs);
