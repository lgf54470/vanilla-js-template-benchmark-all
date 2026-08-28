import { attachStyles, createIcon } from "../base.js";
import { eventBus } from "../../core/event-bus.js";
import "../dropdown-menu/dropdown-menu.js";

const css = `
:host { display: block; width: 100%; }
.switcher-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  color: var(--color-sidebar-fg);
  cursor: pointer;
}
.switcher-btn:hover {
  background-color: var(--color-sidebar-accent);
}
.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background-color: var(--color-sidebar-primary, var(--color-primary));
  color: var(--color-sidebar-primary-fg, var(--color-primary-fg));
  flex-shrink: 0;
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
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
}
.chevrons {
  color: var(--color-fg-muted);
  flex-shrink: 0;
}
:host-context(ds-sidebar[data-state="collapsed"]) .info,
:host-context(ds-sidebar[data-state="collapsed"]) .chevrons {
  display: none;
}
.menu-header {
  padding: var(--space-2);
  font-size: var(--text-2xs);
  font-weight: 600;
  color: var(--color-fg-muted);
  text-transform: uppercase;
}
.ws-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
}
.ws-item:hover {
  background-color: var(--color-muted);
}
.ws-item--active {
  font-weight: 600;
  color: var(--color-primary);
}
.separator {
  height: 1px;
  background-color: var(--color-border);
  margin-block: var(--space-1);
}
`;

export class DsWorkspaceSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.workspaces = [];
    this.activeWorkspace = null;
  }

  connectedCallback() {
    this.loadWorkspaces();
  }

  async loadWorkspaces() {
    try {
      const token = localStorage.getItem("auth:token") || "";
      const currentWsId = localStorage.getItem("current_workspace_id") || "ws_default";
      const res = await fetch("/api/workspaces", {
        headers: { "x-auth-password": token, "x-workspace-id": currentWsId },
      });
      const data = await res.json();
      if (data.ok) {
        this.workspaces = data.data;
        this.activeWorkspace = this.workspaces.find((w) => w.id === currentWsId) ||
          this.workspaces[0];
        this.render();
      }
    } catch {
      // Fallback
      this.activeWorkspace = { id: "ws_default", name: "默认工作空间", icon: "home" };
      this.render();
    }
  }

  selectWorkspace(ws) {
    this.activeWorkspace = ws;
    localStorage.setItem("current_workspace_id", ws.id);
    eventBus.emit("workspace:changed", { workspace: ws });
    this.render();
  }

  render() {
    const ws = this.activeWorkspace || { name: "工作空间", icon: "folder" };
    const listHtml = this.workspaces.map((w) => {
      const active = w.id === ws.id;
      return `
        <div class="ws-item ${active ? "ws-item--active" : ""}" data-id="${w.id}">
          <span>${createIcon(w.icon || "folder")}</span>
          <span style="flex: 1;">${w.name.replace("i18n:workspace.seed.", "")}</span>
          ${active ? createIcon("check") : ""}
        </div>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu>
        <button class="switcher-btn" slot="trigger" type="button" title="${ws.name}">
          <div class="icon-box">${createIcon(ws.icon || "folder")}</div>
          <div class="info">
            <span class="name">${ws.name.replace("i18n:workspace.seed.", "")}</span>
            <span class="badge">工作空间</span>
          </div>
          <div class="chevrons">${createIcon("chevrons-up-down")}</div>
        </button>

        <div class="menu-header">工作空间</div>
        ${listHtml}
      </ds-dropdown-menu>
    `;

    this.shadowRoot.querySelectorAll(".ws-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        const found = this.workspaces.find((w) => w.id === id);
        if (found) {
          this.selectWorkspace(found);
          const menu = this.shadowRoot.querySelector("ds-dropdown-menu");
          if (menu) menu.close();
        }
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-workspace-switcher")) {
  customElements.define("ds-workspace-switcher", DsWorkspaceSwitcher);
}
