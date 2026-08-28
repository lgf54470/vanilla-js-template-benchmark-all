import { attachStyles } from "../base.js";

const css = `
:host { display: block; }
.menubar {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  padding: 3px;
  box-sizing: border-box;
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
