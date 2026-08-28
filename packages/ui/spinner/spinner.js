import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
}
`;

export class DsSpinner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `<div data-slot="spinner" class="spinner"></div>`;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-spinner")) customElements.define("ds-spinner", DsSpinner);
