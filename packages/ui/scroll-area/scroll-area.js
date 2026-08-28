import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
  position: relative;
  overflow: auto;
}
`;

export class DsScrollArea extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="scroll-area" style="width: 100%; height: 100%;">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-scroll-area")) customElements.define("ds-scroll-area", DsScrollArea);
