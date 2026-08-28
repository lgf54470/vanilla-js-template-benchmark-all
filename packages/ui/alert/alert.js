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
  padding: 0.5rem 0.625rem;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  background-color: var(--color-card);
  color: var(--color-fg);
  box-sizing: border-box;
}
.variant-default {
  border-color: var(--color-border);
  background-color: var(--color-card);
}
.variant-destructive {
  border-color: var(--color-danger);
  background-color: var(--color-card);
  color: var(--color-danger);
}
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
}
.content-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.alert-title {
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.3;
}
.alert-desc {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  line-height: 1.4;
}
.variant-destructive .alert-desc {
  color: color-mix(in srgb, var(--color-danger) 85%, var(--color-fg));
}
`;

export class DsAlert extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "icon", "title", "description"];
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

  render() {
    const variant = this.getAttribute("variant") || "default";
    const title = this.getAttribute("title");
    const description = this.getAttribute("description");
    const icon = this.getAttribute("icon") || (variant === "destructive" ? "alert-circle" : "info");

    this.shadowRoot.innerHTML = `
      <div data-slot="alert" class="alert variant-${variant}" role="alert">
        <span class="icon-wrap">${createIcon(icon)}</span>
        <div class="content-wrap">
          ${title ? `<div data-slot="alert-title" class="alert-title">${title}</div>` : ""}
          ${
      description
        ? `<div data-slot="alert-description" class="alert-desc">${description}</div>`
        : ""
    }
          <slot></slot>
        </div>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-alert")) customElements.define("ds-alert", DsAlert);
