import { attachStyles } from "../base.js";

const css = `
:host { display: inline-block; }
.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1-5, 0.375rem);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  user-select: none;
  padding: 0 0.625rem;
  height: 2rem;
  background-color: transparent;
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.toggle-btn:hover {
  background-color: var(--color-muted);
}
.toggle-btn:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.toggle-btn--pressed {
  background-color: var(--color-muted);
  color: var(--color-fg);
  font-weight: 600;
}
.variant-outline {
  border-color: var(--color-input);
}
.variant-outline.toggle-btn--pressed {
  background-color: var(--color-muted);
}
.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

export class DsToggle extends HTMLElement {
  static get observedAttributes() {
    return ["pressed", "variant", "disabled"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get pressed() {
    return this.hasAttribute("pressed");
  }
  set pressed(val) {
    if (val) this.setAttribute("pressed", "");
    else this.removeAttribute("pressed");
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const pressed = this.pressed;
    const variant = this.getAttribute("variant") || "default";
    const disabled = this.hasAttribute("disabled");

    this.shadowRoot.innerHTML = `
      <button
        data-slot="toggle"
        type="button"
        aria-pressed="${pressed}"
        class="toggle-btn variant-${variant} ${pressed ? "toggle-btn--pressed" : ""}"
        ${disabled ? "disabled" : ""}
      >
        <slot></slot>
      </button>
    `;

    this.shadowRoot.querySelector("button")?.addEventListener("click", () => {
      if (disabled) return;
      this.pressed = !this.pressed;
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { pressed: this.pressed }, bubbles: true }),
      );
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-toggle")) customElements.define("ds-toggle", DsToggle);
