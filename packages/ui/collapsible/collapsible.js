import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.collapsible-content[hidden] {
  display: none !important;
}
`;

export class DsCollapsible extends HTMLElement {
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
    const content = this.shadowRoot.querySelector(".collapsible-content");
    if (content) {
      if (this.open) content.removeAttribute("hidden");
      else content.setAttribute("hidden", "");
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div data-slot="collapsible">
        <div data-slot="collapsible-trigger" class="trigger-wrap">
          <slot name="trigger"></slot>
        </div>
        <div data-slot="collapsible-content" class="collapsible-content" ${
      !this.open ? "hidden" : ""
    }>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".trigger-wrap")?.addEventListener("click", () => {
      this.open = !this.open;
      this.dispatchEvent(new CustomEvent("ds-change", { detail: { open: this.open } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-collapsible")) customElements.define("ds-collapsible", DsCollapsible);
