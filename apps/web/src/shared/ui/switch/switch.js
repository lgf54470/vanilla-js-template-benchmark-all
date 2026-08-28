/**
 * ds-switch — 开关组件（docs/Components.md §2 / §9）。
 *
 * button[role="switch"][aria-checked] 承载轨道，内部 .thumb 滑块在选中时
 * 用 transform: translateX 位移（全站 no-motion 下瞬时切换）。
 * 属性：checked / disabled / label / name。
 * 事件：switch-change { checked }（用户切换时派发，bubbles + composed）。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./switch.css", import.meta.url).href;

class DsSwitch extends HTMLElement {
  static observedAttributes = ["checked", "disabled", "label", "name"];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLButtonElement} */
  #btn;
  /** @type {HTMLSpanElement} */
  #labelText;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <label class="root">
        <button type="button" role="switch" aria-checked="false" part="base">
          <span class="thumb" aria-hidden="true"></span>
        </button>
        <span class="label" part="label"></span>
      </label>`;
    this.#btn = this.#root.querySelector("button");
    this.#labelText = this.#root.querySelector(".label");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#btn.addEventListener("click", () => this.#toggle());
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  /** 点击/键盘（Enter、Space 触发 button 原生 click）切换开关 */
  #toggle() {
    if (this.#btn.disabled) return;
    const next = !this.hasAttribute("checked");
    if (next) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
    this.dispatchEvent(
      new CustomEvent("switch-change", {
        detail: { checked: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** attribute → 内部 button / label 文案的全量同步 */
  #sync() {
    if (!this.#btn) return;
    this.#btn.setAttribute(
      "aria-checked",
      String(this.hasAttribute("checked")),
    );
    this.#btn.disabled = this.hasAttribute("disabled");
    const label = this.getAttribute("label") ?? "";
    this.#labelText.textContent = label;
    this.#labelText.hidden = label === "";
  }

  get checked() {
    return this.hasAttribute("checked");
  }

  set checked(value) {
    if (value) this.setAttribute("checked", "");
    else this.removeAttribute("checked");
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    if (value == null) this.removeAttribute("label");
    else this.setAttribute("label", value);
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value) {
    if (value == null) this.removeAttribute("name");
    else this.setAttribute("name", value);
  }

  /** 编程式聚焦代理 */
  focus() {
    this.#btn?.focus();
  }
}

customElements.define("ds-switch", DsSwitch);
