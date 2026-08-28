import { attachStyles } from "../base.js";
export class DsDirection extends HTMLElement {
  static get observedAttributes() {
    return ["dir"];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    const dir = this.getAttribute("dir") || "ltr";
    this.shadowRoot.innerHTML = `<div data-slot="direction" dir="${dir}"><slot></slot></div>`;
    attachStyles(this.shadowRoot, "");
  }
}
if (!customElements.get("ds-direction")) customElements.define("ds-direction", DsDirection);
