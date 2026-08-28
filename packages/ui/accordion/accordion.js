import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: block;
}
.accordion-item {
  border-bottom: 1px solid var(--color-border);
}
.trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-4) 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
}
.trigger:hover {
  text-decoration: underline;
}
.chevron {
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
  transition: transform 0.2s ease;
}
.trigger[aria-expanded="true"] .chevron {
  transform: rotate(180deg);
}
.content {
  overflow: hidden;
  padding-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}
.content[hidden] {
  display: none !important;
}
`;

export class DsAccordionItem extends HTMLElement {
  static get observedAttributes() {
    return ["title", "open"];
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
    this.render();
  }

  render() {
    const title = this.getAttribute("title") || "";
    const open = this.open;

    this.shadowRoot.innerHTML = `
      <div data-slot="accordion-item" class="accordion-item">
        <button data-slot="accordion-trigger" class="trigger" type="button" aria-expanded="${open}">
          <span>${title}</span>
          <span class="chevron">${createIcon("chevron-down")}</span>
        </button>
        <div data-slot="accordion-content" class="content" ${!open ? "hidden" : ""}>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".trigger")?.addEventListener("click", () => {
      this.open = !this.open;
      this.dispatchEvent(new CustomEvent("ds-toggle", { detail: { open: this.open } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-accordion-item")) {
  customElements.define("ds-accordion-item", DsAccordionItem);
}
