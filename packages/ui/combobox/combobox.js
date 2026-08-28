import { attachStyles } from "../base.js";
import "../popover/popover.js";
import "../command/command.js";

const css = `
:host { display: block; width: 100%; }
`;

export class DsCombobox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <ds-popover data-slot="combobox">
        <slot name="trigger" slot="trigger"></slot>
        <ds-command>
          <slot></slot>
        </ds-command>
      </ds-popover>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-combobox")) customElements.define("ds-combobox", DsCombobox);
