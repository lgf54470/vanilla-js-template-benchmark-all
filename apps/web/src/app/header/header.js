// apps/web/src/app/header/header.js — <ds-app-header> 顶栏（Layout.md §3）
//
// 从左到右：<ds-sidebar-trigger>（Ctrl/Cmd+B 提示）→ 应用名 → 弹性空白 →
// <ds-lang-switch> → <ds-theme-switch> → <ds-theme-settings> → 登出图标按钮。
// 纯展示装配：值（theme/locale）与动作（主题/语言/登出/主题设置）经属性与
// 事件上抛，由 assemble.js 接 appearance / auth / i18n。

import { attachStyles, define } from "../../shared/ui/base.js";
import { iconSvg } from "../../shared/lib/icons.js";

const HEADER_CSS = `
:host{display:block;height:3.5rem}
.inner{display:flex;align-items:center;gap:var(--space-2);block-size:3.5rem;
  padding-inline:var(--space-3);border-bottom:1px solid var(--color-border);
  background:var(--color-bg)}
.name{font-size:.95rem;font-weight:600;color:var(--color-fg);white-space:nowrap;
  margin-inline-start:var(--space-1)}
.spacer{flex:1}
.logout{display:inline-flex;align-items:center;justify-content:center;
  inline-size:2.2rem;block-size:2.2rem;border-radius:var(--ds-icon-btn-radius);
  color:var(--color-fg-muted);cursor:pointer;background:transparent}
.logout:hover{background:var(--color-muted);color:var(--color-fg)}
.logout:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
`;

class DsAppHeader extends HTMLElement {
  static observedAttributes = ["theme", "locale", "appname"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, HEADER_CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="inner">
        <ds-sidebar-trigger></ds-sidebar-trigger>
        <span class="name">${this.getAttribute("appname") ?? ""}</span>
        <span class="spacer"></span>
        <ds-lang-switch value="${
      this.getAttribute("locale") ?? "zh-CN"
    }"></ds-lang-switch>
        <ds-theme-switch value="${
      this.getAttribute("theme") ?? "system"
    }"></ds-theme-switch>
        <ds-theme-settings></ds-theme-settings>
        <button type="button" class="logout" aria-label="退出登录"></button>
      </div>`;
    this._btn = this.shadowRoot.querySelector(".logout");
    this._btn.innerHTML = iconSvg("log-out", 18);
    this._btn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("app-header-logout", { bubbles: true, composed: true }),
      );
    });
    this._sync();
  }
  attributeChangedCallback() {
    if (!this.shadowRoot.querySelector(".inner")) return;
    this._sync();
  }
  _sync() {
    const lang = this.shadowRoot.querySelector("ds-lang-switch");
    if (lang) {
      lang.setAttribute("value", this.getAttribute("locale") ?? "zh-CN");
    }
    const theme = this.shadowRoot.querySelector("ds-theme-switch");
    if (theme) {
      theme.setAttribute("value", this.getAttribute("theme") ?? "system");
    }
    const name = this.shadowRoot.querySelector(".name");
    if (name) name.textContent = this.getAttribute("appname") ?? "";
  }
}
define("ds-app-header", DsAppHeader);
