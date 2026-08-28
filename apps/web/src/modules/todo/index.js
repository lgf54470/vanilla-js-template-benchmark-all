import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { confirmDialog } from "../../shared/ui/dialog/confirm-dialog.js";
import { toast } from "../../shared/ui/toast/toast.js";

registerTranslations("zh-CN", "todo", zhCN);
registerTranslations("zh-TW", "todo", zhTW);
registerTranslations("en", "todo", en);

export default {
  async mount(container, { workspaceId }) {
    let currentFilter = "";
    let todos = [];
    const token = localStorage.getItem("auth:token") || "";
    const headers = {
      "x-auth-password": token,
      "x-workspace-id": workspaceId,
      "content-type": "application/json",
    };

    const loadTodos = async () => {
      try {
        const url = currentFilter ? `/api/todo?status=${currentFilter}` : "/api/todo";
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (data.ok) {
          todos = data.data;
          renderList();
        }
      } catch {
        todos = [];
        renderList();
      }
    };

    const renderList = () => {
      const listContainer = container.querySelector("#todo-list");
      if (!listContainer) return;

      if (todos.length === 0) {
        listContainer.innerHTML = `
          <ds-empty-state icon="check-square" title="${t("todo.noTodos")}" description="${
          t("todo.createFirst")
        }">
            <ds-button id="btn-empty-new" icon="plus">${t("todo.newTodo")}</ds-button>
          </ds-empty-state>
        `;
        listContainer.querySelector("#btn-empty-new")?.addEventListener(
          "click",
          () => openEditDialog(),
        );
        return;
      }

      listContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          ${
        todos.map((todo) => {
          const isCompleted = todo.status === "completed";
          let pVariant = "default";
          if (todo.priority === "high") pVariant = "danger";
          if (todo.priority === "medium") pVariant = "warning";

          return `
              <ds-card compact>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);">
                  <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1;">
                    <ds-checkbox class="todo-cb" data-id="${todo.id}" ${
            isCompleted ? "checked" : ""
          }></ds-checkbox>
                    <div style="display: flex; flex-direction: column; gap: 0.125rem;">
                      <span style="font-weight: 500; font-size: var(--text-sm); ${
            isCompleted ? "text-decoration: line-through; opacity: 0.6;" : ""
          }">${todo.title}</span>
                      ${
            todo.description
              ? `<span style="font-size: var(--text-xs); color: var(--color-fg-muted);">${todo.description}</span>`
              : ""
          }
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <ds-badge variant="${pVariant}">${
            t(`todo.priority${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`)
          }</ds-badge>
                    <ds-button class="btn-delete" size="sm" variant="ghost" icon="trash-2" data-id="${todo.id}"></ds-button>
                  </div>
                </div>
              </ds-card>
            `;
        }).join("")
      }
        </div>
      `;

      listContainer.querySelectorAll(".todo-cb").forEach((cb) => {
        cb.addEventListener("ds-change", async (e) => {
          const id = cb.getAttribute("data-id");
          const nextStatus = e.detail.checked ? "completed" : "pending";
          await fetch(`/api/todo/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: nextStatus }),
          });
          await loadTodos();
        });
      });

      listContainer.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const ok = await confirmDialog({
            title: t("todo.deleteConfirmTitle"),
            description: t("todo.deleteConfirmDesc"),
            confirmLabel: t("common.delete"),
            danger: true,
          });
          if (ok) {
            await fetch(`/api/todo/${id}`, { method: "DELETE", headers });
            toast.success(t("common.success"));
            await loadTodos();
          }
        });
      });
    };

    const openEditDialog = () => {
      const dialog = document.createElement("ds-dialog");
      dialog.setAttribute("title", t("todo.newTodo"));

      dialog.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("todo.taskTitle")
      }</label>
            <ds-input id="input-title" placeholder="输入任务名称"></ds-input>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("todo.taskDesc")
      }</label>
            <ds-textarea id="input-desc" rows="3" placeholder="补充任务详情..."></ds-textarea>
          </div>
          <div>
            <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("todo.priority")
      }</label>
            <ds-select id="select-priority">
              <option value="low">${t("todo.priorityLow")}</option>
              <option value="medium" selected>${t("todo.priorityMedium")}</option>
              <option value="high">${t("todo.priorityHigh")}</option>
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
        const title = dialog.querySelector("#input-title").value.trim();
        const description = dialog.querySelector("#input-desc").value;
        const priority = dialog.querySelector("#select-priority").value;

        if (!title) return;

        await fetch("/api/todo", {
          method: "POST",
          headers,
          body: JSON.stringify({ title, description, priority }),
        });

        toast.success(t("common.success"));
        dialog.close();
        setTimeout(() => dialog.remove(), 100);
        await loadTodos();
      });
    };

    container.innerHTML = `
      <div class="page-container page-container--narrow">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("todo.title")}</h1>
            <p class="page-description">${t("todo.description")}</p>
          </div>
          <ds-button id="btn-new-todo" icon="plus">${t("todo.newTodo")}</ds-button>
        </div>

        <div style="display: flex; gap: var(--space-2);">
          <ds-segmented-control id="filter-control"></ds-segmented-control>
        </div>

        <div id="todo-list"></div>
      </div>
    `;

    const seg = container.querySelector("#filter-control");
    seg.items = [
      { value: "", label: t("todo.all") },
      { value: "pending", label: t("todo.pending") },
      { value: "completed", label: t("todo.completed") },
    ];
    seg.value = currentFilter;
    seg.addEventListener("ds-change", (e) => {
      currentFilter = e.detail.value;
      loadTodos();
    });

    container.querySelector("#btn-new-todo").addEventListener("click", () => openEditDialog());
    await loadTodos();
  },

  unmount() {},
};
