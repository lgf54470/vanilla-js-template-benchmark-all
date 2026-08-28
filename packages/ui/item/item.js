import { attachStyles } from "../base.js";
const css =
  `:host { display: block; } .item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); }`;
export class DsItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<div data-slot="item" class="item"><slot></slot></div>`;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-item")) customElements.define("ds-item", DsItem);
