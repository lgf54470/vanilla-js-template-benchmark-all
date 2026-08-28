/**
 * ds-input — 单行文本输入组件（docs/Components.md §2 / §9）。
 *
 * 属性：value / type（默认 text）/ placeholder / disabled / readonly / invalid /
 * name / label / required / error（invalid 时展示的错误文案）。
 * label 与内部 input 通过 id/for 关联（点击 label 聚焦输入框）；invalid 时
 * input 标记 aria-invalid，并用 aria-describedby 关联错误文字。
 * 事件：input-change { value }（用户输入时派发，bubbles + composed）。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./input.css", import.meta.url).href;

class DsInput extends HTMLElement {
  static observedAttributes = [
    "value",
    "type",
    "placeholder",
    "disabled",
    "readonly",
    "invalid",
    "name",
    "label",
    "required",
    "error",
  ];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLInputElement} */
  #input;
  /** @type {HTMLLabelElement} */
  #label;
  /** @type {HTMLParagraphElement} */
  #error;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <div class="field">
        <label part="label" for="control" hidden></label>
        <input part="base" id="control" type="text" />
        <p part="error" class="error" id="error" hidden></p>
      </div>`;
    this.#input = this.#root.querySelector("input");
    this.#label = this.#root.querySelector("label");
    this.#error = this.#root.querySelector(".error");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#input.addEventListener("input", () => {
      this.dispatchEvent(
        new CustomEvent("input-change", {
          detail: { value: this.#input.value },
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

  /** attribute → 内部 input / label / error 的全量同步 */
  #sync() {
    if (!this.#input) return;
    this.#input.type = this.getAttribute("type") ?? "text";
    this.#input.placeholder = this.getAttribute("placeholder") ?? "";
    this.#input.disabled = this.hasAttribute("disabled");
    this.#input.readOnly = this.hasAttribute("readonly");
    this.#input.required = this.hasAttribute("required");
    this.#input.name = this.getAttribute("name") ?? "";
    const value = this.getAttribute("value") ?? "";
    if (this.#input.value !== value) this.#input.value = value;

    const label = this.getAttribute("label") ?? "";
    this.#label.textContent = label;
    this.#label.hidden = label === "";

    const invalid = this.hasAttribute("invalid");
    const error = this.getAttribute("error") ?? "";
    if (invalid) this.#input.setAttribute("aria-invalid", "true");
    else this.#input.removeAttribute("aria-invalid");
    this.#error.textContent = error;
    this.#error.hidden = !(invalid && error !== "");
    if (invalid && error !== "") {
      this.#input.setAttribute("aria-describedby", "error");
    } else {
      this.#input.removeAttribute("aria-describedby");
    }
  }

  get value() {
    return this.#input?.value ?? "";
  }

  set value(value) {
    this.setAttribute("value", value ?? "");
  }

  get type() {
    return this.getAttribute("type") ?? "text";
  }

  set type(value) {
    if (value == null) this.removeAttribute("type");
    else this.setAttribute("type", value);
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

  get readonly() {
    return this.hasAttribute("readonly");
  }

  set readonly(value) {
    if (value) this.setAttribute("readonly", "");
    else this.removeAttribute("readonly");
  }

  get invalid() {
    return this.hasAttribute("invalid");
  }

  set invalid(value) {
    if (value) this.setAttribute("invalid", "");
    else this.removeAttribute("invalid");
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

  get required() {
    return this.hasAttribute("required");
  }

  set required(value) {
    if (value) this.setAttribute("required", "");
    else this.removeAttribute("required");
  }

  get error() {
    return this.getAttribute("error") ?? "";
  }

  set error(value) {
    if (value == null) this.removeAttribute("error");
    else this.setAttribute("error", value);
  }

  /** 编程式聚焦代理 */
  focus() {
    this.#input?.focus();
  }
}

customElements.define("ds-input", DsInput);
