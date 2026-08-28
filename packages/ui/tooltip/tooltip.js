import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-block;
  position: relative;
}
.tooltip-box {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-fg);
  padding: 0.25rem 0.625rem;
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
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
    trigger?.addEventListener("focusin", () => box?.removeAttribute("hidden"));
    trigger?.addEventListener("focusout", () => box?.setAttribute("hidden", ""));

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-tooltip")) customElements.define("ds-tooltip", DsTooltip);
