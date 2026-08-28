// apps/web/src/modules/logs/index.js — 日志（纯展示示例）
// 静态示例行（真实日志链路在 M 系列后续）。样式用共享 display-page.css。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";

registerModuleI18n(import.meta.url);

const DEMO_LOGS = [
  {
    time: "10:04:22",
    level: "info",
    module: "auth",
    message: "login succeeded",
  },
  {
    time: "10:03:41",
    level: "debug",
    module: "db",
    message: "query ok (1.2ms)",
  },
  { time: "10:02:58", level: "warn", module: "http", message: "slow request" },
  {
    time: "10:01:15",
    level: "info",
    module: "workspace",
    message: "cache invalidated",
  },
];

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "../../shared/lib/display-page.css");
  const { t } = ctx;

  container.innerHTML = `
    <div class="page-container">
      <header class="page-head">
        <h1 class="page-title">${t("logs.menu.title")}</h1>
        <p class="page-subtitle">${t("logs.page.subtitle")}</p>
      </header>
      <div class="table-card" style="--row-cols: 1fr 0.6fr 1fr 3fr">
        <div class="table-row table-row--head">
          <span>${t("logs.col.time")}</span>
          <span>${t("logs.col.level")}</span>
          <span>${t("logs.col.module")}</span>
          <span>${t("logs.col.message")}</span>
        </div>
        ${
    DEMO_LOGS.map((l) => `
          <div class="table-row" style="font-family:var(--font-sans-base)">
            <span class="table-cell">${l.time}</span>
            <span class="table-cell"><ds-badge variant="${
      l.level === "warn" ? "warning" : "outline"
    }">${l.level}</ds-badge></span>
            <span class="table-cell" style="font-weight:600">${l.module}</span>
            <span class="table-cell">${l.message}</span>
          </div>`).join("")
  }
      </div>
    </div>`;

  return () => {
    container.innerHTML = "";
  };
}
