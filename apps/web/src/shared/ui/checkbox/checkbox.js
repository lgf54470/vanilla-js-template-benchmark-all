import { attachStyles, createIcon } from "../base.js";

const cbCss = `
:host { display: inline-flex; align-items: center; cursor: pointer; }
.checkbox-container {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  user-select: none;
  font-size: var(--text-sm);
  color: var(--color-fg);
}
.checkbox-box {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
}
:host([checked]) .checkbox-box {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-fg);
}
:host(:focus-visible) .checkbox-box {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.icon { display: none; }
:host([checked]) .icon { display: block; }
`;

export class DsCheckbox extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "disabled"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.setAttribute("tabindex", this.hasAttribute("disabled") ? "-1" : "0");
    this.setAttribute("role", "checkbox");
    this.setAttribute("aria-checked", this.checked ? "true" : "false");
    this.render();

    this.addEventListener("click", () => this.toggle());
    this.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(v) {
    if (v) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
    this.setAttribute("aria-checked", v ? "true" : "false");
    this.render();
  }

  toggle() {
    if (this.hasAttribute("disabled")) return;
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent("ds-change", { detail: { checked: this.checked }, bubbles: true }),
    );
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="checkbox-container">
        <span class="checkbox-box">${createIcon("check")}</span>
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, cbCss);
  }
}

const switchCss = `
:host { display: inline-flex; align-items: center; cursor: pointer; }
.switch-track {
  width: 2.25rem;
  height: 1.25rem;
  display: inline-flex;
  align-items: center;
  padding: 0.125rem;
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  border: 1px solid var(--color-border);
}
:host([checked]) .switch-track {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
.switch-thumb {
  width: 1rem;
  height: 1rem;
  border-radius: var(--radius-full);
  background-color: var(--color-bg);
  box-shadow: var(--shadow-xs);
  transform: translateX(0);
}
:host([checked]) .switch-thumb {
  transform: translateX(1rem);
  background-color: var(--color-primary-fg);
}
:host(:focus-visible) .switch-track {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
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

  connectedCallback() {
    this.setAttribute("tabindex", this.hasAttribute("disabled") ? "-1" : "0");
    this.setAttribute("role", "switch");
    this.setAttribute("aria-checked", this.checked ? "true" : "false");
    this.render();

    this.addEventListener("click", () => this.toggle());
    this.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(v) {
    if (v) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
    this.setAttribute("aria-checked", v ? "true" : "false");
    this.render();
  }

  toggle() {
    if (this.hasAttribute("disabled")) return;
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent("ds-change", { detail: { checked: this.checked }, bubbles: true }),
    );
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="switch-track">
        <span class="switch-thumb"></span>
      </div>
      <slot></slot>
    `;
    attachStyles(this.shadowRoot, switchCss);
  }
}

if (!customElements.get("ds-checkbox")) customElements.define("ds-checkbox", DsCheckbox);
if (!customElements.get("ds-switch")) customElements.define("ds-switch", DsSwitch);
