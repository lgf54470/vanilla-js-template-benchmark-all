import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1-5, 0.375rem);
  white-space: nowrap;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  user-select: none;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.btn:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.btn:disabled, .btn[aria-disabled="true"] {
  pointer-events: none;
  opacity: 0.5;
}

/* Variants (Nova Base UI standard) */
.variant-default {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
}
.variant-default:hover {
  background-color: color-mix(in srgb, var(--color-primary) 85%, black);
}
.variant-destructive {
  background-color: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
  border-color: transparent;
}
.variant-destructive:hover {
  background-color: color-mix(in srgb, var(--color-danger) 22%, transparent);
}
.variant-outline {
  border-color: var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-fg);
}
.variant-outline:hover {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
.variant-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-fg);
}
.variant-secondary:hover {
  background-color: color-mix(in srgb, var(--color-secondary) 85%, var(--color-fg));
}
.variant-ghost {
  color: var(--color-fg);
  background-color: transparent;
}
.variant-ghost:hover {
  background-color: var(--color-muted);
  color: var(--color-fg);
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

/* Sizes (Nova Base UI standard: h-8 default, h-7 sm, h-9 lg) */
.size-default {
  height: 2rem;
  padding: 0 0.625rem;
  font-size: var(--text-sm);
}
.size-sm {
  height: 1.75rem;
  padding: 0 0.625rem;
  font-size: 0.8rem;
}
.size-lg {
  height: 2.25rem;
  padding: 0 0.75rem;
  font-size: var(--text-sm);
}
.size-icon {
  width: 2rem;
  height: 2rem;
  padding: 0;
}
.size-icon-sm {
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
}
.size-icon-lg {
  width: 2.25rem;
  height: 2.25rem;
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
