import { attachStyles } from "../base.js";

const css = `
:host { display: inline-block; position: relative; }
.hover-panel {
  position: absolute;
  top: calc(100% + var(--space-2));
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: 16rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
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

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-hover-card")) customElements.define("ds-hover-card", DsHoverCard);
