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
        </div>

        <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: var(--space-4);">
          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
              <span style="font-size: var(--text-sm); font-weight: 500; color: var(--color-fg-muted);">${
      t("dashboard.notesCount")
    }</span>
              <div style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--color-muted); color: var(--color-primary);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/icons.svg#file-text"></use></svg>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-fg);">${notesCount}</div>
          </ds-card>

          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
              <span style="font-size: var(--text-sm); font-weight: 500; color: var(--color-fg-muted);">${
      t("dashboard.todoCount")
    }</span>
              <div style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--color-muted); color: var(--color-success);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/icons.svg#check-square"></use></svg>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-fg);">${todoCount}</div>
          </ds-card>

          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
              <span style="font-size: var(--text-sm); font-weight: 500; color: var(--color-fg-muted);">${
      t("dashboard.bookmarksCount")
    }</span>
              <div style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--color-muted); color: var(--color-warning);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/icons.svg#bookmark"></use></svg>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-fg);">${bookmarksCount}</div>
          </ds-card>

          <ds-card>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
              <span style="font-size: var(--text-sm); font-weight: 500; color: var(--color-fg-muted);">${
      t("dashboard.passwordsCount")
    }</span>
              <div style="width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--color-muted); color: var(--color-primary);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="/icons.svg#key"></use></svg>
              </div>
            </div>
            <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-fg);">${passwordsCount}</div>
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
            <span style="display: inline-block; width: 0.625rem; height: 0.625rem; border-radius: var(--radius-full); background-color: var(--color-success);"></span>
            <span style="font-weight: 600; font-size: var(--text-sm);">${
      t("dashboard.systemStatus")
    }:</span>
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

  unmount() {},
};
