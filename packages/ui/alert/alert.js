import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: block;
}
.alert {
  position: relative;
  width: 100%;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-sm);
  background-color: var(--color-card);
  color: var(--color-card-fg);
}
.variant-destructive {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
`;

export class DsAlert extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "icon"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const variant = this.getAttribute("variant") || "default";
    const icon = this.getAttribute("icon") || (variant === "destructive" ? "alert-circle" : "info");

    this.shadowRoot.innerHTML = `
      <div data-slot="alert" class="alert variant-${variant}" role="alert">
        <span class="icon-wrap">${createIcon(icon)}</span>
        <div style="flex: 1;">
          <slot></slot>
        </div>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-alert")) customElements.define("ds-alert", DsAlert);
