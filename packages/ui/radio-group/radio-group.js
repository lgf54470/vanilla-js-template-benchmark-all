import { attachStyles } from "../base.js";

const css = `
:host { display: block; }
.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.radio-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-fg);
  user-select: none;
}
.radio-circle {
  width: 1rem;
  height: 1rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-card);
}
.radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  display: none;
}
.radio-item--checked .radio-dot {
  display: block;
}
`;

export class DsRadioGroup extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

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
    this.render();
  }

  get value() {
    return this.getAttribute("value") || this._value;
  }
  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const cur = this.value;
    this.shadowRoot.innerHTML = `
      <div data-slot="radio-group" class="radio-group" role="radiogroup">
        ${
      this._items.map((it) => {
        const checked = it.value === cur;
        return `
            <div data-slot="radio-group-item" class="radio-item ${
          checked ? "radio-item--checked" : ""
        }" data-val="${it.value}" role="radio" aria-checked="${checked}">
              <div class="radio-circle">
                <span class="radio-dot"></span>
              </div>
              <span>${it.label}</span>
            </div>
          `;
      }).join("")
    }
        <slot></slot>
      </div>
    `;

    this.shadowRoot.querySelectorAll(".radio-item").forEach((item) => {
      item.addEventListener("click", () => {
        const val = item.getAttribute("data-val");
        this.value = val;
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: val } }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-radio-group")) customElements.define("ds-radio-group", DsRadioGroup);
