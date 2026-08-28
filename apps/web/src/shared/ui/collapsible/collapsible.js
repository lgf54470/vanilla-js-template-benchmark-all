/**
 * ds-collapsible — 折叠容器（Sidebar 子菜单复用，docs/Components.md §3.4）。
 *
 * open：状态属性（attribute + property 双向，反映 data-state）；
 * default-open：仅首次挂载生效的初始展开标记（open 已存在时优先 open）。
 * slot="trigger" 为触发区（内部以原生 button 包裹，支持点击/空格/回车，
 * aria-expanded / aria-controls 关联内容区）；默认 slot 为内容，关闭时
 * hidden；右侧 chevron 图标随 data-state="open" 用 transform 旋转
 * 90deg（瞬时切换，非动画）。
 * 事件：collapsible-open-change {open}（仅用户交互触发派发）。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./collapsible.css", import.meta.url).href;

/** 内容区 id 序列（aria-controls 关联用） */
let nextId = 0;

class DsCollapsible extends HTMLElement {
  static observedAttributes = ["open"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLDivElement} */
  #base;
  /** @type {HTMLButtonElement} */
  #trigger;
  /** @type {HTMLDivElement} */
  #content;
  /** 首次挂载标记（default-open 只生效一次，重挂不重置状态） */
  #initialized = false;

  constructor() {
    super();
    nextId += 1;
    const contentId = `ds-collapsible-content-${nextId}`;
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="collapsible" part="base" data-state="closed">
        <button type="button" part="trigger" aria-expanded="false" aria-controls="${contentId}">
          <slot name="trigger"></slot>
          <span class="chevron" part="chevron"></span>
        </button>
        <div class="content" part="content" id="${contentId}" hidden><slot></slot></div>
      </div>`;
    this.#base = this.#root.querySelector('[part="base"]');
    this.#trigger = this.#root.querySelector("button");
    this.#content = this.#root.querySelector('[part="content"]');
    this.#root.querySelector('[part="chevron"]').append(
      createIcon("chevron-right"),
    );
    this.#trigger.addEventListener("click", () => this.#toggle());
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    if (!this.#initialized) {
      this.#initialized = true;
      if (!this.hasAttribute("open") && this.hasAttribute("default-open")) {
        this.setAttribute("open", "");
      }
    }
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(value) {
    if (value) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  get defaultOpen() {
    return this.hasAttribute("default-open");
  }

  set defaultOpen(value) {
    if (value) this.setAttribute("default-open", "");
    else this.removeAttribute("default-open");
  }

  #toggle() {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent("collapsible-open-change", {
        detail: { open: this.open },
        bubbles: true,
      }),
    );
  }

  #sync() {
    if (!this.#trigger) return;
    const open = this.hasAttribute("open");
    this.#base.dataset.state = open ? "open" : "closed";
    this.#trigger.setAttribute("aria-expanded", String(open));
    this.#content.hidden = !open;
  }
}

customElements.define("ds-collapsible", DsCollapsible);
