import { attachStyles } from "../base.js";
const css =
  `:host { display: block; } .bubble { display: inline-block; padding: var(--space-3) var(--space-4); border-radius: var(--radius-xl); font-size: var(--text-sm); max-width: 80%; } .role-user { background-color: var(--color-primary); color: var(--color-primary-fg); border-bottom-right-radius: var(--radius-xs); } .role-assistant { background-color: var(--color-muted); color: var(--color-fg); border-bottom-left-radius: var(--radius-xs); }`;
export class DsBubble extends HTMLElement {
  static get observedAttributes() {
    return ["role"];
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    const role = this.getAttribute("role") || "assistant";
    this.shadowRoot.innerHTML =
      `<div data-slot="bubble" class="bubble role-${role}"><slot></slot></div>`;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-bubble")) customElements.define("ds-bubble", DsBubble);
