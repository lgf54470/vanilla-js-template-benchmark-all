import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.25rem;
  min-width: 1.25rem;
  border-radius: var(--radius-sm, 2px);
  border: 1px solid var(--color-border);
  background-color: var(--color-muted);
  padding: 0 0.25rem;
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-fg-muted);
  box-sizing: border-box;
  line-height: 1;
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
