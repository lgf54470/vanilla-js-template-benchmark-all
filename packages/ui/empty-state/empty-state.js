import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: block;
}
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  border-radius: var(--radius-xl);
  border: 1px dashed var(--color-border);
  background-color: var(--color-card);
  gap: var(--space-3);
  box-sizing: border-box;
}
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-muted);
  color: var(--color-fg);
}
.title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
}
.desc {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  max-width: 24rem;
  line-height: 1.4;
}
`;

export class DsEmptyState extends HTMLElement {
  static get observedAttributes() {
    return ["icon", "title", "description"];
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
    const icon = this.getAttribute("icon") || "inbox";
    const title = this.getAttribute("title") || "暂无数据";
    const description = this.getAttribute("description") || "";

    this.shadowRoot.innerHTML = `
      <div data-slot="empty" class="empty-box">
        <div data-slot="empty-icon" class="icon-wrap">${createIcon(icon)}</div>
        <div data-slot="empty-title" class="title">${title}</div>
        ${description ? `<div data-slot="empty-description" class="desc">${description}</div>` : ""}
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-empty-state")) customElements.define("ds-empty-state", DsEmptyState);
