import { attachStyles } from "../base.js";

const css = `
:host { display: inline-block; }
.label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
  line-height: 1.25;
  user-select: none;
  cursor: pointer;
}
.label[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

export class DsLabel extends HTMLElement {
  static get observedAttributes() {
    return ["for", "disabled"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const htmlFor = this.getAttribute("for") || "";
    const disabled = this.hasAttribute("disabled");

    this.shadowRoot.innerHTML = `
      <label data-slot="label" class="label" for="${htmlFor}" ${
      disabled ? 'aria-disabled="true"' : ""
    }>
        <slot></slot>
      </label>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-label")) customElements.define("ds-label", DsLabel);
