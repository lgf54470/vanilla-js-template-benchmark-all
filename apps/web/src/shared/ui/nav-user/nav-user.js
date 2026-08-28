import { attachStyles, createIcon } from "../base.js";
import { eventBus } from "../../core/event-bus.js";
import "../dropdown-menu/dropdown-menu.js";
import "../avatar/avatar.js";

const css = `
:host {
  display: block;
  width: 100%;
}
ds-dropdown-menu {
  display: block;
  width: 100%;
}
.user-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  color: var(--color-sidebar-fg);
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  box-sizing: border-box;
}
.user-btn:hover {
  background-color: var(--color-sidebar-accent);
  color: var(--color-sidebar-accent-fg);
}
.avatar-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-sidebar-primary, var(--color-primary));
  color: var(--color-sidebar-primary-fg, var(--color-primary-fg));
  font-weight: 600;
  font-size: var(--text-sm);
  flex-shrink: 0;
}
.info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.25;
}
.name {
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-sidebar-fg);
}
.email {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chevrons {
  color: var(--color-fg-muted);
  flex-shrink: 0;
  margin-left: auto;
}
:host-context(ds-sidebar[data-state="collapsed"]) .info,
:host-context(ds-sidebar[data-state="collapsed"]) .chevrons {
  display: none;
}
.menu-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
}
.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-fg);
  cursor: pointer;
  user-select: none;
}
.menu-item:hover {
  background-color: var(--color-muted);
}
.menu-item--danger {
  color: var(--color-danger);
}
.menu-item--danger:hover {
  background-color: var(--color-destructive-muted, rgba(239, 68, 68, 0.1));
}
.separator {
  height: 1px;
  background-color: var(--color-border);
  margin-block: var(--space-1);
}
`;

export class DsNavUser extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const user = { name: "开发者", email: "d***@workspace.local" };

    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu side="up">
        <button class="user-btn" slot="trigger" type="button" title="${user.name}">
          <div class="avatar-tile">A</div>
          <div class="info">
            <span class="name">${user.name}</span>
            <span class="email">${user.email}</span>
          </div>
          <div class="chevrons">${createIcon("chevrons-up-down")}</div>
        </button>

        <div class="menu-header">
          <div class="avatar-tile">A</div>
          <div style="display: flex; flex-direction: column; overflow: hidden; line-height: 1.25;">
            <span style="font-size: var(--text-sm); font-weight: 600;">${user.name}</span>
            <span style="font-size: var(--text-2xs); color: var(--color-fg-muted);">${user.email}</span>
          </div>
        </div>

        <div class="separator"></div>

        <div class="menu-item" id="item-settings">
          ${createIcon("settings")}
          <span>系统设置</span>
        </div>
        <div class="menu-item" id="item-appearance">
          ${createIcon("palette")}
          <span>外观定制</span>
        </div>

        <div class="separator"></div>

        <div class="menu-item menu-item--danger" id="item-logout">
          ${createIcon("log-out")}
          <span>退出登录</span>
        </div>
      </ds-dropdown-menu>
    `;

    this.shadowRoot.querySelector("#item-logout")?.addEventListener("click", async () => {
      const token = localStorage.getItem("auth:token") || "";
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-auth-password": token },
      }).catch(() => {});
      localStorage.removeItem("auth:token");
      sessionStorage.removeItem("auth:token");
      eventBus.emit("auth:unauthorized");
      globalThis.window?.location.reload();
    });

    this.shadowRoot.querySelector("#item-settings")?.addEventListener("click", () => {
      const menu = this.shadowRoot.querySelector("ds-dropdown-menu");
      if (menu) menu.close();
      eventBus.emit("router:navigate", { path: "/settings" });
    });

    this.shadowRoot.querySelector("#item-appearance")?.addEventListener("click", () => {
      const menu = this.shadowRoot.querySelector("ds-dropdown-menu");
      if (menu) menu.close();
      const sheet = document.querySelector("ds-appearance-sheet");
      if (sheet) sheet.open();
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-nav-user")) customElements.define("ds-nav-user", DsNavUser);
