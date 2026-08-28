import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.slider-wrap {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 1.5rem;
  touch-action: none;
}
.range-input {
  width: 100%;
  height: 0.375rem;
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  appearance: none;
  outline: none;
  cursor: pointer;
}
.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: var(--radius-full);
  background-color: var(--color-card);
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}
`;

export class DsSlider extends HTMLElement {
  static get observedAttributes() {
    return ["min", "max", "step", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value() {
    return Number(this.getAttribute("value")) || 0;
  }
  set value(val) {
    this.setAttribute("value", String(val));
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const min = this.getAttribute("min") || "0";
    const max = this.getAttribute("max") || "100";
    const step = this.getAttribute("step") || "1";
    const val = this.getAttribute("value") || "50";

    this.shadowRoot.innerHTML = `
      <div data-slot="slider" class="slider-wrap">
        <input
          type="range"
          class="range-input"
          min="${min}"
          max="${max}"
          step="${step}"
          value="${val}"
        />
      </div>
    `;

    this.shadowRoot.querySelector(".range-input")?.addEventListener("input", (e) => {
      this.value = e.target.value;
      this.dispatchEvent(
        new CustomEvent("ds-input", { detail: { value: Number(e.target.value) } }),
      );
    });
    this.shadowRoot.querySelector(".range-input")?.addEventListener("change", (e) => {
      this.value = e.target.value;
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { value: Number(e.target.value) } }),
      );
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-slider")) customElements.define("ds-slider", DsSlider);
