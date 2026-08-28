import { attachStyles } from "../base.js";
import "../toggle/toggle.js";

const css = `
:host { display: inline-block; }
.toggle-group {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.orientation-vertical {
  flex-direction: column;
}
`;

export class DsToggleGroup extends HTMLElement {
  static get observedAttributes() {
    return ["type", "orientation", "value"];
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
      <div data-slot="toggle-group" class="toggle-group orientation-${orientation}" role="group">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-toggle-group")) customElements.define("ds-toggle-group", DsToggleGroup);
