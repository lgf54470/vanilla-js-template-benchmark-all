// apps/web/src/shared/ui/button/button.js — <ds-button> / <ds-icon-button>
import { attachStyles, define } from "../base.js";
import { iconEl } from "../../lib/icons.js";

const CSS = `
:host{display:inline-flex}
button{display:inline-flex;align-items:center;justify-content:center;gap:var(--ds-btn-gap);
  height:var(--ds-btn-height);padding:0 var(--ds-btn-padding-x);
  border-radius:var(--ds-btn-radius);font-size:var(--ds-btn-font-size);
  font-weight:var(--ds-btn-font-weight);line-height:1;white-space:nowrap;
  cursor:pointer;user-select:none}
button[variant="primary"]{background:var(--color-primary);color:var(--color-primary-fg)}
button[variant="secondary"]{background:var(--color-secondary);color:var(--color-secondary-fg)}
button[variant="ghost"]{background:transparent;color:var(--color-fg)}
button[variant="ghost"]:hover,button[variant="secondary"]:hover{background:var(--color-muted)}
button[variant="danger"]{background:var(--color-danger);color:var(--color-danger-fg)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
button:disabled{opacity:.5;cursor:not-allowed}
::slotted(svg){width:1rem;height:1rem}
`;

class DsButton extends HTMLElement {
  static observedAttributes = ["variant", "size", "disabled", "icon"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CSS);
    this._button = null;
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._button) this._render();
  }
  _render() {
    const variant = this.getAttribute("variant") ?? "secondary";
    const icon = this.getAttribute("icon");
    const size = this.getAttribute("size");
    const disabled = this.hasAttribute("disabled");
    this.shadowRoot.innerHTML = "";
    const btn = document.createElement("button");
    btn.setAttribute("variant", variant);
    if (size) btn.setAttribute("size", size);
    btn.disabled = disabled;
    if (disabled) btn.setAttribute("aria-disabled", "true");
    if (icon) {
      const svg = iconEl(icon);
      svg.style.width = "1rem";
      svg.style.height = "1rem";
      btn.append(svg);
    }
    const slot = document.createElement("slot");
    btn.append(slot);
    this.shadowRoot.append(btn);
    this._button = btn;
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(v) {
    this.toggleAttribute("disabled", !!v);
  }
  focus() {
    this._button?.focus();
  }
}
define("ds-button", DsButton);

const ICON_CSS = `
:host{display:inline-flex}
button{display:inline-flex;align-items:center;justify-content:center;
  width:var(--ds-icon-btn-size);height:var(--ds-icon-btn-size);
  border-radius:var(--ds-icon-btn-radius);color:var(--color-fg-muted);
  cursor:pointer}
button:hover{background:var(--color-muted);color:var(--color-fg)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
button:disabled{opacity:.5;cursor:not-allowed}
::slotted(svg){width:1.1rem;height:1.1rem}
`;

class DsIconButton extends HTMLElement {
  static observedAttributes = ["icon", "disabled", "aria-label"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, ICON_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._button) this._render();
  }
  _render() {
    const icon = this.getAttribute("icon");
    const label = this.getAttribute("aria-label") ?? "";
    const disabled = this.hasAttribute("disabled");
    this.shadowRoot.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.disabled = disabled;
    if (label) btn.setAttribute("aria-label", label);
    if (icon) btn.append(iconEl(icon));
    const slot = document.createElement("slot");
    btn.append(slot);
    this.shadowRoot.append(btn);
    this._button = btn;
  }
}
define("ds-icon-button", DsIconButton);
