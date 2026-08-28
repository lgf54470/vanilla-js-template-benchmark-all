import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.separator {
  background-color: var(--color-border);
  flex-shrink: 0;
}
.orientation-horizontal {
  height: 1px;
  width: 100%;
}
.orientation-vertical {
  width: 1px;
  height: 100%;
}
`;

export class DsSeparator extends HTMLElement {
  static get observedAttributes() {
    return ["orientation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const orientation = this.getAttribute("orientation") || "horizontal";
    this.shadowRoot.innerHTML = `
      <div data-slot="separator" class="separator orientation-${orientation}"></div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-separator")) customElements.define("ds-separator", DsSeparator);
