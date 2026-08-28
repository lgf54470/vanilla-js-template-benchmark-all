import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.slider-wrap {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 1.25rem;
  touch-action: none;
}
.range-input {
  width: 100%;
  height: 4px;
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  appearance: none;
  outline: none;
  cursor: pointer;
  margin: 0;
}
.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg);
  border: 1px solid var(--ring);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}
.range-input::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 35%, transparent);
}
.range-input:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
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
      this.setAttribute("value", e.target.value);
      this.dispatchEvent(
        new CustomEvent("ds-input", { detail: { value: Number(e.target.value) }, bubbles: true }),
      );
    });
    this.shadowRoot.querySelector(".range-input")?.addEventListener("change", (e) => {
      this.setAttribute("value", e.target.value);
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { value: Number(e.target.value) }, bubbles: true }),
      );
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-slider")) customElements.define("ds-slider", DsSlider);
