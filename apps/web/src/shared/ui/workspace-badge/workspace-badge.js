import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: inline-flex; }
.ws-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding-block: var(--space-1);
  padding-inline: var(--space-2);
  border-radius: var(--radius-sm);
  background-color: var(--color-secondary);
  color: var(--color-secondary-fg);
  font-size: var(--text-xs);
  font-weight: 500;
}
`;

export class DsWorkspaceBadge extends HTMLElement {
  static get observedAttributes() {
    return ["name", "icon"];
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
    const name = this.getAttribute("name") || "工作空间";
    const icon = this.getAttribute("icon") || "folder";

    this.shadowRoot.innerHTML = `
      <div class="ws-badge">
        ${createIcon(icon)}
        <span>${name}</span>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-workspace-badge")) {
  customElements.define("ds-workspace-badge", DsWorkspaceBadge);
}
