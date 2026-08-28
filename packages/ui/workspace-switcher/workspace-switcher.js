import { attachStyles, createIcon } from "../base.js";
import { SEED_WORKSPACES } from "@contracts/constants.js";
import "../dropdown-menu/dropdown-menu.js";
import "../dialog/dialog.js";

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
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  color: var(--color-sidebar-fg);
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  box-sizing: border-box;
}
.switcher-btn:hover {
  background-color: var(--color-sidebar-accent);
  color: var(--color-sidebar-accent-fg);
}
.tile-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-sidebar-primary, var(--color-primary));
  color: var(--color-sidebar-primary-fg, var(--color-primary-fg));
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
.sub {
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
.menu-panel {
  min-width: 15rem;
}
.menu-header {
  padding: var(--space-2);
  font-size: var(--text-2xs);
  font-weight: 600;
  color: var(--color-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ws-item {
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
.ws-item:hover {
  background-color: var(--color-muted);
}
.ws-item--active {
  background-color: var(--color-muted);
  font-weight: 600;
}
.ws-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}
.check-icon {
  margin-left: auto;
  color: var(--color-primary);
}
.shortcut {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
  margin-left: auto;
}
.separator {
  height: 1px;
  background-color: var(--color-border);
  margin-block: var(--space-1);
}
.create-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
  cursor: pointer;
}
.create-item:hover {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
`;

export class DsWorkspaceSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.workspaces = [...SEED_WORKSPACES];
    this.currentId = "ws_default";
  }

  connectedCallback() {
    this.render();
  }

  setWorkspaces(list, currentId) {
    this.workspaces = list;
    if (currentId) this.currentId = currentId;
    this.render();
  }

  render() {
    const cur = this.workspaces.find((w) => w.id === this.currentId) || this.workspaces[0] || {
      name: "默认空间",
      icon: "home",
      id: "ws_default",
    };

    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu>
        <button data-slot="workspace-switcher-trigger" class="switcher-btn" slot="trigger" type="button" title="${cur.name}">
          <div class="tile-icon">${createIcon(cur.icon || "home")}</div>
          <div class="info">
            <span class="name">${cur.name}</span>
            <span class="sub">个人工作区</span>
          </div>
          <div class="chevrons">${createIcon("chevrons-up-down")}</div>
        </button>

        <div data-slot="workspace-switcher-menu" class="menu-panel">
          <div class="menu-header">工作空间</div>
          ${
      this.workspaces.map((w, idx) => {
        const active = w.id === this.currentId;
        return `
              <div class="ws-item ${active ? "ws-item--active" : ""}" data-id="${w.id}">
                <div class="ws-icon">${createIcon(w.icon || "folder")}</div>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${w.name}</span>
                ${
          active
            ? `<span class="check-icon">${createIcon("check")}</span>`
            : `<span class="shortcut">⌘${idx + 1}</span>`
        }
              </div>
            `;
      }).join("")
    }
        </div>
      </ds-dropdown-menu>
    `;

    this.shadowRoot.querySelectorAll(".ws-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        this.currentId = id;
        this.render();
        this.dispatchEvent(new CustomEvent("ds-workspace-change", { detail: { id } }));
        const menu = this.shadowRoot.querySelector("ds-dropdown-menu");
        if (menu) menu.close();
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-workspace-switcher")) {
  customElements.define("ds-workspace-switcher", DsWorkspaceSwitcher);
}
