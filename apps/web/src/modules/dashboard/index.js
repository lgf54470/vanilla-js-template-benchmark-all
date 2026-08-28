import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { eventBus } from "../../shared/core/event-bus.js";

registerTranslations("zh-CN", "dashboard", zhCN);
registerTranslations("zh-TW", "dashboard", zhTW);
registerTranslations("en", "dashboard", en);

export default {
  async mount(container, { workspaceId }) {
    const token = localStorage.getItem("auth:token") || "";
    const headers = { "x-auth-password": token, "x-workspace-id": workspaceId };

    // Fetch counts in parallel
    let notesCount = 0;
    let todoCount = 0;
    let bookmarksCount = 0;
    let passwordsCount = 0;

    try {
      const [notesRes, todoRes, bmRes, pwdRes] = await Promise.allSettled([
        fetch("/api/notes", { headers }).then((r) => r.json()),
        fetch("/api/todo", { headers }).then((r) => r.json()),
        fetch("/api/bookmarks", { headers }).then((r) => r.json()),
        fetch("/api/passwords", { headers }).then((r) => r.json()),
      ]);

      if (notesRes.status === "fulfilled" && notesRes.value.ok) {
        notesCount = notesRes.value.data.length;
      }
      if (todoRes.status === "fulfilled" && todoRes.value.ok) todoCount = todoRes.value.data.length;
      if (bmRes.status === "fulfilled" && bmRes.value.ok) bookmarksCount = bmRes.value.data.length;
      if (pwdRes.status === "fulfilled" && pwdRes.value.ok) {
        passwordsCount = pwdRes.value.data.length;
      }
    } catch {
      // Ignore network errors in preview
    }

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("dashboard.welcome")}</h1>
            <p class="page-description">${t("dashboard.description")}</p>
          </div>
          <ds-workspace-badge name="当前空间"></ds-workspace-badge>
        </div>

        <div class="card-grid">
          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: var(--text-sm); color: var(--color-fg-muted);">${
      t("dashboard.notesCount")
    }</span>
              <ds-badge variant="primary">${notesCount}</ds-badge>
            </div>
            <div style="font-size: var(--text-3xl); font-weight: 700; margin-top: var(--space-2);">${notesCount}</div>
          </ds-card>

          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: var(--text-sm); color: var(--color-fg-muted);">${
      t("dashboard.todoCount")
    }</span>
              <ds-badge variant="success">${todoCount}</ds-badge>
            </div>
            <div style="font-size: var(--text-3xl); font-weight: 700; margin-top: var(--space-2);">${todoCount}</div>
          </ds-card>

          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: var(--text-sm); color: var(--color-fg-muted);">${
      t("dashboard.bookmarksCount")
    }</span>
              <ds-badge variant="warning">${bookmarksCount}</ds-badge>
            </div>
            <div style="font-size: var(--text-3xl); font-weight: 700; margin-top: var(--space-2);">${bookmarksCount}</div>
          </ds-card>

          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: var(--text-sm); color: var(--color-fg-muted);">${
      t("dashboard.passwordsCount")
    }</span>
              <ds-badge variant="default">${passwordsCount}</ds-badge>
            </div>
            <div style="font-size: var(--text-3xl); font-weight: 700; margin-top: var(--space-2);">${passwordsCount}</div>
          </ds-card>
        </div>

        <ds-card>
          <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
      t("dashboard.quickActions")
    }</div>
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
            <ds-button icon="file-text" id="btn-goto-notes">${t("dashboard.newNote")}</ds-button>
            <ds-button icon="check-square" variant="secondary" id="btn-goto-todo">${
      t("dashboard.newTodo")
    }</ds-button>
          </div>
        </ds-card>

        <ds-card>
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span style="display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: var(--radius-full); background-color: var(--color-success);"></span>
            <span style="font-weight: 600;">${t("dashboard.systemStatus")}:</span>
            <span style="color: var(--color-fg-muted); font-size: var(--text-sm);">${
      t("dashboard.runningHealthy")
    }</span>
          </div>
        </ds-card>
      </div>
    `;

    container.querySelector("#btn-goto-notes")?.addEventListener("click", () => {
      eventBus.emit("router:navigate", { path: "/notes" });
    });
    container.querySelector("#btn-goto-todo")?.addEventListener("click", () => {
      eventBus.emit("router:navigate", { path: "/todo" });
    });
  },

  unmount() {
    // Cleanup if any
  },
};
