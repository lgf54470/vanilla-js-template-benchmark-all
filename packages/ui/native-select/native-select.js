import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.native-select {
  width: 100%;
  height: 2.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-input);
  background-color: var(--color-card);
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg);
  outline: none;
}
`;

export class DsNativeSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <select data-slot="native-select" class="native-select">
        <slot></slot>
      </select>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-native-select")) {
  customElements.define("ds-native-select", DsNativeSelect);
}
