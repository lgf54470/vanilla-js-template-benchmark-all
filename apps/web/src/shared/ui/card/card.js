import { attachStyles } from "../base.js";

const css = `
:host { display: block; }
.card {
  background-color: var(--color-card);
  color: var(--color-card-fg);
  border-radius: var(--ds-card-radius, var(--radius-lg));
  border: var(--ds-card-border, 1px solid var(--color-border));
  box-shadow: 0 0 0 1px var(--ds-card-ring, transparent);
  padding: var(--space-4);
}
.card--compact {
  padding: var(--space-3);
}
`;

export class DsCard extends HTMLElement {
  static get observedAttributes() {
    return ["compact"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const compact = this.hasAttribute("compact");
    this.shadowRoot.innerHTML = `
      <div class="card ${compact ? "card--compact" : ""}">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-card")) customElements.define("ds-card", DsCard);
