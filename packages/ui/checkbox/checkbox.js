import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  font-size: var(--text-sm);
  color: var(--color-fg);
  line-height: 1.25;
}
:host([disabled]) {
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}
.checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.checkbox-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border-radius: 4px;
  border: 1px solid var(--color-input);
  background-color: var(--color-card);
  color: var(--color-primary-fg);
  cursor: pointer;
  padding: 0;
  margin: 0;
  outline: none;
  box-sizing: border-box;
}
.checkbox-root:hover:not(:disabled) {
  border-color: var(--color-fg-muted);
}
.checkbox-root:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.checkbox-root--checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-fg);
}
.checkbox-root--checked:hover:not(:disabled) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
.indicator {
  display: none;
  width: 0.875rem;
  height: 0.875rem;
  align-items: center;
  justify-content: center;
  color: currentColor;
}
.checkbox-root--checked .indicator {
  display: flex;
}
.label-text {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
  line-height: 1.25;
}
`;

export class DsCheckbox extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "disabled", "label"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  get checked() {
    return this.hasAttribute("checked");
  }

  set checked(val) {
    if (val) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(val) {
    if (val) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  connectedCallback() {
    this.render();
    this.addEventListener("click", this._handleClick);
    this.addEventListener("keydown", this._handleKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._handleClick);
    this.removeEventListener("keydown", this._handleKeydown);
  }

  attributeChangedCallback() {
    this.render();
  }

  _handleClick(e) {
    if (this.disabled) return;
    // Don't toggle twice if clicking directly on button inside shadow
    if (e.composedPath().includes(this.shadowRoot.querySelector(".checkbox-root"))) {
      // Proceed
    }
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent("ds-change", { detail: { checked: this.checked }, bubbles: true }),
    );
  }

  _handleKeydown(e) {
    if (this.disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.checked = !this.checked;
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { checked: this.checked }, bubbles: true }),
      );
    }
  }

  render() {
    const checked = this.checked;
    const disabled = this.disabled;
    const label = this.getAttribute("label") || "";

    this.shadowRoot.innerHTML = `
      <div class="checkbox-wrap">
        <button
          data-slot="checkbox"
          type="button"
          role="checkbox"
          aria-checked="${checked}"
          class="checkbox-root ${checked ? "checkbox-root--checked" : ""}"
          tabindex="${disabled ? "-1" : "0"}"
          ${disabled ? "disabled" : ""}
        >
          <span data-slot="checkbox-indicator" class="indicator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
          </span>
        </button>
        ${label ? `<span class="label-text">${label}</span>` : ""}
        <slot></slot>
      </div>
    `;

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-checkbox")) customElements.define("ds-checkbox", DsCheckbox);
