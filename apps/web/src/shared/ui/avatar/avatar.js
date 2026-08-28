/**
 * ds-avatar — 头像（docs/Components.md §2）。
 *
 * src: 图片地址（缺省或加载失败降级首字母）；name: 首字母与 img alt
 * 来源；size: sm | default | lg。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./avatar.css", import.meta.url).href;

const SIZES = ["sm", "default", "lg"];

/**
 * 提取最多两个首字母："John Doe" → "JD"；单词（含中文姓名）取首字符。
 * @param {string} name
 * @returns {string}
 */
function initialsOf(name) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

class DsAvatar extends HTMLElement {
  static observedAttributes = ["src", "name", "size"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLSpanElement} */
  #base;
  /** @type {HTMLImageElement} */
  #img;
  /** @type {HTMLSpanElement} */
  #fallback;
  /** 图片加载失败标记（src 变化时复位，避免失败后卡在降级态） */
  #failed = false;
  /** 上一次渲染的 src，用于失败标记复位 */
  #lastSrc = "";

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<span class="avatar" part="base"><img part="image" alt hidden><span part="fallback"></span></span>`;
    this.#base = this.#root.querySelector('[part="base"]');
    this.#img = this.#root.querySelector("img");
    this.#fallback = this.#root.querySelector('[part="fallback"]');
    this.#img.addEventListener("error", () => {
      this.#failed = true;
      this.#showFallback();
    });
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#base) return;
    const size = SIZES.includes(this.getAttribute("size"))
      ? this.getAttribute("size")
      : "default";
    this.#base.dataset.size = size;
    const name = this.getAttribute("name") ?? "";
    this.#img.alt = name;
    this.#fallback.textContent = initialsOf(name) || "?";
    const src = this.getAttribute("src") ?? "";
    if (src !== this.#lastSrc) {
      this.#failed = false;
      this.#lastSrc = src;
    }
    if (src && !this.#failed) {
      this.#img.src = src;
      this.#img.hidden = false;
      this.#fallback.hidden = true;
    } else {
      this.#img.removeAttribute("src");
      this.#showFallback();
    }
  }

  #showFallback() {
    this.#img.hidden = true;
    this.#fallback.hidden = false;
  }

  get src() {
    return this.getAttribute("src") ?? "";
  }

  set src(value) {
    if (value == null || value === "") this.removeAttribute("src");
    else this.setAttribute("src", value);
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value) {
    if (value == null || value === "") this.removeAttribute("name");
    else this.setAttribute("name", value);
  }

  get size() {
    return this.#base?.dataset.size ?? "default";
  }

  set size(value) {
    if (value == null) this.removeAttribute("size");
    else this.setAttribute("size", value);
  }
}

customElements.define("ds-avatar", DsAvatar);
