import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 16rem;
  padding: var(--space-8);
  gap: var(--space-3);
  border-radius: var(--ds-card-radius, var(--radius-lg));
  background-color: var(--color-card);
  border: var(--ds-card-border, 1px solid var(--color-border));
}
.icon-box {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-fg-muted);
}
.title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-fg);
}
.desc {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}
`;

export class DsPagePlaceholder extends HTMLElement {
  static get observedAttributes() {
    return ["title", "description", "icon"];
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
    const icon = this.getAttribute("icon") || "code";
    const title = this.getAttribute("title") || "未实现占位";
    const description = this.getAttribute("description") || "该页面正在开发中";

    this.shadowRoot.innerHTML = `
      <div class="placeholder">
        <div class="icon-box">${createIcon(icon)}</div>
        <div class="title">${title}</div>
        <div class="desc">${description}</div>
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-page-placeholder")) {
  customElements.define("ds-page-placeholder", DsPagePlaceholder);
}
