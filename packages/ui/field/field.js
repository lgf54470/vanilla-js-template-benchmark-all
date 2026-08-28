import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}
.field-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
}
.field-desc {
  font-size: var(--text-xs);
  color: var(--color-fg-muted);
}
.field-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
}
`;

export class DsField extends HTMLElement {
  static get observedAttributes() {
    return ["label", "description", "error"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const label = this.getAttribute("label");
    const desc = this.getAttribute("description");
    const error = this.getAttribute("error");

    this.shadowRoot.innerHTML = `
      <div data-slot="field" class="field">
        ${label ? `<label data-slot="field-label" class="field-label">${label}</label>` : ""}
        <slot></slot>
        ${desc ? `<div data-slot="field-description" class="field-desc">${desc}</div>` : ""}
        ${error ? `<div data-slot="field-error" class="field-error">${error}</div>` : ""}
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-field")) customElements.define("ds-field", DsField);
