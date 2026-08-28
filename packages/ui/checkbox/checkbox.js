import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: inline-flex;
  align-items: center;
}
.checkbox-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-primary);
  background-color: var(--color-card);
  color: var(--color-primary-fg);
  cursor: pointer;
  padding: 0;
  outline: none;
}
.checkbox-btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.checkbox-btn--checked {
  background-color: var(--color-primary);
}
.checkbox-btn--checked .check-icon {
  display: block;
}
.check-icon {
  display: none;
  width: 0.75rem;
  height: 0.75rem;
}
`;

export class DsCheckbox extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "disabled"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get checked() {
    return this.hasAttribute("checked");
  }

  set checked(val) {
    if (val) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const checked = this.checked;
    const disabled = this.hasAttribute("disabled");

    this.shadowRoot.innerHTML = `
      <button
        data-slot="checkbox"
        type="button"
        role="checkbox"
        aria-checked="${checked}"
        class="checkbox-btn ${checked ? "checkbox-btn--checked" : ""}"
        ${disabled ? "disabled" : ""}
      >
        <span class="check-icon">${createIcon("check")}</span>
      </button>
    `;

    this.shadowRoot.querySelector(".checkbox-btn")?.addEventListener("click", () => {
      if (disabled) return;
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent("ds-change", { detail: { checked: this.checked } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-checkbox")) customElements.define("ds-checkbox", DsCheckbox);
