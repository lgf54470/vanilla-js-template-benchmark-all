import { attachStyles } from "../base.js";

const css = `
:host { display: block; }
.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  list-style: none;
  padding: 0;
  margin: 0;
}
`;

export class DsNavigationMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <nav data-slot="navigation-menu" aria-label="Main">
        <ul class="nav-menu">
          <slot></slot>
        </ul>
      </nav>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-navigation-menu")) {
  customElements.define("ds-navigation-menu", DsNavigationMenu);
}
