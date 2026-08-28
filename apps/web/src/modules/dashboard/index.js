// apps/web/src/modules/dashboard/index.js — 仪表盘（纯展示，有少量实时数据）
//
// 统计来自后端实时接口：/api/workspaces（工作空间数）、/api/notes（笔记数）、
// /api/health（部署目标）；模块数取 moduleRegistry 长度。页面用 ds-card + 统计
// 卡片网格（Layout.md §5 信息密度）；样式经 ensurePageStyles 注入。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";
import { iconSvg } from "../../shared/lib/icons.js";
import { moduleRegistry } from "../registry.generated.js";

registerModuleI18n(import.meta.url);

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "./styles/page.css");
  const { t, http } = ctx;

  container.innerHTML = `
    <div class="page-container">
      <header class="page-head">
        <h1 class="page-title">${t("dashboard.menu.title")}</h1>
        <p class="page-subtitle">${t("dashboard.page.subtitle")}</p>
      </header>
      <div class="stat-grid">
        <ds-card><div class="stat-card">
          <span class="stat-icon">${iconSvg("layout-dashboard", 18)}</span>
          <span class="stat-number" id="stat-modules">–</span>
          <span class="stat-label">${t("dashboard.stat.modules")}</span>
        </div></ds-card>
        <ds-card><div class="stat-card">
          <span class="stat-icon">${iconSvg("globe", 18)}</span>
          <span class="stat-number" id="stat-workspaces">–</span>
          <span class="stat-label">${t("dashboard.stat.workspaces")}</span>
        </div></ds-card>
        <ds-card><div class="stat-card">
          <span class="stat-icon">${iconSvg("notebook-pen", 18)}</span>
          <span class="stat-number" id="stat-notes">–</span>
          <span class="stat-label">${t("dashboard.stat.notes")}</span>
        </div></ds-card>
        <ds-card><div class="stat-card">
          <span class="stat-icon">${iconSvg("server", 18)}</span>
          <span class="stat-number" style="font-size:1.1rem" id="stat-target">–</span>
          <span class="stat-label">${t("dashboard.stat.target")}</span>
        </div></ds-card>
      </div>
    </div>`;

  document.querySelector("#stat-modules").textContent = String(
    moduleRegistry.length,
  );

  Promise.allSettled([
    http("/api/workspaces"),
    http("/api/notes"),
    http("/api/health"),
  ]).then(([ws, notes, health]) => {
    container.querySelector("#stat-workspaces").textContent =
      ws.status === "fulfilled" ? String(ws.value.length) : "–";
    container.querySelector("#stat-notes").textContent =
      notes.status === "fulfilled" ? String(notes.value.length) : "–";
    container.querySelector("#stat-target").textContent =
      health.status === "fulfilled" ? String(health.value.target) : "–";
  });

  return () => {
    container.innerHTML = "";
  };
}
