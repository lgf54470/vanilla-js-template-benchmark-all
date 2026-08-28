// apps/web/src/shared/ui/display/display.js — 展示类基础组件
// <ds-card> / <ds-badge> / <ds-avatar> / <ds-skeleton>
import { attachStyles, define } from "../base.js";

const CARD_CSS = `
:host{display:block}
.card{display:flex;flex-direction:column;gap:var(--ds-card-gap);
  padding:var(--ds-card-padding);border-radius:var(--ds-card-radius);
  background:var(--color-card);color:var(--color-card-fg);
  border:1px solid var(--color-border);box-shadow:var(--ds-card-ring)}
::slotted([slot="header"]){font-weight:600;font-size:1rem}
`;

class DsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CARD_CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="card" part="card">
        <slot name="header"></slot>
        <slot></slot>
        <slot name="footer"></slot>
      </div>`;
  }
}
define("ds-card", DsCard);

const BADGE_CSS = `
:host{display:inline-flex}
.badge{display:inline-flex;align-items:center;gap:.25rem;padding:.125rem .5rem;
  border-radius:var(--ds-badge-radius);font-size:.75rem;font-weight:600;line-height:1.4;
  background:var(--color-secondary);color:var(--color-secondary-fg)}
.badge[variant="success"]{background:var(--color-success);color:var(--color-primary-fg)}
.badge[variant="warning"]{background:var(--color-warning);color:var(--color-primary-fg)}
.badge[variant="danger"]{background:var(--color-danger);color:var(--color-danger-fg)}
.badge[variant="outline"]{background:transparent;color:var(--color-fg-muted);border:1px solid var(--color-border)}
::slotted(svg){width:.75rem;height:.75rem}
`;

class DsBadge extends HTMLElement {
  static observedAttributes = ["variant"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, BADGE_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._badge) this._render();
  }
  _render() {
    const variant = this.getAttribute("variant") ?? "default";
    this.shadowRoot.innerHTML =
      `<span class="badge" variant="${variant}"><slot></slot></span>`;
    this._badge = this.shadowRoot.querySelector(".badge");
  }
}
define("ds-badge", DsBadge);

const AVATAR_CSS = `
:host{display:inline-flex}
.avatar{display:inline-flex;align-items:center;justify-content:center;
  width:2rem;height:2rem;border-radius:var(--ds-avatar-radius);
  background:var(--color-sidebar-primary);color:var(--color-sidebar-primary-fg);
  font-size:.85rem;font-weight:600;overflow:hidden;flex:none}
img{width:100%;height:100%;object-fit:cover}
`;

class DsAvatar extends HTMLElement {
  static observedAttributes = ["src", "alt", "name", "size"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, AVATAR_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._avatar) this._render();
  }
  _render() {
    const src = this.getAttribute("src");
    const alt = this.getAttribute("alt") ?? "";
    const name = this.getAttribute("name") ?? "";
    const size = this.getAttribute("size");
    this.shadowRoot.innerHTML = "";
    const box = document.createElement("span");
    box.className = "avatar";
    if (size) {
      box.style.width = `${size}px`;
      box.style.height = `${size}px`;
      box.style.fontSize = `${Math.round(size * 0.42)}px`;
    }
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = alt;
      box.append(img);
    } else {
      box.textContent = (name || alt || "?").trim().slice(0, 1).toUpperCase();
    }
    this.shadowRoot.append(box);
    this._avatar = box;
  }
}
define("ds-avatar", DsAvatar);

const SKELETON_CSS = `
:host{display:block;width:100%}
.skeleton{width:100%;height:1rem;border-radius:var(--ds-skeleton-radius);
  background:var(--color-muted);opacity:.6}
`;

class DsSkeleton extends HTMLElement {
  static observedAttributes = ["width", "height"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, SKELETON_CSS);
  }
  connectedCallback() {
    const w = this.getAttribute("width");
    const h = this.getAttribute("height");
    const style = [
      w ? `width:${w}` : "",
      h ? `height:${h}` : "",
    ].filter(Boolean).join(";");
    this.shadowRoot.innerHTML = `<div class="skeleton" style="${style}"></div>`;
  }
}
define("ds-skeleton", DsSkeleton);

const EMPTY_CSS = `
:host{display:block}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:.5rem;padding:2.5rem 1rem;text-align:center;color:var(--color-fg-muted)}
.empty svg{width:2rem;height:2rem;color:var(--color-fg-muted)}
.empty .title{font-size:.9rem;font-weight:600;color:var(--color-fg)}
.empty .desc{font-size:.8rem}
`;

class DsEmptyState extends HTMLElement {
  static observedAttributes = ["icon", "title", "description"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, EMPTY_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._root) this._render();
  }
  _render() {
    const icon = this.getAttribute("icon") ?? "info";
    const title = this.getAttribute("title") ?? "";
    const desc = this.getAttribute("description") ?? "";
    this.shadowRoot.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <use href="/icons.svg#i-${icon}"></use>
        </svg>
        ${title ? `<div class="title">${title}</div>` : ""}
        ${desc ? `<div class="desc">${desc}</div>` : ""}
        <slot></slot>
      </div>`;
    this._root = this.shadowRoot.querySelector(".empty");
  }
}
define("ds-empty-state", DsEmptyState);

const PLACEHOLDER_CSS = `
:host{display:block}
.placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:.75rem;padding:3rem 1rem;border:1px dashed var(--color-border);
  border-radius:var(--ds-card-radius);text-align:center}
.placeholder svg{width:2.5rem;height:2.5rem;color:var(--color-fg-muted)}
.placeholder .title{font-size:1rem;font-weight:600}
.placeholder .desc{font-size:.85rem;color:var(--color-fg-muted);max-width:32rem}
`;

class DsPagePlaceholder extends HTMLElement {
  static observedAttributes = ["icon", "title", "description"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, PLACEHOLDER_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._root) this._render();
  }
  _render() {
    const icon = this.getAttribute("icon") ?? "sparkles";
    const title = this.getAttribute("title") ?? "";
    const desc = this.getAttribute("description") ?? "";
    this.shadowRoot.innerHTML = `
      <div class="placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <use href="/icons.svg#i-${icon}"></use>
        </svg>
        ${title ? `<div class="title">${title}</div>` : ""}
        ${desc ? `<div class="desc">${desc}</div>` : ""}
        <slot></slot>
      </div>`;
    this._root = this.shadowRoot.querySelector(".placeholder");
  }
}
define("ds-page-placeholder", DsPagePlaceholder);
