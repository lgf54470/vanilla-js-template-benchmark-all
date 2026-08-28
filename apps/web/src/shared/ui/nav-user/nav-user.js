import { attachStyles, createIcon } from "../base.js";
import { eventBus } from "../../core/event-bus.js";
import "../dropdown-menu/dropdown-menu.js";
import "../avatar/avatar.js";

const css = `
:host { display: block; width: 100%; }
.user-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  color: var(--color-sidebar-fg);
  cursor: pointer;
}
.user-btn:hover {
  background-color: var(--color-sidebar-accent);
}
.info {
  display: flex;
  flex-direction: column;
  text-align: left;
  flex: 1;
  overflow: hidden;
}
.name {
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
}
:host-context(ds-sidebar[data-state="collapsed"]) .info,
:host-context(ds-sidebar[data-state="collapsed"]) .chevrons {
  display: none;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-fg);
  cursor: pointer;
}
.menu-item:hover {
  background-color: var(--color-muted);
}
.menu-item--danger {
  color: var(--color-danger);
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
    const user = { name: "开发者", email: "dev@workspace.local" };

    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu side="up">
        <button class="user-btn" slot="trigger" type="button" title="${user.name}">
          <ds-avatar name="${user.name}" size="sm"></ds-avatar>
          <div class="info">
            <span class="name">${user.name}</span>
            <span class="email">${user.email}</span>
          </div>
          <div class="chevrons">${createIcon("chevrons-up-down")}</div>
        </button>

        <div class="menu-item" data-action="appearance">
          ${createIcon("sparkles")}
          <span>外观设置</span>
        </div>
        <div class="separator"></div>
        <div class="menu-item menu-item--danger" data-action="logout">
          ${createIcon("log-out")}
          <span>退出登录</span>
        </div>
      </ds-dropdown-menu>
    `;

    this.shadowRoot.querySelector('[data-action="logout"]')?.addEventListener("click", () => {
      localStorage.removeItem("auth:token");
      eventBus.emit("auth:logout");
      globalThis.window?.location.reload();
    });

    this.shadowRoot.querySelector('[data-action="appearance"]')?.addEventListener("click", () => {
      eventBus.emit("router:navigate", { path: "/settings" });
    });

    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-nav-user")) customElements.define("ds-nav-user", DsNavUser);
