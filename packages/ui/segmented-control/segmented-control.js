import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.segmented-wrapper {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-muted);
  padding: 0.25rem;
  border-radius: var(--radius-lg);
  gap: 0.25rem;
  width: 100%;
  box-sizing: border-box;
}
.seg-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0 var(--space-3);
  user-select: none;
}
.seg-btn--active {
  background-color: var(--color-card);
  color: var(--color-fg);
  box-shadow: var(--shadow-xs);
}
`;

export class DsSegmentedControl extends HTMLElement {
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
      <div data-slot="segmented-control" class="segmented-wrapper">
        ${
      this._items.map((it) => {
        const active = it.value === this._value;
        return `
            <button
              type="button"
              class="seg-btn ${active ? "seg-btn--active" : ""}"
              data-value="${it.value}"
            >
              ${it.label}
            </button>
          `;
      }).join("")
    }
      </div>
    `;

    this.shadowRoot.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-value");
        this.value = val;
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: val } }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-segmented-control")) {
  customElements.define("ds-segmented-control", DsSegmentedControl);
}
