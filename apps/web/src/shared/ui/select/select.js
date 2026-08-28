/**
 * ds-select — 下拉选择组件（docs/Components.md §2 / §9）。
 *
 * shadow 内原生 select；light DOM 子 <option> 经 <slot> 塞进 select
 * （<slot> 不能走 HTML 解析器——"in select" 插入模式会丢弃未知标签，
 * 故用 DOM API 创建后追加）。触发器对齐 shadcn nova select：描边 input、
 * 高 2rem、右侧 chevron-down 图标（pointer-events:none）。
 *
 * 属性：value / placeholder / disabled / name / label。
 * 事件：select-change { value }（用户选择时派发，bubbles + composed）。
 */
import { attachStyles, createIcon } from "../base.js";

const cssUrl = new URL("./select.css", import.meta.url).href;

class DsSelect extends HTMLElement {
  static observedAttributes = [
    "value",
    "placeholder",
    "disabled",
    "name",
    "label",
  ];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLSelectElement} */
  #select;
  /** @type {HTMLLabelElement} */
  #label;
  /** @type {HTMLOptionElement} */
  #ph;
  /** @type {HTMLSlotElement} */
  #slot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="field">
        <label part="label" for="control" hidden></label>
        <div class="wrap">
          <select part="base" id="control">
            <option class="ph" value="" hidden disabled></option>
          </select>
          <span class="chevron" aria-hidden="true"></span>
        </div>
      </div>`;
    this.#select = this.#root.querySelector("select");
    this.#label = this.#root.querySelector("label");
    this.#ph = this.#root.querySelector(".ph");
    this.#slot = document.createElement("slot");
    this.#select.append(this.#slot);
    this.#root.querySelector(".chevron").append(createIcon("chevron-down"));
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#slot.addEventListener("slotchange", () => this.#applyValue());
    this.#select.addEventListener("change", () => {
      this.setAttribute("value", this.#select.value);
      this.dispatchEvent(
        new CustomEvent("select-change", {
          detail: { value: this.#select.value },
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

  #sync() {
    if (!this.#select) return;
    this.#select.disabled = this.hasAttribute("disabled");
    this.#select.name = this.getAttribute("name") ?? "";
    const label = this.getAttribute("label") ?? "";
    this.#label.textContent = label;
    this.#label.hidden = label === "";
    this.#ph.textContent = this.getAttribute("placeholder") ?? "";
    this.#applyValue();
  }

  /**
   * 把 value 属性应用到内部 select。
   * light DOM <option> 经 slot 异步投影，slotchange 后需重复应用；
   * value 属性缺省且有 placeholder 时回落到占位项。
   */
  #applyValue() {
    if (!this.#select) return;
    const value = this.getAttribute("value");
    if (value != null) this.#select.value = value;
    else if (this.hasAttribute("placeholder")) this.#select.value = "";
  }

  get value() {
    return this.#select?.value ?? "";
  }

  set value(value) {
    this.setAttribute("value", value ?? "");
  }

  get placeholder() {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value) {
    if (value == null) this.removeAttribute("placeholder");
    else this.setAttribute("placeholder", value);
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    if (value) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value) {
    if (value == null) this.removeAttribute("name");
    else this.setAttribute("name", value);
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    if (value == null) this.removeAttribute("label");
    else this.setAttribute("label", value);
  }

  /** 编程式聚焦代理 */
  focus() {
    this.#select?.focus();
  }
}

customElements.define("ds-select", DsSelect);
