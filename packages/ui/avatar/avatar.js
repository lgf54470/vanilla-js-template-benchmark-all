import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-block;
}
.avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  color: var(--color-fg-muted);
  overflow: hidden;
  font-weight: 600;
  font-size: var(--text-xs);
  user-select: none;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
`;

export class DsAvatar extends HTMLElement {
  static get observedAttributes() {
    return ["src", "alt", "fallback"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const src = this.getAttribute("src");
    const alt = this.getAttribute("alt") || "";
    const fallback = this.getAttribute("fallback") || "U";

    this.shadowRoot.innerHTML = `
      <div data-slot="avatar" class="avatar">
        ${
      src
        ? `<img data-slot="avatar-image" class="avatar-img" src="${src}" alt="${alt}" onerror="this.style.display='none'"/>`
        : ""
    }
        <span data-slot="avatar-fallback" class="avatar-fallback">${fallback}</span>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-avatar")) customElements.define("ds-avatar", DsAvatar);
