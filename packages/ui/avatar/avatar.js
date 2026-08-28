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
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
  color: var(--color-fg-muted);
  overflow: hidden;
  font-weight: 500;
  user-select: none;
  box-sizing: border-box;
}
.size-default {
  width: 2rem;
  height: 2rem;
  font-size: var(--text-xs);
}
.size-sm {
  width: 1.5rem;
  height: 1.5rem;
  font-size: var(--text-2xs);
}
.size-lg {
  width: 2.5rem;
  height: 2.5rem;
  font-size: var(--text-sm);
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-fallback {
  line-height: 1;
  text-transform: uppercase;
}
`;

export class DsAvatar extends HTMLElement {
  static get observedAttributes() {
    return ["src", "alt", "fallback", "size"];
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
    const src = this.getAttribute("src");
    const alt = this.getAttribute("alt") || "";
    const fallback = this.getAttribute("fallback") || "U";
    const size = this.getAttribute("size") || "default";

    this.shadowRoot.innerHTML = `
      <div data-slot="avatar" class="avatar size-${size}">
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
