import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-block;
  position: relative;
}
.tooltip-box {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
  padding: 0.25rem 0.5rem;
  font-size: var(--text-2xs);
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--shadow-sm);
}
.tooltip-box[hidden] {
  display: none !important;
}
`;

export class DsTooltip extends HTMLElement {
  static get observedAttributes() {
    return ["content"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const content = this.getAttribute("content") || "";

    this.shadowRoot.innerHTML = `
      <div data-slot="tooltip-trigger" class="trigger-wrap">
        <slot></slot>
      </div>
      <div data-slot="tooltip" class="tooltip-box" hidden>${content}</div>
    `;

    const trigger = this.shadowRoot.querySelector(".trigger-wrap");
    const box = this.shadowRoot.querySelector(".tooltip-box");

    trigger?.addEventListener("mouseenter", () => box?.removeAttribute("hidden"));
    trigger?.addEventListener("mouseleave", () => box?.setAttribute("hidden", ""));
    trigger?.addEventListener("focus", () => box?.removeAttribute("hidden"));
    trigger?.addEventListener("blur", () => box?.setAttribute("hidden", ""));

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-tooltip")) customElements.define("ds-tooltip", DsTooltip);
