import { attachStyles } from "../base.js";

const css = `
:host { display: inline-block; position: relative; }
.hover-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: 16rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-fg);
  padding: 0.625rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}
.hover-panel[hidden] { display: none !important; }
`;

export class DsHoverCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="hover-card-trigger" class="trigger-wrap">
        <slot name="trigger"></slot>
      </div>
      <div data-slot="hover-card" class="hover-panel" hidden>
        <slot></slot>
      </div>
    `;

    const trigger = this.shadowRoot.querySelector(".trigger-wrap");
    const panel = this.shadowRoot.querySelector(".hover-panel");

    trigger?.addEventListener("mouseenter", () => panel?.removeAttribute("hidden"));
    trigger?.addEventListener("mouseleave", () => panel?.setAttribute("hidden", ""));
    trigger?.addEventListener("focusin", () => panel?.removeAttribute("hidden"));
    trigger?.addEventListener("focusout", () => panel?.setAttribute("hidden", ""));

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-hover-card")) customElements.define("ds-hover-card", DsHoverCard);
