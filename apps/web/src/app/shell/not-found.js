/**
 * app/shell/not-found.js — 路由级 404 视图（ARCHITECTURE §3）。
 */
import "/src/shared/ui/page-placeholder/page-placeholder.js";
import { t } from "/src/shared/i18n/translate.js";

/**
 * 把 404 占位渲染进 <main>。
 * @param {HTMLElement} mainEl
 * @param {string} path 未命中的路径
 */
export function renderNotFound(mainEl, path) {
  const el = document.createElement("ds-page-placeholder");
  el.setAttribute("state", "empty");
  el.setAttribute("title", t("shell.notFound.title", "页面不存在"));
  el.setAttribute(
    "description",
    t("shell.notFound.description", `没有找到与 ${path} 对应的页面`),
  );
  mainEl.replaceChildren(el);
}
