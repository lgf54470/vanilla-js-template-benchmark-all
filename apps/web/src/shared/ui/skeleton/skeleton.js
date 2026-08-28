/**
 * ds-skeleton — 骨架屏（docs/Design.md §6 / Components.md §2）。
 *
 * variant: text | circle | rect；width/height 属性透传为宿主内联样式
 * （单位由调用方自带，如 "8rem" / "100%"），缺省尺寸按 variant 落在
 * :host 规则上、会被内联样式覆盖。装饰性元素统一 aria-hidden。
 * 背景脉冲动画由全站 no-motion 压制，本组件不写任何 animation。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./skeleton.css", import.meta.url).href;

const VARIANTS = ["text", "circle", "rect"];

class DsSkeleton extends HTMLElement {
  static observedAttributes = ["variant", "width", "height"];

  /** @type {ShadowRoot} */
  #root;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    if (!this.hasAttribute("aria-hidden")) {
      this.setAttribute("aria-hidden", "true");
    }
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    const variant = VARIANTS.includes(this.getAttribute("variant"))
      ? this.getAttribute("variant")
      : "text";
    this.dataset.variant = variant;
    for (const prop of ["width", "height"]) {
      const value = this.getAttribute(prop);
      if (value == null || value === "") {
        this.style.removeProperty(prop);
      } else {
        this.style.setProperty(prop, value);
      }
    }
  }

  get variant() {
    return this.dataset.variant || "text";
  }

  set variant(value) {
    if (value == null) this.removeAttribute("variant");
    else this.setAttribute("variant", value);
  }

  get width() {
    return this.getAttribute("width") ?? "";
  }

  set width(value) {
    if (value == null || value === "") this.removeAttribute("width");
    else this.setAttribute("width", value);
  }

  get height() {
    return this.getAttribute("height") ?? "";
  }

  set height(value) {
    if (value == null || value === "") this.removeAttribute("height");
    else this.setAttribute("height", value);
  }
}

customElements.define("ds-skeleton", DsSkeleton);
