import { attachStyles } from "../base.js";

const css = `
:host { display: inline-block; }
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background-color: var(--color-sidebar-primary, var(--color-primary));
  color: var(--color-primary-fg);
  font-weight: 600;
  font-size: var(--text-xs);
  user-select: none;
  overflow: hidden;
}
.avatar--sm { width: 1.5rem; height: 1.5rem; }
.avatar--md { width: 2rem; height: 2rem; }
.avatar--lg { width: 2.5rem; height: 2.5rem; font-size: var(--text-sm); }
img { width: 100%; height: 100%; object-fit: cover; }
`;

export class DsAvatar extends HTMLElement {
  static get observedAttributes() {
    return ["src", "alt", "name", "size"];
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

  get size() {
    return this.getAttribute("size") || "md";
  }
  get src() {
    return this.getAttribute("src");
  }
  get name() {
    return this.getAttribute("name") || this.getAttribute("alt") || "U";
  }

  render() {
    const initial = this.name.trim().charAt(0).toUpperCase();
    this.shadowRoot.innerHTML = `
      <div class="avatar avatar--${this.size}">
        ${this.src ? `<img src="${this.src}" alt="${this.name}" />` : `<span>${initial}</span>`}
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-avatar")) customElements.define("ds-avatar", DsAvatar);
