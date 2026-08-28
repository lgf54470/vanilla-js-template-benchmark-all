/**
 * ds-button — 按钮组件（docs/Components.md §2）。
 *
 * variant: primary | secondary | outline | ghost | danger
 * size: sm | default | lg
 * 事件：原生 click 透传（shadow 内 button 已处理 disabled 拦截）。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./button.css", import.meta.url).href;

const VARIANTS = ["primary", "secondary", "outline", "ghost", "danger"];
const SIZES = ["sm", "default", "lg"];

class DsButton extends HTMLElement {
  static observedAttributes = ["variant", "size", "disabled"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLButtonElement} */
  #btn;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<button type="button" part="base"><slot></slot></button>`;
    this.#btn = this.#root.querySelector("button");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#btn) return;
    const variant = VARIANTS.includes(this.getAttribute("variant"))
      ? this.getAttribute("variant")
      : "primary";
    const size = SIZES.includes(this.getAttribute("size"))
      ? this.getAttribute("size")
      : "default";
    this.#btn.dataset.variant = variant;
    this.#btn.dataset.size = size;
    const disabled = this.hasAttribute("disabled");
    this.#btn.disabled = disabled;
    this.#btn.setAttribute("aria-disabled", String(disabled));
  }

  get variant() {
    return this.#btn?.dataset.variant ?? "primary";
  }

  set variant(value) {
    if (value == null) this.removeAttribute("variant");
    else this.setAttribute("variant", value);
  }

  get size() {
    return this.#btn?.dataset.size ?? "default";
  }

  set size(value) {
    if (value == null) this.removeAttribute("size");
    else this.setAttribute("size", value);
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  /** 编程式聚焦代理 */
  focus() {
    this.#btn?.focus();
  }
}

customElements.define("ds-button", DsButton);
