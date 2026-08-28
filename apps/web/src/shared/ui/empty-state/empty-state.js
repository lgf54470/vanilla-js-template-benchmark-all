import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
  gap: var(--space-3);
  border-radius: var(--ds-card-radius, var(--radius-lg));
  border: 1px dashed var(--color-border);
  color: var(--color-fg-muted);
}
.empty-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-fg-muted);
}
.empty-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-fg);
}
.empty-desc {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  max-width: 24rem;
}
.empty-actions {
  margin-top: var(--space-2);
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
    const icon = this.getAttribute("icon") || "folder";
    const title = this.getAttribute("title") || "";
    const description = this.getAttribute("description") || "";

    this.shadowRoot.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${createIcon(icon)}</div>
        ${title ? `<div class="empty-title">${title}</div>` : ""}
        ${description ? `<div class="empty-desc">${description}</div>` : ""}
        <div class="empty-actions"><slot></slot></div>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-empty-state")) customElements.define("ds-empty-state", DsEmptyState);
