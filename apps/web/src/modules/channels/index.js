// apps/web/src/modules/channels/index.js — 频道（纯展示示例列表）
// 静态演示数据（真实后端在 M 系列后续补）。样式用共享 display-page.css。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";

registerModuleI18n(import.meta.url);

const DEMO_CHANNELS = [
  { name: "# 产品讨论", members: 8, desc: "需求与方案评审" },
  { name: "# 技术交流", members: 12, desc: "架构与排障分享" },
  { name: "# 日常灌水", members: 24, desc: "工作之外闲聊" },
];

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "../../shared/lib/display-page.css");
  const { t } = ctx;

  container.innerHTML = `
    <div class="page-container">
      <header class="page-head">
        <h1 class="page-title">${t("channels.menu.title")}</h1>
        <p class="page-subtitle">${t("channels.page.subtitle")}</p>
      </header>
      <div class="table-card" style="--row-cols: 2fr 1fr 2fr">
        ${
    DEMO_CHANNELS.map((c) => `
          <div class="table-row">
            <span class="table-cell"><strong>${c.name}</strong></span>
            <span class="table-cell">${c.members}</span>
            <span class="table-cell">${c.desc}</span>
          </div>`).join("")
  }
      </div>
    </div>`;

  return () => {
    container.innerHTML = "";
  };
}
