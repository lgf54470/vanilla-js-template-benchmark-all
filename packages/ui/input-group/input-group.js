import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.input-group {
  display: flex;
  align-items: center;
  width: 100%;
  height: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-input);
  background-color: transparent;
  overflow: hidden;
  box-sizing: border-box;
}
.prefix, .suffix {
  display: flex;
  align-items: center;
  padding: 0 0.625rem;
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  background-color: var(--color-muted);
  height: 100%;
  user-select: none;
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
