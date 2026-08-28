import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { confirmDialog } from "../../shared/ui/dialog/confirm-dialog.js";
import { toast } from "../../shared/ui/toast/toast.js";
import { eventBus } from "../../shared/core/event-bus.js";

registerTranslations("zh-CN", "workspace", zhCN);
registerTranslations("zh-TW", "workspace", zhTW);
registerTranslations("en", "workspace", en);

export default {
  async mount(container) {
    let workspaces = [];
    const currentWsId = localStorage.getItem("current_workspace_id") || "ws_default";
    const token = localStorage.getItem("auth:token") || "";
    const headers = { "x-auth-password": token, "content-type": "application/json" };

    const loadWorkspaces = async () => {
      try {
        const res = await fetch("/api/workspaces", { headers });
        const data = await res.json();
        if (data.ok) {
          workspaces = data.data;
          renderList();
        }
      } catch {
        workspaces = [];
        renderList();
      }
    };

    const renderList = () => {
      const listContainer = container.querySelector("#ws-grid");
      if (!listContainer) return;

      listContainer.innerHTML = workspaces.map((ws) => {
        const isCurrent = ws.id === currentWsId;
        const isSystem = ws.is_system === 1;
        const displayName = ws.name.startsWith("i18n:workspace.seed.") ? t(ws.name) : ws.name;

        return `
          <ds-card class="ws-card" data-id="${ws.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="display: flex; align-items: center; gap: var(--space-3);">
                <div style="display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; border-radius: var(--radius-md); background-color: var(--color-primary); color: var(--color-primary-fg);">
                  <svg width="20" height="20"><use href="/icons.svg#${
          ws.icon || "folder"
        }"></use></svg>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: var(--text-base);">${displayName}</div>
                  <div style="font-size: var(--text-2xs); color: var(--color-fg-muted);">${ws.id}</div>
                </div>
              </div>
              <div>
                ${isCurrent ? `<ds-badge variant="primary">当前活跃</ds-badge>` : ""}
                ${
          isSystem ? `<ds-badge variant="outline">${t("workspace.systemBadge")}</ds-badge>` : ""
        }
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-2);">
              ${
          !isCurrent
            ? `<ds-button class="btn-switch" size="sm" variant="secondary" data-id="${ws.id}">${
              t("workspace.switchWorkspace")
            }</ds-button>`
            : `<div></div>`
        }
              <div style="display: flex; gap: var(--space-1);">
                <ds-button class="btn-edit" size="sm" variant="ghost" icon="edit" data-id="${ws.id}"></ds-button>
                ${
          !isSystem
            ? `<ds-button class="btn-delete" size="sm" variant="ghost" icon="trash-2" data-id="${ws.id}"></ds-button>`
            : ""
        }
              </div>
            </div>
          </ds-card>
        `;
      }).join("");

      listContainer.querySelectorAll(".btn-switch").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const target = workspaces.find((w) => w.id === id);
          if (target) {
            localStorage.setItem("current_workspace_id", target.id);
            eventBus.emit("workspace:changed", { workspace: target });
            toast.success(`已切换至工作空间: ${target.name}`);
            globalThis.window?.location.reload();
          }
        });
      });

      listContainer.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const ws = workspaces.find((w) => w.id === id);
          if (ws) openEditDialog(ws);
        });
      });

      listContainer.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const ok = await confirmDialog({
            title: t("workspace.deleteConfirmTitle"),
            description: t("workspace.deleteConfirmDesc"),
            confirmLabel: t("common.delete"),
            danger: true,
          });
          if (ok) {
            const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (data.ok) {
              toast.success(t("common.success"));
              await loadWorkspaces();
            } else {
              toast.error(data.error?.message || t("common.error"));
            }
          }
        });
      });
    };

    const openEditDialog = (ws = null) => {
      const isEdit = !!ws;
      const dialog = document.createElement("ds-dialog");
      dialog.setAttribute(
        "title",
        isEdit ? t("workspace.editWorkspace") : t("workspace.newWorkspace"),
      );

      dialog.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("workspace.wsName")
      }</label>
            <ds-input id="input-name" placeholder="工作空间名称" value="${
        ws?.name || ""
      }"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("workspace.wsIcon")
      }</label>
            <ds-select id="select-icon">
              <option value="folder" ${
        ws?.icon === "folder" ? "selected" : ""
      }>folder (文件夹)</option>
              <option value="home" ${ws?.icon === "home" ? "selected" : ""}>home (主页)</option>
              <option value="briefcase" ${
        ws?.icon === "briefcase" ? "selected" : ""
      }>briefcase (工作)</option>
              <option value="graduation-cap" ${
        ws?.icon === "graduation-cap" ? "selected" : ""
      }>graduation-cap (学习)</option>
              <option value="heart" ${ws?.icon === "heart" ? "selected" : ""}>heart (生活)</option>
              <option value="gamepad-2" ${
        ws?.icon === "gamepad-2" ? "selected" : ""
      }>gamepad-2 (娱乐)</option>
              <option value="plane" ${ws?.icon === "plane" ? "selected" : ""}>plane (旅行)</option>
            </ds-select>
          </div>
        </div>
        <div slot="footer" style="display: flex; gap: var(--space-2); justify-content: flex-end;">
          <ds-button id="btn-cancel" variant="outline">${t("common.cancel")}</ds-button>
          <ds-button id="btn-save" variant="primary">${t("common.save")}</ds-button>
        </div>
      `;

      document.body.appendChild(dialog);
      dialog.open = true;

      dialog.querySelector("#btn-cancel").addEventListener("click", () => {
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
      });

      dialog.querySelector("#btn-save").addEventListener("click", async () => {
        const name = dialog.querySelector("#input-name").value.trim();
        const icon = dialog.querySelector("#select-icon").value;

        if (!name) return;

        if (isEdit) {
          await fetch(`/api/workspaces/${ws.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ name, icon }),
          });
        } else {
          await fetch("/api/workspaces", {
            method: "POST",
            headers,
            body: JSON.stringify({ name, icon }),
          });
        }

        toast.success(t("common.success"));
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
        await loadWorkspaces();
      });
    };

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("workspace.title")}</h1>
            <p class="page-description">${t("workspace.description")}</p>
          </div>
          <ds-button id="btn-new-ws" icon="plus">${t("workspace.newWorkspace")}</ds-button>
        </div>

        <div class="card-grid" id="ws-grid"></div>
      </div>
    `;

    container.querySelector("#btn-new-ws").addEventListener("click", () => openEditDialog());
    await loadWorkspaces();
  },

  unmount() {},
};
