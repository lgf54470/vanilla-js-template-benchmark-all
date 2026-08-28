import { attachStyles } from "../base.js";
const css =
  `:host { display: block; width: 100%; } .quest { display: flex; flex-direction: column; gap: var(--space-4); }`;
export class DsQuestionnaire extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `<div data-slot="questionnaire" class="quest"><slot></slot></div>`;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-questionnaire")) {
  customElements.define("ds-questionnaire", DsQuestionnaire);
}
