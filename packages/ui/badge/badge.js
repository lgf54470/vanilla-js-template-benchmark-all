import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  padding: 0.125rem 0.625rem;
  font-size: var(--text-2xs);
  font-weight: 500;
  line-height: 1.2;
  border: 1px solid transparent;
  white-space: nowrap;
}
.variant-default {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
}
.variant-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-fg);
}
.variant-destructive {
  background-color: var(--color-danger);
  color: var(--color-danger-fg);
}
.variant-outline {
  border-color: var(--color-border);
  color: var(--color-fg);
  background-color: transparent;
}
`;

export class DsBadge extends HTMLElement {
  static get observedAttributes() {
    return ["variant"];
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
    const variant = this.getAttribute("variant") || "default";
    this.shadowRoot.innerHTML = `
      <span data-slot="badge" class="badge variant-${variant}">
        <slot></slot>
      </span>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-badge")) customElements.define("ds-badge", DsBadge);
