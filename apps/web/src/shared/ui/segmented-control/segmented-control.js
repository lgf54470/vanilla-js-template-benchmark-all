import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: inline-block; }
.segmented-control {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-muted);
  padding: 0.125rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  gap: 0.125rem;
}
.segment-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding-block: var(--space-1);
  padding-inline: var(--space-3);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-fg-muted);
  border-radius: var(--radius-full);
  cursor: pointer;
  border: none;
  background: transparent;
  user-select: none;
}
.segment-item--active {
  background-color: var(--color-bg);
  color: var(--color-fg);
  box-shadow: var(--shadow-xs);
}
.segment-item:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
`;

export class DsSegmentedControl extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._items = [];
  }

  connectedCallback() {
    this.setAttribute("role", "radiogroup");
    this.render();
  }

  get items() {
    return this._items;
  }
  set items(val) {
    this._items = val;
    this.render();
  }

  get value() {
    return this.getAttribute("value") || "";
  }
  set value(v) {
    this.setAttribute("value", v);
    this.render();
  }

  render() {
    const currentVal = this.value;
    const itemsHtml = this._items.map((item) => {
      const active = item.value === currentVal;
      const iconHtml = item.icon ? createIcon(item.icon) : "";
      return `
        <button class="segment-item ${active ? "segment-item--active" : ""}"
          data-value="${item.value}"
          role="radio"
          aria-checked="${active ? "true" : "false"}"
          title="${item.label || ""}"
        >
          ${iconHtml}
          ${item.label ? `<span>${item.label}</span>` : ""}
        </button>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `<div class="segmented-control">${itemsHtml}</div>`;

    this.shadowRoot.querySelectorAll(".segment-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-value");
        this.value = val;
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: val }, bubbles: true }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-segmented-control")) {
  customElements.define("ds-segmented-control", DsSegmentedControl);
}
