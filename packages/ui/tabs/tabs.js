import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.tabs-list {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-muted);
  padding: 3px;
  color: var(--color-fg-muted);
  gap: 2px;
  box-sizing: border-box;
  user-select: none;
}
.tab-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: calc(2rem - 6px);
  white-space: nowrap;
  border-radius: var(--radius-md);
  padding: 0 0.625rem;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-fg-muted);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}
.tab-trigger:hover:not(.tab-trigger--active) {
  color: var(--color-fg);
}
.tab-trigger:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.tab-trigger--active {
  background-color: var(--color-bg);
  color: var(--color-fg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
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
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: val }, bubbles: true }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-tabs")) customElements.define("ds-tabs", DsTabs);
