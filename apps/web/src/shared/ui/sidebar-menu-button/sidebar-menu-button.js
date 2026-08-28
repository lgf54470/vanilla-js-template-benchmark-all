/**
 * ds-sidebar-menu-button — 菜单按钮（docs/Components.md §3.4）。
 *
 * 属性：
 * - is-active：当前路由高亮（aria-current="page"）
 * - title：无障碍名 + 收起态 tooltip 文案
 * - href：提供则渲染为链接（导航场景），否则为 button
 * - chevron：右侧 chevron-down 箭头（父 ds-collapsible 的 data-state=open
 *   经 MutationObserver 反射为 data-chevron-open → CSS 旋转 90°）
 * - size: sm | default | lg
 *
 * 收起态（provider collapsed 且 collapsible=icon）：内容裁剪为图标列，
 * 显示 tooltip（side 从下方弹出；icon 条形态下从右侧）。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./sidebar-menu-button.css", import.meta.url).href;

const SIZES = ["sm", "default", "lg"];

class DsSidebarMenuButton extends HTMLElement {
  static observedAttributes = ["is-active", "title", "href", "chevron", "size"];

  #root;
  /** @type {HTMLElement} button 或 a */
  #action;
  #tooltip;
  #chevronIcon;
  #provider;
  #unsubscribe;
  #collapsibleObserver;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    // 内容经 slot 转发进 action 元素；tooltip 仅在收起态注入 content
    this.#root.innerHTML = `<ds-tooltip side="right"></ds-tooltip>`;
    this.#tooltip = this.#root.querySelector("ds-tooltip");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#build();
    this.#provider = this.closest("ds-sidebar-provider");
    if (this.#provider) {
      this.#unsubscribe = this.#provider.store.subscribe((s) =>
        this.#syncTooltip(s)
      );
      this.#syncTooltip(this.#provider.store.get());
    }
    this.#observeCollapsible();
    this.#syncAttrs();
  }

  disconnectedCallback() {
    this.#unsubscribe?.();
    this.#collapsibleObserver?.disconnect();
  }

  attributeChangedCallback() {
    this.#syncAttrs();
    this.#observeCollapsible();
  }

  #build() {
    const href = this.getAttribute("href");
    this.#action = href
      ? document.createElement("a")
      : document.createElement("button");
    if (href) {
      this.#action.setAttribute("href", href);
    } else {
      this.#action.setAttribute("type", "button");
    }
    this.#action.setAttribute("part", "base");
    const slot = document.createElement("slot");
    this.#action.append(slot);
    this.#chevronIcon = createIcon("chevron-down");
    this.#chevronIcon.setAttribute("part", "chevron");
    this.#action.append(this.#chevronIcon);
    this.#tooltip.replaceChildren(this.#action);
  }

  #syncAttrs() {
    if (!this.#action) return;
    const active = this.hasAttribute("is-active");
    this.#action.dataset.active = String(active);
    if (active) this.#action.setAttribute("aria-current", "page");
    else this.#action.removeAttribute("aria-current");

    const size = SIZES.includes(this.getAttribute("size"))
      ? this.getAttribute("size")
      : "default";
    this.#action.dataset.size = size;

    const chevron = this.hasAttribute("chevron");
    this.#chevronIcon.style.display = chevron ? "" : "none";
    if (chevron) {
      this.#action.setAttribute("aria-haspopup", "true");
    } else {
      this.#action.removeAttribute("aria-haspopup");
    }

    const title = this.getAttribute("title");
    if (title) this.#action.setAttribute("aria-label", title);
    else this.#action.removeAttribute("aria-label");
  }

  /**
   * 收起态 tooltip：icon 条形态（provider collapsed + collapsible=icon）下
   * 注入 content；展开态清空（tooltip 组件 content 为空时不显示）。
   * @param {{ state?: string }} s
   */
  #syncTooltip(s) {
    const sidebar = this.closest("ds-sidebar");
    const collapsed = (s.state ?? "expanded") === "collapsed";
    const iconMode = sidebar
      ? sidebar.getAttribute("collapsible") !== "offcanvas" &&
        sidebar.getAttribute("collapsible") !== "none"
      : true;
    const title = this.getAttribute("title") ?? "";
    if (collapsed && iconMode && title) {
      this.#tooltip.setAttribute("content", title);
    } else {
      this.#tooltip.removeAttribute("content");
    }
  }

  /** 监听最近 ds-collapsible 的 open 属性（子菜单展开箭头旋转）。 */
  #observeCollapsible() {
    this.#collapsibleObserver?.disconnect();
    if (!this.hasAttribute("chevron") || !this.isConnected) return;
    const collapsible = this.closest("ds-collapsible");
    if (!collapsible) return;
    const sync = () => {
      this.dataset.chevronOpen = String(collapsible.hasAttribute("open"));
    };
    sync();
    this.#collapsibleObserver = new MutationObserver(sync);
    this.#collapsibleObserver.observe(collapsible, {
      attributeFilter: ["open"],
    });
  }
}

customElements.define("ds-sidebar-menu-button", DsSidebarMenuButton);
