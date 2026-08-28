import { attachStyles } from "../base.js";
import "../dialog/dialog.js";

const css = `
:host { display: contents; }
`;

export class DsAlertDialog extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get open() {
    return this.hasAttribute("open");
  }
  set open(val) {
    if (val) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    const dialog = this.shadowRoot.querySelector("ds-dialog");
    if (dialog) {
      if (this.open) dialog.setAttribute("open", "");
      else dialog.removeAttribute("open");
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <ds-dialog data-slot="alert-dialog" role="alertdialog" ${this.open ? "open" : ""}>
        <slot></slot>
      </ds-dialog>
    `;
    this.shadowRoot.querySelector("ds-dialog")?.addEventListener("ds-close", () => {
      this.open = false;
      this.dispatchEvent(new CustomEvent("ds-close"));
    });
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-alert-dialog")) customElements.define("ds-alert-dialog", DsAlertDialog);
