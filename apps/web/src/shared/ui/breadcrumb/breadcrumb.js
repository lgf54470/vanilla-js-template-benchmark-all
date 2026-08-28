/**
 * ds-breadcrumb / ds-breadcrumb-item — 面包屑（docs/Components.md §2）。
 *
 * 用法一（light-DOM 子项）：
 *   <ds-breadcrumb>
 *     <ds-breadcrumb-item href="/settings">设置</ds-breadcrumb-item>
 *     <ds-breadcrumb-item>账户</ds-breadcrumb-item>
 *   </ds-breadcrumb>
 * 用法二（items property 传数组 [{label, href?, current?}]，复杂数据
 * 走 property 不进 attribute）。无 href 或 current=true 的项视为当前页
 * （span + aria-current="page"），其余渲染为链接。
 * 分隔符 chevron-right 渲染在 item 自己的 shadow 内——::slotted 只匹配
 * 顶层且无法携带伪元素（docs/bug/2026-08-28-slotted-only-matches-
 * top-level.md），父级 shadow 注入不进子项；当前页/末项不显示分隔符。
 */
import { attachStyles, createIcon } from "../base.js";
import { t } from "../../i18n/translate.js";

const cssUrl = new URL("./breadcrumb.css", import.meta.url).href;

/**
 * @typedef {{ label?: string, href?: string, current?: boolean }} BreadcrumbItem
 */

class DsBreadcrumb extends HTMLElement {
  /** @type {ShadowRoot} */
  #root;
  /** items 数组；null 表示 light-DOM 子项模式 */
  #items = null;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<nav part="base"><ol role="list" part="list"><slot></slot></ol></nav>`;
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#root.querySelector("nav").setAttribute(
      "aria-label",
      t("shell.nav.breadcrumb", "面包屑"),
    );
    this.#renderItems();
  }

  /**
   * items property：传数组时由组件渲染 light-DOM 子项；
   * 传非数组回退 light-DOM 子项模式（不覆盖调用方标记）。
   * @returns {BreadcrumbItem[]}
   */
  get items() {
    return this.#items ?? [];
  }

  set items(value) {
    this.#items = Array.isArray(value) ? value : null;
    this.#renderItems();
  }

  #renderItems() {
    if (this.#items == null || !this.isConnected) return;
    const children = this.#items.map((item) => {
      const el = document.createElement("ds-breadcrumb-item");
      el.textContent = item?.label ?? "";
      if (item?.href) el.setAttribute("href", item.href);
      if (item?.current || !item?.href) el.setAttribute("current", "");
      return el;
    });
    this.replaceChildren(...children);
  }
}

class DsBreadcrumbItem extends HTMLElement {
  static observedAttributes = ["href", "current"];

  /** @type {ShadowRoot} */
  #root;

  constructor() {
    super();
    this.setAttribute("role", "listitem");
    this.#root = this.attachShadow({ mode: "open" });
    this.#render();
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
  }

  attributeChangedCallback() {
    this.#render();
  }

  get href() {
    return this.getAttribute("href") ?? "";
  }

  set href(value) {
    if (value == null || value === "") this.removeAttribute("href");
    else this.setAttribute("href", value);
  }

  get current() {
    return this.hasAttribute("current");
  }

  set current(value) {
    if (value) this.setAttribute("current", "");
    else this.removeAttribute("current");
  }

  #render() {
    const href = this.getAttribute("href");
    const current = this.hasAttribute("current") || !href;
    this.#root.innerHTML = current
      ? `<span class="page" part="page" aria-current="page"><slot></slot></span>`
      : `<a class="link" part="link"><slot></slot></a>`;
    const link = this.#root.querySelector("a");
    if (link) link.setAttribute("href", href);
    const separator = document.createElement("span");
    separator.setAttribute("class", "separator");
    separator.setAttribute("aria-hidden", "true");
    separator.append(createIcon("chevron-right"));
    this.#root.append(separator);
  }
}

customElements.define("ds-breadcrumb", DsBreadcrumb);
customElements.define("ds-breadcrumb-item", DsBreadcrumbItem);
