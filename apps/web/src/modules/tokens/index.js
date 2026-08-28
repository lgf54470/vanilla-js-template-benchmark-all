// apps/web/src/modules/tokens/index.js — 令牌（纯展示；敏感字段掩码演示）
// 演示数据展示 API Key 的掩码显示（masked-field，硬规则 9 前端掩码）。无后端。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";

registerModuleI18n(import.meta.url);

const DEMO_KEYS = [
  {
    name: "部署令牌",
    value: "fbk_live_9f2a3c77d41e2b08a5cd96f0e1",
    createdAt: "2026-08-12",
  },
  {
    name: "集成测试",
    value: "fbk_test_31b66a09f7dc45e27a90b1c8d3",
    createdAt: "2026-08-20",
  },
];

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "../../shared/lib/display-page.css");
  const { t } = ctx;

  container.innerHTML = `
    <div class="page-container">
      <header class="page-head">
        <h1 class="page-title">${t("tokens.menu.title")}</h1>
        <p class="page-subtitle">${t("tokens.page.subtitle")}</p>
      </header>
      <div class="table-card" id="key-table" style="--row-cols: 1.2fr 2fr 1fr 1fr">
        <div class="table-row table-row--head">
          <span>${t("tokens.col.name")}</span>
          <span>${t("tokens.col.value")}</span>
          <span>${t("tokens.col.createdAt")}</span>
          <span>${t("tokens.col.status")}</span>
        </div>
      </div>
    </div>`;

  // 掩码值经 property 注入（不落 attribute，避免敏感明文进 DOM，硬规则 9）
  const table = container.querySelector("#key-table");
  for (const k of DEMO_KEYS) {
    const row = document.createElement("div");
    row.className = "table-row";
    const name = document.createElement("span");
    name.className = "table-cell";
    const strong = document.createElement("strong");
    strong.textContent = k.name;
    name.append(strong);
    const value = document.createElement("span");
    value.className = "table-cell";
    const masked = document.createElement("masked-field");
    masked.style.fontFamily = "var(--font-sans-base)";
    masked.value = k.value; // property，不落 attribute
    value.append(masked);
    const created = document.createElement("span");
    created.className = "table-cell";
    created.textContent = k.createdAt;
    const status = document.createElement("span");
    status.className = "table-cell";
    status.innerHTML = `<ds-badge variant="success">${
      t("tokens.status.active")
    }</ds-badge>`;
    row.append(name, value, created, status);
    table.append(row);
  }

  return () => {
    container.innerHTML = "";
  };
}
