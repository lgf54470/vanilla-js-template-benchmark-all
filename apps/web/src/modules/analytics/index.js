import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };

registerTranslations("zh-CN", "analytics", zhCN);
registerTranslations("zh-TW", "analytics", zhTW);
registerTranslations("en", "analytics", en);

export default {
  async mount(container, { workspaceId }) {
    const token = localStorage.getItem("auth:token") || "";
    const headers = { "x-auth-password": token, "x-workspace-id": workspaceId };

    let n = 12, td = 8, bm = 15, pwd = 6;
    try {
      const [notesRes, todoRes, bmRes, pwdRes] = await Promise.allSettled([
        fetch("/api/notes", { headers }).then((r) => r.json()),
        fetch("/api/todo", { headers }).then((r) => r.json()),
        fetch("/api/bookmarks", { headers }).then((r) => r.json()),
        fetch("/api/passwords", { headers }).then((r) => r.json()),
      ]);
      if (notesRes.status === "fulfilled" && notesRes.value.ok) n = notesRes.value.data.length || 1;
      if (todoRes.status === "fulfilled" && todoRes.value.ok) td = todoRes.value.data.length || 1;
      if (bmRes.status === "fulfilled" && bmRes.value.ok) bm = bmRes.value.data.length || 1;
      if (pwdRes.status === "fulfilled" && pwdRes.value.ok) pwd = pwdRes.value.data.length || 1;
    } catch {
      // Fallback sample values
    }

    const total = n + td + bm + pwd;
    const nPct = Math.round((n / total) * 100);
    const tdPct = Math.round((td / total) * 100);
    const bmPct = Math.round((bm / total) * 100);
    const pwdPct = 100 - nPct - tdPct - bmPct;

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div>
            <h1 class="page-title">${t("analytics.title")}</h1>
            <p class="page-description">${t("analytics.description")}</p>
          </div>
        </div>

        <div class="card-grid">
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-4);">${
      t("analytics.resourceDistribution")
    }</div>
            <div style="display: flex; height: 1.5rem; border-radius: var(--radius-md); overflow: hidden; background-color: var(--color-muted);">
              <div style="width: ${nPct}%; background-color: var(--chart-1);" title="${
      t("analytics.notesRatio")
    }: ${nPct}%"></div>
              <div style="width: ${tdPct}%; background-color: var(--chart-2);" title="${
      t("analytics.todoRatio")
    }: ${tdPct}%"></div>
              <div style="width: ${bmPct}%; background-color: var(--chart-3);" title="${
      t("analytics.bookmarksRatio")
    }: ${bmPct}%"></div>
              <div style="width: ${pwdPct}%; background-color: var(--chart-4);" title="${
      t("analytics.passwordsRatio")
    }: ${pwdPct}%"></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-4);">
              <div style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm);">
                <span style="display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: var(--radius-sm); background-color: var(--chart-1);"></span>
                <span>${t("analytics.notesRatio")} (${nPct}%)</span>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm);">
                <span style="display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: var(--radius-sm); background-color: var(--chart-2);"></span>
                <span>${t("analytics.todoRatio")} (${tdPct}%)</span>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm);">
                <span style="display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: var(--radius-sm); background-color: var(--chart-3);"></span>
                <span>${t("analytics.bookmarksRatio")} (${bmPct}%)</span>
              </div>
              <div style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm);">
                <span style="display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: var(--radius-sm); background-color: var(--chart-4);"></span>
                <span>${t("analytics.passwordsRatio")} (${pwdPct}%)</span>
              </div>
            </div>
          </ds-card>

          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-4);">${
      t("analytics.weeklyActivity")
    }</div>
            <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 8rem; gap: var(--space-2); padding-top: var(--space-4);">
              ${
      ["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day, idx) => {
        const heightPct = [40, 65, 80, 50, 95, 30, 60][idx];
        return `
                  <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-1); flex: 1;">
                    <div style="width: 100%; height: ${heightPct}%; background-color: var(--chart-1); border-radius: var(--radius-sm); min-height: 4px;"></div>
                    <span style="font-size: var(--text-2xs); color: var(--color-fg-muted);">${day}</span>
                  </div>
                `;
      }).join("")
    }
            </div>
          </ds-card>
        </div>
      </div>
    `;
  },
  unmount() {},
};
