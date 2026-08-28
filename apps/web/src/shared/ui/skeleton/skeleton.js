import { attachStyles } from "../base.js";

const css = `
:host { display: block; }
.skeleton {
  background-color: var(--color-muted);
  border-radius: var(--radius-md);
  opacity: 0.7;
}
`;

export class DsSkeleton extends HTMLElement {
  static get observedAttributes() {
    return ["width", "height"];
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
    const width = this.getAttribute("width") || "100%";
    const height = this.getAttribute("height") || "1rem";
    this.shadowRoot.innerHTML = `
      <div class="skeleton" style="width: ${width}; height: ${height};"></div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-skeleton")) customElements.define("ds-skeleton", DsSkeleton);
