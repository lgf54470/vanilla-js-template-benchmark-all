import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: inline-block;
  box-sizing: border-box;
}
:host([hidden]) {
  display: none !important;
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
  width: 100%;
  height: 100%;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.btn:active:not(:disabled) {
  transform: translateY(1px);
}
.btn:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.btn:disabled, .btn[aria-disabled="true"] {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants (Nova Base UI standard) */
.variant-default {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
}
.variant-default:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-primary) 85%, black);
}
.variant-destructive {
  background-color: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
  border-color: transparent;
}
.variant-destructive:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-danger) 22%, transparent);
}
.variant-outline {
  border-color: var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-fg);
}
.variant-outline:hover:not(:disabled) {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
.variant-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-fg);
}
.variant-secondary:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-secondary) 85%, var(--color-fg));
}
.variant-ghost {
  color: var(--color-fg);
  background-color: transparent;
}
.variant-ghost:hover:not(:disabled) {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
.variant-link {
  color: var(--color-primary);
  background-color: transparent;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.variant-link:hover:not(:disabled) {
  text-decoration: underline;
}

/* Sizing tiers (Official Shadcn Nova specification) */
.size-xs {
  height: 1.5rem;
  padding: 0 0.5rem;
  font-size: var(--text-xs);
  border-radius: min(var(--radius-md), 10px);
}
.size-sm {
  height: 1.75rem;
  padding: 0 0.625rem;
  font-size: 0.8rem;
  border-radius: min(var(--radius-md), 12px);
}
.size-default {
  height: 2rem;
  padding: 0 0.625rem;
  font-size: var(--text-sm);
  border-radius: var(--radius-lg);
}
.size-lg {
  height: 2.25rem;
  padding: 0 0.75rem;
  font-size: var(--text-sm);
  border-radius: var(--radius-lg);
}
.size-icon-xs {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border-radius: min(var(--radius-md), 10px);
}
.size-icon-sm {
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border-radius: min(var(--radius-md), 12px);
}
.size-icon {
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: var(--radius-lg);
}
.size-icon-lg {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border-radius: var(--radius-lg);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.size-xs .btn-icon, .size-icon-xs .btn-icon {
  width: 0.75rem;
  height: 0.75rem;
}
.size-sm .btn-icon, .size-icon-sm .btn-icon {
  width: 0.875rem;
  height: 0.875rem;
}
.size-default .btn-icon, .size-icon .btn-icon, .size-lg .btn-icon, .size-icon-lg .btn-icon {
  width: 1rem;
  height: 1rem;
}
`;

export class DsButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "icon", "icon-position", "type"];
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
    const iconPos = this.getAttribute("icon-position") || "start";
    const type = this.getAttribute("type") || "button";

    const iconHtml = icon ? `<span class="btn-icon">${createIcon(icon)}</span>` : "";

    this.shadowRoot.innerHTML = `
      <button
        data-slot="button"
        class="btn variant-${variant} size-${size}"
        type="${type}"
        ${disabled ? "disabled" : ""}
      >
        ${iconPos === "start" ? iconHtml : ""}
        <slot></slot>
        ${iconPos === "end" ? iconHtml : ""}
      </button>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-button")) customElements.define("ds-button", DsButton);
