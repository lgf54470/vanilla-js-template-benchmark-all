import { attachStyles } from "../base.js";

const css = `
:host { display: block; }
.menubar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  padding: var(--space-1);
}
`;

export class DsMenubar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="menubar" class="menubar" role="menubar">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-menubar")) customElements.define("ds-menubar", DsMenubar);
