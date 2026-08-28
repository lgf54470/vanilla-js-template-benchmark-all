import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: inline-block; }
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  white-space: nowrap;
  border-radius: var(--ds-btn-radius, var(--radius-md));
  font-weight: 500;
  user-select: none;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.btn:disabled { pointer-events: none; opacity: 0.5; }
.btn--sm { height: 2rem; padding-inline: var(--space-3); font-size: var(--text-xs); }
.btn--md { height: 2.25rem; padding-inline: var(--space-4); font-size: var(--text-sm); }
.btn--lg { height: 2.75rem; padding-inline: var(--space-6); font-size: var(--text-base); }
.btn--primary { background-color: var(--color-primary); color: var(--color-primary-fg); }
.btn--secondary { background-color: var(--color-secondary); color: var(--color-secondary-fg); }
.btn--outline { border-color: var(--color-border); background-color: transparent; color: var(--color-fg); }
.btn--ghost { background-color: transparent; color: var(--color-fg); }
.btn--danger { background-color: var(--color-danger); color: var(--color-danger-fg); }
.btn--icon-sm { width: 2rem; height: 2rem; padding: 0; }
.btn--icon-md { width: 2.25rem; height: 2.25rem; padding: 0; }
.btn--icon-lg { width: 2.75rem; height: 2.75rem; padding: 0; }
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

  get variant() {
    return this.getAttribute("variant") || "primary";
  }
  set variant(v) {
    this.setAttribute("variant", v);
  }

  get size() {
    return this.getAttribute("size") || "md";
  }
  set size(v) {
    this.setAttribute("size", v);
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(v) {
    if (v) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  render() {
    const iconName = this.getAttribute("icon");
    const iconHtml = iconName ? createIcon(iconName) : "";

    this.shadowRoot.innerHTML = `
      <button class="btn btn--${this.variant} btn--${this.size}" ${
      this.disabled ? "disabled" : ""
    } type="${this.getAttribute("type") || "button"}">
        ${iconHtml}
        <slot></slot>
      </button>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

export class DsIconButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "icon", "aria-label", "title"];
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
    return this.getAttribute("variant") || "ghost";
  }
  get size() {
    return this.getAttribute("size") || "md";
  }
  get icon() {
    return this.getAttribute("icon") || "";
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }

  render() {
    const label = this.getAttribute("aria-label") || this.getAttribute("title") || "";
    this.shadowRoot.innerHTML = `
      <button class="btn btn--${this.variant} btn--icon-${this.size}" ${
      this.disabled ? "disabled" : ""
    } aria-label="${label}" title="${this.getAttribute("title") || label}">
        ${this.icon ? createIcon(this.icon) : ""}
        <slot></slot>
      </button>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-button")) customElements.define("ds-button", DsButton);
if (!customElements.get("ds-icon-button")) customElements.define("ds-icon-button", DsIconButton);
