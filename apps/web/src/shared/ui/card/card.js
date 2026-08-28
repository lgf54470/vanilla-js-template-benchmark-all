/**
 * ds-card — 卡片容器（docs/Components.md §2）。
 *
 * padding: none | sm | md | lg（缺省走 --ds-card-padding）。
 * 内容经默认 slot 转发；ring/阴影/圆角/内距由 themes/style-*.css 的
 * --ds-card-* 驱动。ring 用 box-shadow 0 0 0 1px 实现（描边色自带
 * 透明度，border 会吃掉盒模型尺寸）；阴影落在 :host、ring 落在
 * .card——--ds-card-shadow 在 nova 为 none，与 ring 逗号复合会产生
 * 非法 box-shadow 导致整条被丢弃，必须分层。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./card.css", import.meta.url).href;

const PADDINGS = ["none", "sm", "md", "lg"];

class DsCard extends HTMLElement {
  static observedAttributes = ["padding"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLDivElement} */
  #card;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `<div class="card" part="base"><slot></slot></div>`;
    this.#card = this.#root.querySelector("div");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#card) return;
    this.#card.dataset.padding = PADDINGS.includes(this.getAttribute("padding"))
      ? this.getAttribute("padding")
      : "default";
  }

  get padding() {
    return this.#card?.dataset.padding ?? "default";
  }

  set padding(value) {
    if (value == null) this.removeAttribute("padding");
    else this.setAttribute("padding", value);
  }
}

customElements.define("ds-card", DsCard);
