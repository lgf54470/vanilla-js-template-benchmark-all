import { attachStyles, createIcon } from "../base.js";
const css =
  `:host { display: inline-flex; } .att { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); background-color: var(--color-card); font-size: var(--text-sm); }`;
export class DsAttachment extends HTMLElement {
  static get observedAttributes() {
    return ["filename"];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    const name = this.getAttribute("filename") || "附件";
    this.shadowRoot.innerHTML = `<div data-slot="attachment" class="att">${
      createIcon("file")
    }<span>${name}</span><slot></slot></div>`;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-attachment")) customElements.define("ds-attachment", DsAttachment);
