import { attachStyles, createIcon } from "../base.js";

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
  background-color: transparent;
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.toggle-btn:hover:not(:disabled) {
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
.size-default {
  height: 2rem;
  padding: 0 0.625rem;
}
.size-sm {
  height: 1.75rem;
  padding: 0 0.5rem;
  font-size: var(--text-xs);
}
.size-lg {
  height: 2.25rem;
  padding: 0 0.75rem;
}
.size-icon {
  width: 2rem;
  height: 2rem;
  padding: 0;
}
.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}
`;

export class DsToggle extends HTMLElement {
  static get observedAttributes() {
    return ["pressed", "variant", "size", "disabled", "icon", "value"];
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

  get value() {
    return this.getAttribute("value") || "";
  }
  set value(val) {
    this.setAttribute("value", val);
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
    const size = this.getAttribute("size") || "default";
    const disabled = this.hasAttribute("disabled");
    const icon = this.getAttribute("icon");

    this.shadowRoot.innerHTML = `
      <button
        data-slot="toggle"
        type="button"
        aria-pressed="${pressed}"
        class="toggle-btn variant-${variant} size-${size} ${pressed ? "toggle-btn--pressed" : ""}"
        ${disabled ? "disabled" : ""}
      >
        ${icon ? `<span class="toggle-icon">${createIcon(icon)}</span>` : ""}
        <slot></slot>
      </button>
    `;

    this.shadowRoot.querySelector("button")?.addEventListener("click", () => {
      if (disabled) return;
      this.pressed = !this.pressed;
      this.dispatchEvent(
        new CustomEvent("ds-change", {
          detail: { pressed: this.pressed, value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-toggle")) customElements.define("ds-toggle", DsToggle);
