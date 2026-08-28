/**
 * ds-sidebar-rail — 侧栏内缘细条，桌面态点击切换展开/收起，移动态隐藏
 * （docs/Components.md §3.4）。放在 <ds-sidebar> 内部，由渲染层组装。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./sidebar-rail.css", import.meta.url).href;

class DsSidebarRail extends HTMLElement {
  #root;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `<div part="rail" role="presentation"></div>`;
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#root.querySelector('[part="rail"]').addEventListener("click", () => {
      this.closest("ds-sidebar-provider")?.toggleSidebar();
    });
  }
}

customElements.define("ds-sidebar-rail", DsSidebarRail);
