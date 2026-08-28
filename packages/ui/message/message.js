import { attachStyles } from "../base.js";
const css =
  `:host { display: block; width: 100%; margin-bottom: var(--space-4); } .msg { display: flex; gap: var(--space-3); }`;
export class DsMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<div data-slot="message" class="msg"><slot></slot></div>`;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-message")) customElements.define("ds-message", DsMessage);
