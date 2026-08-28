import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-card-fg, var(--color-fg));
  padding: var(--space-4);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
  box-sizing: border-box;
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
