// apps/web/src/shared/ui/sidebar/sidebar.js — <ds-sidebar> 家族布局部件
// <ds-sidebar> / <ds-sidebar-header> / <ds-sidebar-content> / <ds-sidebar-footer>
// / <ds-sidebar-group> / <ds-sidebar-group-label> / <ds-sidebar-rail> /
// <ds-sidebar-trigger> / <ds-collapsible>
//
// 对齐 shadcn base-nova（Components.md §3.3）：data-side/variant/collapsible/state
// 驱动全部样式，组件 JS 不计算 className。尺寸三件套来自 tokens/sidebar.css。
// 移动端（isMobile）渲染为 <ds-sheet side="left">，由 openMobile 控制。

import { attachStyles, define } from "../base.js";
import { iconSvg } from "../../lib/icons.js";
import { t } from "../../lib/i18n.js";
import { STORAGE_KEYS } from "@contracts/constants.js";

const SIDEBAR_CSS = `
:host{display:block;height:100%}
aside{position:relative;display:flex;flex-direction:column;height:100%;
  width:var(--sidebar-width);background:var(--color-sidebar);
  color:var(--color-sidebar-fg);border-right:1px solid var(--color-sidebar-border)}
:host([data-variant="floating"]) aside{height:auto;min-height:calc(100% - 1rem);
  margin:.5rem;border-radius:var(--ds-card-radius);
  border:1px solid var(--color-sidebar-border);box-shadow:var(--ds-card-ring)}
:host([data-collapsible="icon"][data-state="collapsed"]) aside{width:var(--sidebar-width-icon)}
:host([data-collapsible="offcanvas"][data-state="collapsed"]) aside{display:none}
:host([data-side="right"]) aside{border-right:0;border-left:1px solid var(--color-sidebar-border)}
.mobile-sheet{display:none}
:host([data-mobile]) .desktop{display:none}
:host([data-mobile]) .mobile-sheet{display:block}
`;

class DsSidebar extends HTMLElement {
  static observedAttributes = ["side", "variant", "collapsible"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, SIDEBAR_CSS);
    this._unsub = null;
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="desktop"><aside part="aside"><slot></slot></aside></div>
      <ds-sheet side="left" class="mobile-sheet"></ds-sheet>`;
    this._sheet = this.shadowRoot.querySelector("ds-sheet");
    this._desktop = this.shadowRoot.querySelector(".desktop");

    const provider = this.closest("ds-sidebar-provider");
    if (provider?.store) {
      this._unsub = provider.store.subscribe((s) => {
        this.dataset.state = s.state;
        if (s.isMobile) {
          this.toggleAttribute("data-mobile", true);
          this._sheet.toggleAttribute("open", s.openMobile);
        } else {
          this.toggleAttribute("data-mobile", false);
        }
      });
      const s = provider.store.get();
      this.dataset.state = s.state;
      this.toggleAttribute("data-mobile", s.isMobile);
      this._sheet.toggleAttribute("open", s.openMobile);
    }
    this._syncAttrs();
  }
  disconnectedCallback() {
    this._unsub?.();
  }
  attributeChangedCallback() {
    if (this._desktop) this._syncAttrs();
  }
  _syncAttrs() {
    const side = this.getAttribute("side") ?? "left";
    const variant = this.getAttribute("variant") ?? "sidebar";
    const collapsible = this.getAttribute("collapsible") ?? "icon";
    this.dataset.side = side;
    this.dataset.variant = variant;
    this.dataset.collapsible = collapsible;
    const aside = this.shadowRoot.querySelector("aside");
    if (aside) {
      aside.dataset.side = side;
      aside.dataset.variant = variant;
      aside.dataset.collapsible = collapsible;
    }
  }
}
define("ds-sidebar", DsSidebar);

// ---- 简单布局部件：header/content/footer/group/group-label ----
function simpleComponent(name, css) {
  class C extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      attachStyles(this, css);
    }
    connectedCallback() {
      this.shadowRoot.innerHTML = "<slot></slot>";
    }
  }
  define(name, C);
}

simpleComponent(
  "ds-sidebar-header",
  `
:host{display:block;padding:.5rem;flex:none}
`,
);

simpleComponent(
  "ds-sidebar-content",
  `
:host{display:block;flex:1;overflow:auto;min-height:0}
`,
);

simpleComponent(
  "ds-sidebar-footer",
  `
:host{display:block;padding:.5rem;flex:none;border-top:1px solid var(--color-sidebar-border);
  display:flex;flex-direction:column;gap:var(--ds-sidebar-footer-gap)}
`,
);

simpleComponent(
  "ds-sidebar-group",
  `
:host{display:block;padding:.25rem .25rem 0}
`,
);

simpleComponent(
  "ds-sidebar-group-label",
  `
:host{display:block;padding:.35rem .6rem .2rem;font-size:var(--ds-sidebar-group-label-font-size);
  color:var(--color-sidebar-fg);opacity:.7;font-weight:500;text-transform:uppercase;
  letter-spacing:.03em}
`,
);

// ---- rail：细边栏（桌面态可点击切换，移动态隐藏，Components.md §3.4） ----
const RAIL_CSS = `
:host{display:block;position:absolute;top:0;right:0;bottom:0;width:.5rem;
  border-left:1px solid var(--color-sidebar-border);cursor:col-resize;z-index:1;
  background:transparent}
button{position:absolute;top:50%;right:-.6rem;transform:translateY(-50%);
  display:flex;align-items:center;justify-content:center;width:1.2rem;height:2rem;
  border-radius:var(--ds-icon-btn-radius);color:var(--color-fg-muted);cursor:pointer;
  background:var(--color-sidebar)}
button:hover{background:var(--color-muted);color:var(--color-fg)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
@media (max-width:767px){:host{display:none}}
`;

class DsSidebarRail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, RAIL_CSS);
    this._onKey = (e) => {
      if (e.key === "Escape") this.blur();
    };
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <button type="button" aria-label="${
      t("shell.nav.toggleSidebar")
    }" aria-haspopup="true"></button>`;
    this._btn = this.shadowRoot.querySelector("button");
    this._btn.innerHTML = iconSvg("panel-left", 14);
    this._btn.addEventListener("click", () => {
      const provider = this.closest("ds-sidebar-provider");
      provider?.toggleSidebar();
    });
    // 拖拽调宽：由 app-shell 层绑定（M4 实现），本组件只提供可点击切换
  }
}
define("ds-sidebar-rail", DsSidebarRail);

