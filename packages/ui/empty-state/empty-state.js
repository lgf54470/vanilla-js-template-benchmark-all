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
  padding: var(--space-12) var(--space-4);
  text-align: center;
  border-radius: var(--radius-xl);
  border: 1px dashed var(--color-border);
  background-color: var(--color-card);
  gap: var(--space-3);
}
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  color: var(--color-fg-muted);
}
.title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-fg);
}
.desc {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  max-width: 24rem;
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
