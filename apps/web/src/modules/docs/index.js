// apps/web/src/modules/docs/index.js — 文档导航（纯展示，链接到 docs/）
// 卡片导航指向仓库 docs/ 技术文档。样式用共享 display-page.css。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";
import { iconSvg } from "../../shared/lib/icons.js";

registerModuleI18n(import.meta.url);

const DOC_LINKS = [
  {
    key: "architecture",
    href: "/docs/ARCHITECTURE.md",
    icon: "layout-dashboard",
  },
  { key: "database", href: "/docs/Database.md", icon: "database" },
  { key: "deployment", href: "/docs/Deployment.md", icon: "globe" },
  { key: "design", href: "/docs/Design.md", icon: "sparkles" },
];

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "../../shared/lib/display-page.css");
  const { t } = ctx;

  container.innerHTML = `
    <div class="page-container">
      <header class="page-head">
        <h1 class="page-title">${t("docs.menu.title")}</h1>
        <p class="page-subtitle">${t("docs.page.subtitle")}</p>
      </header>
      <div class="card-grid">
        ${
    DOC_LINKS.map((d) => `
          <a class="doc-card" href="${d.href}" target="_blank" rel="noopener">
            <span class="doc-card__title">
              <span>${iconSvg(d.icon, 15)} ${t(`docs.card.${d.key}`)}</span>
              ${iconSvg("external-link", 14)}
            </span>
            <span class="doc-card__desc">${t(`docs.card.${d.key}.desc`)}</span>
          </a>`).join("")
  }
      </div>
    </div>`;

  return () => {
    container.innerHTML = "";
  };
}
