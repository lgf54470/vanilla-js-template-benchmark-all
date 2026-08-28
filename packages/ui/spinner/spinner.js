import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-fg-muted);
}
.size-sm { width: 1rem; height: 1rem; }
.size-default { width: 1.25rem; height: 1.25rem; }
.size-lg { width: 1.5rem; height: 1.5rem; }
`;

export class DsSpinner extends HTMLElement {
  static get observedAttributes() {
    return ["size"];
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
    const size = this.getAttribute("size") || "default";
    this.shadowRoot.innerHTML = `
      <div data-slot="spinner" class="spinner size-${size}">
        ${createIcon("loader-2")}
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-spinner")) customElements.define("ds-spinner", DsSpinner);
