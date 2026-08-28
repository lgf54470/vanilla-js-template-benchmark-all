/**
 * ds-badge — 状态徽标（docs/Components.md §2）。
 *
 * variant: default | secondary | success | warning | danger。
 * danger 用软底 + danger 文本（对齐 ds-button danger 变体语义）。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./badge.css", import.meta.url).href;

const VARIANTS = ["default", "secondary", "success", "warning", "danger"];

class DsBadge extends HTMLElement {
  static observedAttributes = ["variant"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLSpanElement} */
  #badge;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<span class="badge" part="base"><slot></slot></span>`;
    this.#badge = this.#root.querySelector("span");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this.#badge) return;
    const variant = VARIANTS.includes(this.getAttribute("variant"))
      ? this.getAttribute("variant")
      : "default";
    this.#badge.dataset.variant = variant;
  }

  get variant() {
    return this.#badge?.dataset.variant ?? "default";
  }

  set variant(value) {
    if (value == null) this.removeAttribute("variant");
    else this.setAttribute("variant", value);
  }
}

customElements.define("ds-badge", DsBadge);
