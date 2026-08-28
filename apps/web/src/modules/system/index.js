// apps/web/src/modules/system/index.js — 系统（实时读取 /api/health）
// 部署目标来自后端健康检查端点（DEPLOY_TARGET），其余为运行时静态信息。

import { registerModuleI18n } from "../../shared/lib/module-i18n.js";
import { ensurePageStyles } from "../../shared/lib/styles.js";

registerModuleI18n(import.meta.url);

export function mount(container, ctx) {
  ensurePageStyles(import.meta.url, "../../shared/lib/display-page.css");
  const { t, http } = ctx;

  container.innerHTML = `
    <div class="page-container">
      <header class="page-head">
        <h1 class="page-title">${t("system.menu.title")}</h1>
        <p class="page-subtitle">${t("system.page.subtitle")}</p>
      </header>
      <div class="card-grid" style="max-inline-size:40rem">
        <div class="table-card">
          <dl class="info-card">
            <div class="info-field"><dt>${
    t("system.field.target")
  }</dt><dd id="sys-target">–</dd></div>
            <div class="info-field"><dt>${
    t("system.field.version")
  }</dt><dd id="sys-ver">–</dd></div>
            <div class="info-field"><dt>${
    t("system.field.architecture")
  }</dt><dd id="sys-arch">–</dd></div>
          </dl>
        </div>
      </div>
    </div>`;

  const q = (id) => container.querySelector(`#${id}`);
  const ver = typeof Deno !== "undefined" ? Deno.version.deno : "browser";
  q("sys-ver").textContent = ver;
  const arch = typeof navigator !== "undefined" ? navigator.platform : ver;
  q("sys-arch").textContent = arch;

  http("/api/health").then(({ target }) => {
    q("sys-target").textContent = String(target);
  }).catch(() => {
    q("sys-target").textContent = "–";
  });

  return () => {
    container.innerHTML = "";
  };
}
