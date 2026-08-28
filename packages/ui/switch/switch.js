import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-flex;
  align-items: center;
}
.switch-track {
  display: inline-flex;
  align-items: center;
  width: 2rem;
  height: 1.15rem;
  border-radius: var(--radius-full);
  background-color: var(--color-input);
  cursor: pointer;
  padding: 2px;
  border: 1px solid transparent;
  outline: none;
}
.switch-track:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.switch-track--checked {
  background-color: var(--color-primary);
}
.switch-thumb {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: var(--radius-full);
  background-color: var(--color-bg);
  box-shadow: var(--shadow-xs);
  transform: translateX(0);
}
.switch-track--checked .switch-thumb {
  transform: translateX(0.85rem);
}
`;

export class DsSwitch extends HTMLElement {
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
        data-slot="switch"
        type="button"
        role="switch"
        aria-checked="${checked}"
        class="switch-track ${checked ? "switch-track--checked" : ""}"
        ${disabled ? "disabled" : ""}
      >
        <span class="switch-thumb"></span>
      </button>
    `;

    this.shadowRoot.querySelector(".switch-track")?.addEventListener("click", () => {
      if (disabled) return;
      this.checked = !this.checked;
      this.dispatchEvent(new CustomEvent("ds-change", { detail: { checked: this.checked } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-switch")) customElements.define("ds-switch", DsSwitch);