// ---- trigger：汉堡图标按钮（置于 Header，aria-label 读 shell.nav.toggleSidebar） ----
class DsSidebarTrigger extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(
      this,
      `
:host{display:inline-flex}
button{display:inline-flex;align-items:center;justify-content:center;width:2.2rem;
  height:2.2rem;border-radius:var(--ds-icon-btn-radius);color:var(--color-fg-muted);
  cursor:pointer}
button:hover{background:var(--color-muted);color:var(--color-fg)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
`,
    );
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <button type="button" aria-label="${
      t("shell.nav.toggleSidebar")
    }"></button>`;
    const btn = this.shadowRoot.querySelector("button");
    btn.innerHTML = iconSvg("panel-left", 18);
    btn.addEventListener("click", () => {
      const provider = this.closest("ds-sidebar-provider");
      if (provider?.isMobile) {
        provider.setOpenMobile(true);
      } else {
        provider?.toggleSidebar();
      }
    });
  }
}
define("ds-sidebar-trigger", DsSidebarTrigger);

// ---- collapsible：展开/收起容器（menu-sub 外层用，Components.md §3.4） ----
const COLLAPSIBLE_CSS = `
:host{display:block}
.trigger{display:flex;align-items:center;justify-content:space-between;width:100%;
  gap:.5rem;padding:var(--ds-sidebar-menu-item-padding-y) var(--ds-menu-item-padding-x);
  border-radius:var(--ds-sidebar-menu-item-radius);cursor:pointer;
  color:var(--color-sidebar-fg);text-align:left;background:transparent}
.trigger:hover{background:var(--color-sidebar-accent);color:var(--color-sidebar-accent-fg)}
.chevron{display:inline-flex;color:var(--color-sidebar-fg);opacity:.7;
  transform:rotate(0deg)}
:host([data-state="open"]) .chevron{transform:rotate(90deg)}
.content{overflow:hidden;display:none}
:host([data-state="open"]) .content{display:block}
`;

class DsCollapsible extends HTMLElement {
  static observedAttributes = ["open", "label"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, COLLAPSIBLE_CSS);
  }
  connectedCallback() {
    this._render();
  }
  attributeChangedCallback() {
    if (this._root) this._render();
  }
  _render() {
    const open = this.hasAttribute("open");
    const label = this.getAttribute("label") ?? "";
    this.dataset.state = open ? "open" : "closed";
    this.shadowRoot.innerHTML = `
      <button type="button" class="trigger" aria-expanded="${open}">
        <span>${label}</span>
        <span class="chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-chevron-right"></use></svg></span>
      </button>
      <div class="content"><slot></slot></div>`;
    this._root = this.shadowRoot.querySelector(".trigger");
    this._root.addEventListener("click", () => {
      this.toggleAttribute("open", !this.hasAttribute("open"));
      this._render();
    });
  }
  get open() {
    return this.hasAttribute("open");
  }
  set open(v) {
    this.toggleAttribute("open", !!v);
  }
}
define("ds-collapsible", DsCollapsible);

// ---- 折叠态持久化：sidebar provider 已写 pref:sidebar-open ----
export { STORAGE_KEYS };
