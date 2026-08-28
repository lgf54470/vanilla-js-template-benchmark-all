import { attachStyles } from "../base.js";

const css = `
:host { display: inline-block; }
.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  user-select: none;
  padding: 0 var(--space-3);
  height: 2.25rem;
  background-color: transparent;
  color: var(--color-fg);
  outline: none;
}
.toggle-btn:hover {
  background-color: var(--color-muted);
}
.toggle-btn:focus-visible {
  outline: 2px solid var(--ring);
}
.toggle-btn--pressed {
  background-color: var(--color-muted);
  color: var(--color-fg);
  font-weight: 600;
}
.variant-outline {
  border-color: var(--color-border);
}
.variant-outline.toggle-btn--pressed {
  background-color: var(--color-muted);
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
      this.dispatchEvent(new CustomEvent("ds-change", { detail: { pressed: this.pressed } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-toggle")) customElements.define("ds-toggle", DsToggle);
