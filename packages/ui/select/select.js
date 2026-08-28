import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.select-wrapper {
  position: relative;
  width: 100%;
}
.select {
  width: 100%;
  height: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-input);
  background-color: transparent;
  padding: 0 2rem 0 0.625rem;
  font-size: var(--text-sm);
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.select:hover:not(:disabled) {
  border-color: var(--color-fg-muted);
}
.select:focus-visible, .select:focus {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.chevron {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
}
`;

export class DsSelect extends HTMLElement {
  static get observedAttributes() {
    return ["value", "disabled", "placeholder"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._options = [];
    this._placeholder = "请选择...";
  }

  get options() {
    return this._options;
  }
  set options(val) {
    this._options = Array.isArray(val) ? val : [];
    this.render();
  }

  get placeholder() {
    return this.getAttribute("placeholder") || this._placeholder;
  }
  set placeholder(val) {
    this._placeholder = val;
    this.setAttribute("placeholder", val);
    this.render();
  }

  get value() {
    const sel = this.shadowRoot.querySelector("select");
    return sel ? sel.value : this.getAttribute("value") || "";
  }

  set value(val) {
    const sel = this.shadowRoot.querySelector("select");
    if (sel) sel.value = val;
    this.setAttribute("value", val);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const disabled = this.hasAttribute("disabled");
    const placeholder = this.placeholder;
    const curVal = this.getAttribute("value") || "";

    this.shadowRoot.innerHTML = `
      <div data-slot="select-wrapper" class="select-wrapper">
        <select data-slot="select" class="select" ${disabled ? "disabled" : ""}>
          ${
      placeholder
        ? `<option value="" disabled ${!curVal ? "selected" : ""}>${placeholder}</option>`
        : ""
    }
          ${
      this._options.map((opt) => `
            <option value="${opt.value}" ${
        opt.value === curVal ? "selected" : ""
      }>${opt.label}</option>
          `).join("")
    }
          <slot></slot>
        </select>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    `;

    const sel = this.shadowRoot.querySelector("select");
    sel?.addEventListener("change", (e) => {
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { value: e.target.value }, bubbles: true }),
      );
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-select")) customElements.define("ds-select", DsSelect);
