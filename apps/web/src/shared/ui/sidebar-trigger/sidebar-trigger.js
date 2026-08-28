/**
 * ds-sidebar-trigger — 汉堡切换按钮（Header 内，docs/Components.md §3.4）。
 * 点击调用最近 provider 的 toggleSidebar()；aria-label 走 i18n key
 * shell.nav.toggleSidebar（t() 兜底「切换侧栏」）。
 */
import { attachStyles, createIcon } from "../base.js";
import { t } from "../../i18n/translate.js";

const cssUrl = new URL("./sidebar-trigger.css", import.meta.url).href;

class DsSidebarTrigger extends HTMLElement {
  #root;
  #btn;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<button type="button" part="base"><span part="icon"></span></button>`;
    this.#btn = this.#root.querySelector("button");
    this.#root.querySelector('[part="icon"]').append(createIcon("panel-left"));
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#btn.setAttribute(
      "aria-label",
      this.getAttribute("aria-label") ??
        t("shell.nav.toggleSidebar", "切换侧栏"),
    );
    this.#btn.addEventListener("click", () => {
      this.closest("ds-sidebar-provider")?.toggleSidebar();
    });
  }
}

customElements.define("ds-sidebar-trigger", DsSidebarTrigger);
