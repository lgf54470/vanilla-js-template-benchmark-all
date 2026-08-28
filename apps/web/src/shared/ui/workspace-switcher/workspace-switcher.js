import { attachStyles, createIcon } from "../base.js";
import { eventBus } from "../../core/event-bus.js";
import { t } from "../../lib/i18n.js";
import "../dropdown-menu/dropdown-menu.js";
import "../dialog/dialog.js";
import "../input/input.js";
import "../select/select.js";
import "../button/button.js";
import { toast } from "../toast/toast.js";

const css = `
:host {
  display: block;
  width: 100%;
}
ds-dropdown-menu {
  display: block;
  width: 100%;
}
.switcher-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  color: var(--color-sidebar-fg);
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  box-sizing: border-box;
}
.switcher-btn:hover {
  background-color: var(--color-sidebar-accent);
}
.icon-tile {
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
  flex: 1;
  min-width: 0;
}
.name {
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-sidebar-fg);
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
  letter-spacing: 0.05em;
}
.ws-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ws-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-fg);
  cursor: pointer;
  user-select: none;
}
.ws-item:hover {
  background-color: var(--color-muted);
}
.ws-item--active {
  font-weight: 600;
  color: var(--color-primary);
}
.ws-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-muted);
  flex-shrink: 0;
}
.shortcut {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
  padding: 1px 4px;
  border-radius: var(--radius-xs);
  background-color: var(--color-muted);
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
    this.workspaces = [
      { id: "ws_default", name: "i18n:workspace.seed.default", icon: "home" },
    ];
    this.activeWorkspace = this.workspaces[0];
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._unsubLocale = null;
  }

  connectedCallback() {
    this.render();
    this.loadWorkspaces();
    globalThis.window?.addEventListener("keydown", this._handleKeyDown);
    this._unsubLocale = eventBus.on("locale:changed", () => {
      this.render();
    });
  }

  disconnectedCallback() {
    globalThis.window?.removeEventListener("keydown", this._handleKeyDown);
    if (this._unsubLocale) this._unsubLocale();
  }

  _handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "6") {
      const idx = parseInt(e.key, 10) - 1;
      if (this.workspaces[idx]) {
        e.preventDefault();
        this.selectWorkspace(this.workspaces[idx]);
      }
    }
  }

  async loadWorkspaces() {
    try {
      const token = localStorage.getItem("auth:token") || "";
      const currentWsId = localStorage.getItem("current_workspace_id") || "ws_default";
      const res = await fetch("/api/workspaces", {
        headers: { "x-auth-password": token, "x-workspace-id": currentWsId },
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        this.workspaces = data.data;
        this.activeWorkspace = this.workspaces.find((w) => w.id === currentWsId) ||
          this.workspaces[0];
        this.render();
      }
    } catch {
      // Keep defaults
    }
  }

  getDisplayName(ws) {
    if (!ws) return "工作空间";
    if (ws.name && ws.name.startsWith("i18n:")) {
      return t(ws.name);
    }
    return ws.name || "工作空间";
  }

  selectWorkspace(ws) {
    this.activeWorkspace = ws;
    localStorage.setItem("current_workspace_id", ws.id);
    this.dispatchEvent(
      new CustomEvent("workspace-switcher-select", {
        detail: { workspaceId: ws.id },
        bubbles: true,
      }),
    );
    eventBus.emit("workspace:changed", { workspace: ws });
    toast.success(`已切换空间: ${this.getDisplayName(ws)}`);
    this.render();
  }

  openCreateDialog() {
    const dialog = document.createElement("ds-dialog");
    dialog.setAttribute("title", "新建工作空间");

    dialog.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <div>
          <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">空间名称</label>
          <ds-input id="input-ws-name" placeholder="如：个人博客 / 财务账本"></ds-input>
        </div>
        <div>
          <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">图标</label>
          <ds-select id="select-ws-icon">
            <option value="folder">folder (文件夹)</option>
            <option value="briefcase">briefcase (工作)</option>
            <option value="graduation-cap">graduation-cap (学习)</option>
            <option value="heart">heart (生活)</option>
            <option value="gamepad-2">gamepad-2 (娱乐)</option>
            <option value="plane">plane (旅行)</option>
          </ds-select>
        </div>
      </div>
      <div slot="footer" style="display: flex; gap: var(--space-2); justify-content: flex-end;">
        <ds-button id="btn-cancel" variant="outline">取消</ds-button>
        <ds-button id="btn-save" variant="primary">创建</ds-button>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.open = true;

    dialog.querySelector("#btn-cancel").addEventListener("click", () => {
      dialog.close();
      setTimeout(() => dialog.remove(), 100);
    });

    dialog.querySelector("#btn-save").addEventListener("click", async () => {
      const name = dialog.querySelector("#input-ws-name").value.trim();
      const icon = dialog.querySelector("#select-ws-icon").value;

      if (!name) {
        toast.error("请输入空间名称");
        return;
      }

      const token = localStorage.getItem("auth:token") || "";
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json", "x-auth-password": token },
        body: JSON.stringify({ name, icon }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("空间创建成功！");
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
        await this.loadWorkspaces();
        this.selectWorkspace(data.data);
      } else {
        toast.error(data.error?.message || "创建失败");
      }
    });
  }

  render() {
    const ws = this.activeWorkspace || { name: "工作空间", icon: "folder" };
    const currentDisplayName = this.getDisplayName(ws);

    const listHtml = this.workspaces.map((w, idx) => {
      const active = w.id === ws.id;
      const name = this.getDisplayName(w);
      const shortcut = idx < 6 ? `Ctrl+${idx + 1}` : "";

      return `
        <div class="ws-item ${active ? "ws-item--active" : ""}" data-id="${w.id}">
          <div class="ws-tile">${createIcon(w.icon || "folder")}</div>
          <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</span>
          ${shortcut ? `<span class="shortcut">${shortcut}</span>` : ""}
          ${
        active
          ? `<span style="color: var(--color-primary);">${createIcon("circle-check")}</span>`
          : ""
      }
        </div>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu>
        <button class="switcher-btn" slot="trigger" type="button" title="${currentDisplayName}">
          <div class="icon-tile">${createIcon(ws.icon || "folder")}</div>
          <div class="info">
            <span class="name">${currentDisplayName}</span>
            <span class="badge">工作空间</span>
          </div>
          <div class="chevrons">${createIcon("chevrons-up-down")}</div>
        </button>

        <div class="menu-header">工作空间 (Ctrl+1..6)</div>
        <div class="ws-list">${listHtml}</div>
        <div class="separator"></div>
        <div class="ws-item" id="btn-create-ws">
          <div class="ws-tile">${createIcon("plus")}</div>
          <span style="flex: 1; font-weight: 500;">新建工作空间...</span>
        </div>
      </ds-dropdown-menu>
    `;

    this.shadowRoot.querySelectorAll(".ws-item[data-id]").forEach((item) => {
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

    this.shadowRoot.querySelector("#btn-create-ws")?.addEventListener("click", () => {
      const menu = this.shadowRoot.querySelector("ds-dropdown-menu");
      if (menu) menu.close();
      this.openCreateDialog();
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-workspace-switcher")) {
  customElements.define("ds-workspace-switcher", DsWorkspaceSwitcher);
}
