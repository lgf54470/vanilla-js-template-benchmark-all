import { attachStyles, createIcon } from "../base.js";
import { maskValue } from "../../lib/mask.js";

const css = `
:host { display: inline-flex; align-items: center; }
.masked-container {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-fg);
}
.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--color-fg-muted);
  cursor: pointer;
}
.toggle-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
`;

export class MaskedField extends HTMLElement {
  static get observedAttributes() {
    return ["mask-type"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._value = "";
    this._revealed = false;
  }

  connectedCallback() {
    this.render();
  }

  get value() {
    return this._value;
  }
  set value(v) {
    this._value = String(v ?? "");
    this.render();
  }

  get maskType() {
    return this.getAttribute("mask-type") || "generic";
  }
  set maskType(v) {
    this.setAttribute("mask-type", v);
  }

  toggle() {
    this._revealed = !this._revealed;
    this.render();
  }

  render() {
    const displayed = this._revealed ? this._value : maskValue(this._value, this.maskType);
    const eyeIcon = this._revealed ? "eye-off" : "eye";
    const ariaLabel = this._revealed ? "隐藏明文" : "显示明文";

    this.shadowRoot.innerHTML = `
      <div class="masked-container" data-revealed="${this._revealed ? "true" : "false"}">
        <span class="value-text">${displayed}</span>
        <button class="toggle-btn" type="button" aria-label="${ariaLabel}" aria-pressed="${
      this._revealed ? "true" : "false"
    }">
          ${createIcon(eyeIcon)}
        </button>
      </div>
    `;

    const btn = this.shadowRoot.querySelector(".toggle-btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("masked-field")) customElements.define("masked-field", MaskedField);
