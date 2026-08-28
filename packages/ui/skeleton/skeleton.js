import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.skeleton {
  border-radius: var(--radius-md);
  background-color: var(--color-muted);
  opacity: 0.7;
}
`;

export class DsSkeleton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML =
      `<div data-slot="skeleton" class="skeleton" style="width: 100%; height: 100%;"></div>`;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-skeleton")) customElements.define("ds-skeleton", DsSkeleton);
