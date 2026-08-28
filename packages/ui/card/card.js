import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-card-fg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
`;

export class DsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="card" class="card">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-card")) customElements.define("ds-card", DsCard);
