import { attachStyles } from "../base.js";

const css = `
:host { display: inline-flex; }
.btn-group {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-md);
  overflow: hidden;
}
::slotted(ds-button) {
  border-radius: 0 !important;
}
`;

export class DsButtonGroup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="button-group" class="btn-group" role="group">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-button-group")) customElements.define("ds-button-group", DsButtonGroup);
