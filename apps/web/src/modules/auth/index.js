// apps/web/src/modules/auth/index.js — 认证（信息页）
// 说明单密码门控的会话安全；具体设置（会话时长/改密码）跳转「设置 → 账户」。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";
import { iconSvg } from "../../shared/lib/icons.js";

registerModuleI18n(import.meta.url);

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "../../shared/lib/display-page.css");
  const { t, navigate } = ctx;

  container.innerHTML = `
    <div class="page-container">
      <header class="page-head">
        <h1 class="page-title">${t("auth.menu.title")}</h1>
        <p class="page-subtitle">${t("auth.page.subtitle")}</p>
      </header>
      <div class="card-grid" style="max-inline-size:40rem">
        <a class="doc-card" href="#" id="link">
          <span class="doc-card__title">
            <span>${iconSvg("shield", 15)} ${t("auth.card.title")}</span>
            ${iconSvg("arrow-right", 14)}
          </span>
          <span class="doc-card__desc">${t("auth.card.desc")}</span>
        </a>
      </div>
    </div>`;

  container.querySelector("#link").addEventListener("click", (e) => {
    e.preventDefault();
    navigate("/settings/account");
  });

  return () => {
    container.innerHTML = "";
  };
}
