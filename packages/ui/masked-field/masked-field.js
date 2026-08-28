import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.masked-val {
  font-family: monospace;
  font-size: var(--text-sm);
  color: var(--color-fg);
}
.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-sm);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.toggle-btn:hover {
  color: var(--color-fg);
}
`;

export class DsMaskedField extends HTMLElement {
  static get observedAttributes() {
    return ["value", "masked"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._revealed = false;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const raw = this.getAttribute("value") || "";
    const masked = this.getAttribute("masked") || "••••••••";
    const displayVal = this._revealed ? raw : masked;

    this.shadowRoot.innerHTML = `
      <span data-slot="masked-field-value" class="masked-val">${displayVal}</span>
      <button data-slot="masked-field-toggle" type="button" class="toggle-btn" title="${
      this._revealed ? "隐藏" : "显示"
    }">
        ${createIcon(this._revealed ? "eye-off" : "eye")}
      </button>
    `;

    this.shadowRoot.querySelector(".toggle-btn")?.addEventListener("click", () => {
      this._revealed = !this._revealed;
      this.render();
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-masked-field")) customElements.define("ds-masked-field", DsMaskedField);
