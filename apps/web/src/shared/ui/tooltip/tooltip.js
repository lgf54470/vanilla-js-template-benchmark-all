import { attachStyles } from "../base.js";

const css = `
:host {
  position: relative;
  display: inline-block;
}
.tooltip-box {
  position: absolute;
  z-index: var(--z-dropdown);
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
  font-size: var(--text-xs);
  padding-block: var(--space-1);
  padding-inline: var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  display: none;
}
:host(:hover) .tooltip-box, :host(:focus-within) .tooltip-box {
  opacity: 1;
  display: block;
}
.tooltip--top { bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-0.25rem); }
.tooltip--right { left: 100%; top: 50%; transform: translateY(-50%) translateX(0.5rem); }
.tooltip--bottom { top: 100%; left: 50%; transform: translateX(-50%) translateY(0.25rem); }
.tooltip--left { right: 100%; top: 50%; transform: translateY(-50%) translateX(-0.5rem); }
`;

export class DsTooltip extends HTMLElement {
  static get observedAttributes() {
    return ["content", "side"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }

  get content() {
    return this.getAttribute("content") || "";
  }
  get side() {
    return this.getAttribute("side") || "right";
  }

  render() {
    this.shadowRoot.innerHTML = `
      <slot></slot>
      <div class="tooltip-box tooltip--${this.side}">${this.content}</div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-tooltip")) customElements.define("ds-tooltip", DsTooltip);
