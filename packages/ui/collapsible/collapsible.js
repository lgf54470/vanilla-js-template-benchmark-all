import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: block;
}
.default-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-input);
  background-color: transparent;
  color: var(--color-fg);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.default-trigger:hover {
  background-color: var(--color-muted);
}
.default-trigger:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
  transition: transform 0.2s ease;
}
.default-trigger[aria-expanded="true"] .chevron {
  transform: rotate(180deg);
}
.collapsible-content[hidden] {
  display: none !important;
}
`;

export class DsCollapsible extends HTMLElement {
  static get observedAttributes() {
    return ["open", "title"];
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
      <div data-slot="collapsible">
        <div data-slot="collapsible-trigger" class="trigger-wrap">
          <slot name="trigger">
            ${
      title
        ? `
              <button type="button" class="default-trigger" aria-expanded="${open}">
                <span>${title}</span>
                <span class="chevron">${createIcon("chevron-down")}</span>
              </button>
            `
        : ""
    }
          </slot>
        </div>
        <div data-slot="collapsible-content" class="collapsible-content" ${!open ? "hidden" : ""}>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector(".trigger-wrap")?.addEventListener("click", () => {
      this.open = !this.open;
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { open: this.open }, bubbles: true }),
      );
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-collapsible")) customElements.define("ds-collapsible", DsCollapsible);
