/**
 * ds-checkbox — 复选框组件（docs/Components.md §2 / §9）。
 *
 * 原生 input[type=checkbox] 的视觉替换：input 透明覆盖在自绘方框上
 * （保留原生语义/键盘/焦点），方框与打勾由兄弟节点 .box 绘制。
 * 属性：checked / disabled / label / name / value。
 * 事件：checkbox-change { checked }（用户切换时派发，bubbles + composed）。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./checkbox.css", import.meta.url).href;

class DsCheckbox extends HTMLElement {
  static observedAttributes = [
    "checked",
    "disabled",
    "label",
    "name",
    "value",
  ];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLInputElement} */
  #input;
  /** @type {HTMLSpanElement} */
  #labelText;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <label class="root">
        <input type="checkbox" id="control" />
        <span class="box" aria-hidden="true"></span>
        <span class="label" part="label"></span>
      </label>`;
    this.#input = this.#root.querySelector("input");
    this.#labelText = this.#root.querySelector(".label");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#input.addEventListener("change", () => {
      if (this.#input.checked) this.setAttribute("checked", "");
      else this.removeAttribute("checked");
      this.dispatchEvent(
        new CustomEvent("checkbox-change", {
          detail: { checked: this.#input.checked },
          bubbles: true,
          composed: true,
        }),
      );
    });
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  /** attribute → 内部 input / label 文案的全量同步 */
  #sync() {
    if (!this.#input) return;
    this.#input.checked = this.hasAttribute("checked");
    this.#input.disabled = this.hasAttribute("disabled");
    this.#input.name = this.getAttribute("name") ?? "";
    this.#input.value = this.getAttribute("value") ?? "on";
    const label = this.getAttribute("label") ?? "";
    this.#labelText.textContent = label;
    this.#labelText.hidden = label === "";
  }

  get checked() {
    return this.#input?.checked ?? this.hasAttribute("checked");
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

  get value() {
    return this.getAttribute("value") ?? "on";
  }

  set value(value) {
    if (value == null) this.removeAttribute("value");
    else this.setAttribute("value", value);
  }

  /** 编程式聚焦代理 */
  focus() {
    this.#input?.focus();
  }
}

customElements.define("ds-checkbox", DsCheckbox);
