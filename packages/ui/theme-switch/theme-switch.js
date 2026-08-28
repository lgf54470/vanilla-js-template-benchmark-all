import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.capsule {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-muted);
  padding: 0.125rem;
  border-radius: var(--radius-full);
  gap: 0.125rem;
  border: 1px solid var(--color-border);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-full);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
  transition: all 0.15s ease;
}
.btn:hover {
  color: var(--color-fg);
}
.btn--active {
  background-color: var(--color-card);
  color: var(--color-fg);
  box-shadow: var(--shadow-xs);
}
`;

export class DsThemeSwitch extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._value = "system";
  }

  get value() {
    return this.getAttribute("value") || this._value;
  }
  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const cur = this.value;

    this.shadowRoot.innerHTML = `
      <div data-slot="theme-switch" class="capsule">
        <button class="btn ${
      cur === "system" ? "btn--active" : ""
    }" data-val="system" type="button" title="跟随系统">
          ${createIcon("monitor")}
        </button>
        <button class="btn ${
      cur === "light" ? "btn--active" : ""
    }" data-val="light" type="button" title="浅色模式">
          ${createIcon("sun")}
        </button>
        <button class="btn ${
      cur === "dark" ? "btn--active" : ""
    }" data-val="dark" type="button" title="深色模式">
          ${createIcon("moon")}
        </button>
      </div>
    `;

    this.shadowRoot.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-val");
        this.value = val;
        this.dispatchEvent(new CustomEvent("ds-theme-change", { detail: { value: val } }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-theme-switch")) customElements.define("ds-theme-switch", DsThemeSwitch);
