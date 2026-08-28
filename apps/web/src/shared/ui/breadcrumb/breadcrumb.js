// apps/web/src/shared/ui/breadcrumb/breadcrumb.js
// <ds-breadcrumb> / <ds-workspace-badge>
//
// breadcrumb：已实现，当前 Header 未接线（Components.md §2 保留组件）。
// workspace-badge：当前工作空间只读徽标，保留组件。
import { attachStyles, define } from "../base.js";
import { iconSvg } from "../../lib/icons.js";

const BREADCRUMB_CSS = `
:host{display:flex}
nav{display:flex;align-items:center;gap:.25rem;font-size:.85rem;color:var(--color-fg-muted);
  overflow:hidden}
.sep{display:flex;color:var(--color-fg-muted);opacity:.6}
a{color:var(--color-fg);cursor:pointer}
a:hover{color:var(--color-fg)}
a[aria-current="page"]{color:var(--color-fg-muted);pointer-events:none}
::slotted(svg){width:.8rem;height:.8rem}
`;

class DsBreadcrumb extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, BREADCRUMB_CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <nav aria-label="Breadcrumb"><slot></slot></nav>`;
  }
}
define("ds-breadcrumb", DsBreadcrumb);

const WS_BADGE_CSS = `
:host{display:inline-flex}
.ws{display:inline-flex;align-items:center;gap:.4rem;padding:.15rem .6rem;
  border-radius:var(--ds-badge-radius);background:var(--color-sidebar-accent);
  color:var(--color-sidebar-accent-fg);font-size:.75rem;font-weight:600;
  white-space:nowrap;max-width:14rem}
.icon{flex:none;display:inline-flex}
.name{overflow:hidden;text-overflow:ellipsis}
`;

class DsWorkspaceBadge extends HTMLElement {
  static observedAttributes = ["icon", "name"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, WS_BADGE_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._root) this._render();
  }
  _render() {
    const icon = this.getAttribute("icon") ?? "folder";
    const name = this.getAttribute("name") ?? "";
    this.shadowRoot.innerHTML = `
      <span class="ws">
        <span class="icon">${iconSvg(icon, 12)}</span>
        <span class="name">${name}</span>
      </span>`;
    this._root = this.shadowRoot.querySelector(".ws");
  }
}
define("ds-workspace-badge", DsWorkspaceBadge);
