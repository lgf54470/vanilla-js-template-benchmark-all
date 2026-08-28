import { attachStyles } from "../base.js";

const css = `
:host { display: flex; width: 100%; height: 100%; }
.resizable-panel-group {
  display: flex;
  width: 100%;
  height: 100%;
}
.direction-vertical {
  flex-direction: column;
}
`;

export class DsResizable extends HTMLElement {
  static get observedAttributes() {
    return ["direction"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const dir = this.getAttribute("direction") || "horizontal";
    this.shadowRoot.innerHTML = `
      <div data-slot="resizable-panel-group" class="resizable-panel-group direction-${dir}">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-resizable")) customElements.define("ds-resizable", DsResizable);
