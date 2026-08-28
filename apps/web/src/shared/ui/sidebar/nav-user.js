// apps/web/src/shared/ui/sidebar/nav-user.js — <ds-nav-user>
//
// 位于 <ds-sidebar-footer>（ARCHITECTURE.md §7.6 / Components.md §5）：
// 触发器 = 首字母头像 + 用户名（掩码）；下拉 = 菜单头（头像 + 用户名 + 掩码邮箱
// 或「未绑定邮箱」占位）→ 分隔线 → 设置 / 配置文件 / 用户资料 → 分隔线 →
// 退出登录（--color-danger 区分，非强警示）。
//
// 数据经属性下发：name、email（壳层已掩码）、avatar。菜单项点击 → nav-user-action
// 事件（detail: { action: 'settings'|'profile'|'account'|'logout' }）。

import { attachStyles, define } from "../base.js";

const CSS = `
:host{display:block}
.trigger{display:flex;align-items:center;gap:.5rem;width:100%;padding:.35rem .5rem;
  border-radius:var(--ds-sidebar-menu-item-radius);color:var(--color-sidebar-fg);
  cursor:pointer;background:transparent;text-align:left}
.trigger:hover{background:var(--color-sidebar-accent);color:var(--color-sidebar-accent-fg)}
.trigger .name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-size:.85rem;font-weight:600}
.chevron{display:inline-flex;color:var(--color-sidebar-fg);opacity:.6}
.menu-head{display:flex;flex-direction:column;gap:.15rem;padding:var(--ds-menu-item-padding-y)
  var(--ds-menu-item-padding-x)}
.menu-head .user{font-size:.85rem;font-weight:600;color:var(--color-fg)}
.menu-head .email{font-size:.75rem;color:var(--color-fg-muted)}
`;

class DsNavUser extends HTMLElement {
  static observedAttributes = ["name", "email", "avatar"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu class="menu">
        <button slot="trigger" type="button" class="trigger">
          <ds-avatar name=""></ds-avatar>
          <span class="name"></span>
          <span class="chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-chevron-up"></use></svg></span>
        </button>
        <div slot="content">
          <div class="menu-head">
            <span class="user"></span>
            <span class="email"></span>
          </div>
          <div class="separator"></div>
          <ds-menu-item label="设置" icon="settings" value="settings"></ds-menu-item>
          <ds-menu-item label="配置文件" icon="user" value="profile"></ds-menu-item>
          <ds-menu-item label="用户资料" icon="notebook-pen" value="account"></ds-menu-item>
          <div class="separator"></div>
          <ds-menu-item label="退出登录" icon="log-out" value="logout" danger></ds-menu-item>
        </div>
      </ds-dropdown-menu>`;
    this._menu = this.shadowRoot.querySelector("ds-dropdown-menu");
    this._avatar = this.shadowRoot.querySelector("ds-avatar");
    this._name = this.shadowRoot.querySelector(".trigger .name");
    this._userEl = this.shadowRoot.querySelector(".user");
    this._emailEl = this.shadowRoot.querySelector(".email");

    this.shadowRoot.addEventListener("ds-menu-item-select", (e) => {
      const value = e.detail?.value;
      this._menu.close();
      this.dispatchEvent(
        new CustomEvent("nav-user-action", {
          bubbles: true,
          composed: true,
          detail: { action: value },
        }),
      );
    });
    this._sync();
  }
  attributeChangedCallback() {
    if (this._name) this._sync();
  }
  _sync() {
    const name = this.getAttribute("name") ?? "";
    const email = this.getAttribute("email") ?? "";
    const avatar = this.getAttribute("avatar") ?? "";
    this._avatar.setAttribute("name", name || "U");
    if (avatar) this._avatar.setAttribute("src", avatar);
    this._name.textContent = name || "用户";
    this._userEl.textContent = name || "用户";
    this._emailEl.textContent = email || "未绑定邮箱";
  }
}
define("ds-nav-user", DsNavUser);
