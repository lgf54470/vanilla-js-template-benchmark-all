import { attachStyles } from "../base.js";
const css =
  `:host { display: inline-block; } .marker { width: 0.5rem; height: 0.5rem; border-radius: var(--radius-full); background-color: var(--color-primary); }`;
export class DsMarker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<span data-slot="marker" class="marker"></span>`;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-marker")) customElements.define("ds-marker", DsMarker);
