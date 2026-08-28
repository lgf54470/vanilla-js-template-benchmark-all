import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.switch-track {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 32px;
  height: 18.4px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background-color: var(--color-input);
  cursor: pointer;
  padding: 2px;
  border: 1px solid transparent;
  outline: none;
  box-sizing: border-box;
  user-select: none;
  transition: background-color 0.15s ease;
}
.switch-track:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.switch-track:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
.switch-track--checked {
  background-color: var(--color-primary);
}
.switch-thumb {
  display: block;
  width: 13px;
  height: 13px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transform: translateX(0);
  pointer-events: none;
}
.switch-track--checked .switch-thumb {
  transform: translateX(13px);
}
`;

export class DsSwitch extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "disabled"];
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
  }

  attributeChangedCallback() {
    this.render();
  }

  _handleClick() {
    if (this.disabled) return;
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

    this.shadowRoot.innerHTML = `
      <button
        data-slot="switch"
        type="button"
        role="switch"
        aria-checked="${checked}"
        class="switch-track ${checked ? "switch-track--checked" : ""}"
        tabindex="${disabled ? "-1" : "0"}"
        ${disabled ? "disabled" : ""}
      >
        <span data-slot="switch-thumb" class="switch-thumb"></span>
      </button>
    `;

    this.shadowRoot.querySelector(".switch-track")?.addEventListener("click", this._handleClick);
    this.shadowRoot.querySelector(".switch-track")?.addEventListener(
      "keydown",
      this._handleKeydown,
    );

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-switch")) customElements.define("ds-switch", DsSwitch);
