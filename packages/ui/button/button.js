import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  white-space: nowrap;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  user-select: none;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}
.btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.btn:disabled, .btn[aria-disabled="true"] {
  pointer-events: none;
  opacity: 0.5;
}

/* Variants (Base UI standard) */
.variant-default {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
}
.variant-default:hover {
  opacity: 0.9;
}
.variant-destructive {
  background-color: var(--color-danger);
  color: var(--color-danger-fg);
}
.variant-destructive:hover {
  opacity: 0.9;
}
.variant-outline {
  border-color: var(--color-border);
  background-color: var(--color-card);
  color: var(--color-fg);
}
.variant-outline:hover {
  background-color: var(--color-muted);
}
.variant-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-fg);
}
.variant-secondary:hover {
  opacity: 0.85;
}
.variant-ghost {
  color: var(--color-fg);
  background-color: transparent;
}
.variant-ghost:hover {
  background-color: var(--color-muted);
}
.variant-link {
  color: var(--color-primary);
  background-color: transparent;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.variant-link:hover {
  text-decoration: underline;
}

/* Sizes */
.size-default {
  height: 2.25rem;
  padding: 0 var(--space-4);
}
.size-sm {
  height: 1.75rem;
  padding: 0 var(--space-3);
  font-size: var(--text-xs);
}
.size-lg {
  height: 2.75rem;
  padding: 0 var(--space-6);
  font-size: var(--text-base);
}
.size-icon {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}
.size-icon-sm {
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
}
.size-icon-lg {
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
}
`;

export class DsButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "icon", "type"];
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
    const size = this.getAttribute("size") || "default";
    const disabled = this.hasAttribute("disabled");
    const icon = this.getAttribute("icon");
    const type = this.getAttribute("type") || "button";

    this.shadowRoot.innerHTML = `
      <button
        data-slot="button"
        class="btn variant-${variant} size-${size}"
        type="${type}"
        ${disabled ? "disabled" : ""}
      >
        ${icon ? createIcon(icon) : ""}
        <slot></slot>
      </button>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-button")) customElements.define("ds-button", DsButton);
