import { attachStyles } from "../base.js";

const css = `
:host { display: inline-flex; }
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--ds-badge-radius, var(--radius-sm));
  padding-block: 0.125rem;
  padding-inline: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: var(--leading-none);
  border: 1px solid transparent;
}
.badge--default { background-color: var(--color-secondary); color: var(--color-secondary-fg); }
.badge--primary { background-color: var(--color-primary); color: var(--color-primary-fg); }
.badge--success { background-color: var(--color-success); color: var(--color-success-fg); }
.badge--danger { background-color: var(--color-danger); color: var(--color-danger-fg); }
.badge--warning { background-color: var(--color-warning); color: var(--color-warning-fg); }
.badge--outline { border-color: var(--color-border); background-color: transparent; color: var(--color-fg); }
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

  get variant() {
    return this.getAttribute("variant") || "default";
  }

  render() {
    this.shadowRoot.innerHTML = `
      <span class="badge badge--${this.variant}">
        <slot></slot>
      </span>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-badge")) customElements.define("ds-badge", DsBadge);
