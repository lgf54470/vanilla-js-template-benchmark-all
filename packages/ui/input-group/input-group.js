import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.input-group {
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-input);
  background-color: var(--color-card);
  overflow: hidden;
}
.prefix, .suffix {
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  background-color: var(--color-muted);
}
::slotted(ds-input) {
  flex: 1;
}
`;

export class DsInputGroup extends HTMLElement {
  static get observedAttributes() {
    return ["prefix-text", "suffix-text"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const prefix = this.getAttribute("prefix-text");
    const suffix = this.getAttribute("suffix-text");

    this.shadowRoot.innerHTML = `
      <div data-slot="input-group" class="input-group">
        ${prefix ? `<div class="prefix">${prefix}</div>` : ""}
        <slot></slot>
        ${suffix ? `<div class="suffix">${suffix}</div>` : ""}
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-input-group")) customElements.define("ds-input-group", DsInputGroup);
