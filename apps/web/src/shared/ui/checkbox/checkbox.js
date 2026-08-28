// apps/web/src/shared/ui/checkbox/checkbox.js — <ds-checkbox> / <ds-switch>
import { attachStyles, define } from "../base.js";
import { iconSvg } from "../../lib/icons.js";

const CHECKBOX_CSS = `
:host{display:inline-flex;align-items:center;gap:.5rem;cursor:pointer}
button{display:inline-flex;align-items:center;justify-content:center;
  width:1rem;height:1rem;border-radius:var(--ds-checkbox-radius);
  border:1px solid var(--color-input);background:var(--color-bg);
  color:var(--color-primary-fg);cursor:pointer;flex:none}
button[data-state="checked"]{background:var(--color-primary);border-color:var(--color-primary)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
button:disabled{opacity:.5;cursor:not-allowed}
label{font-size:var(--ds-btn-font-size);cursor:pointer}
::slotted(svg){width:.75rem;height:.75rem}
`;

class DsCheckbox extends HTMLElement {
  static observedAttributes = ["checked", "disabled", "label"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CHECKBOX_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._button) this._render();
  }
  _render() {
    const checked = this.hasAttribute("checked");
    const label = this.getAttribute("label");
    this.shadowRoot.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("role", "checkbox");
    btn.setAttribute("aria-checked", String(checked));
    btn.setAttribute("data-state", checked ? "checked" : "unchecked");
    btn.disabled = this.hasAttribute("disabled");
    if (checked) btn.innerHTML = iconSvg("check", 12);
    btn.addEventListener("click", () => {
      this.toggleAttribute("checked", !this.hasAttribute("checked"));
      this.dispatchEvent(
        new CustomEvent("ds-checkbox-change", {
          bubbles: true,
          detail: { checked: this.hasAttribute("checked") },
        }),
      );
    });
    this.shadowRoot.append(btn);
    if (label) {
      const l = document.createElement("label");
      l.textContent = label;
      this.shadowRoot.append(l);
    }
    this._button = btn;
  }
  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(v) {
    this.toggleAttribute("checked", !!v);
  }
}
define("ds-checkbox", DsCheckbox);

const SWITCH_CSS = `
:host{display:inline-flex;align-items:center;gap:.5rem;cursor:pointer}
button{position:relative;width:2.4rem;height:1.35rem;border-radius:var(--ds-switch-radius);
  background:var(--color-input);cursor:pointer;flex:none}
button[data-state="checked"]{background:var(--color-primary)}
button::after{content:"";position:absolute;top:2px;left:2px;width:calc(1.35rem - 4px);
  height:calc(1.35rem - 4px);border-radius:50%;background:var(--color-primary-fg)}
button[data-state="checked"]::after{left:calc(100% - 1.35rem + 2px)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
button:disabled{opacity:.5;cursor:not-allowed}
label{font-size:var(--ds-btn-font-size);cursor:pointer}
`;

class DsSwitch extends HTMLElement {
  static observedAttributes = ["checked", "disabled", "label"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, SWITCH_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._button) this._render();
  }
  _render() {
    const checked = this.hasAttribute("checked");
    const label = this.getAttribute("label");
    this.shadowRoot.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("role", "switch");
    btn.setAttribute("aria-checked", String(checked));
    btn.setAttribute("data-state", checked ? "checked" : "unchecked");
    btn.disabled = this.hasAttribute("disabled");
    btn.addEventListener("click", () => {
      this.toggleAttribute("checked", !this.hasAttribute("checked"));
      this.dispatchEvent(
        new CustomEvent("ds-switch-change", {
          bubbles: true,
          detail: { checked: this.hasAttribute("checked") },
        }),
      );
    });
    this.shadowRoot.append(btn);
    if (label) {
      const l = document.createElement("label");
      l.textContent = label;
      this.shadowRoot.append(l);
    }
    this._button = btn;
  }
  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(v) {
    this.toggleAttribute("checked", !!v);
  }
}
define("ds-switch", DsSwitch);
