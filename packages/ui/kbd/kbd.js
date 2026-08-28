import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-muted);
  padding: 0.125rem 0.375rem;
  font-family: inherit;
  font-size: var(--text-2xs);
  font-weight: 500;
  color: var(--color-fg-muted);
  box-shadow: var(--shadow-xs);
}
`;

export class DsKbd extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <kbd data-slot="kbd" class="kbd">
        <slot></slot>
      </kbd>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-kbd")) customElements.define("ds-kbd", DsKbd);
