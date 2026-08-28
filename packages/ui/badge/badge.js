import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  height: 1.25rem;
  border-radius: var(--radius-full);
  padding: 0.125rem 0.5rem;
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1;
  border: 1px solid transparent;
  white-space: nowrap;
  box-sizing: border-box;
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
  background-color: color-mix(in srgb, var(--color-danger) 15%, transparent);
  color: var(--color-danger);
}
.variant-outline {
  border-color: var(--color-border);
  color: var(--color-fg);
  background-color: transparent;
}
.variant-ghost {
  color: var(--color-fg-muted);
  background-color: transparent;
}
.variant-link {
  color: var(--color-primary);
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
