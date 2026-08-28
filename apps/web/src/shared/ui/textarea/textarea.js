/**
 * ds-textarea — 多行文本输入组件（docs/Components.md §2 / §9）。
 *
 * 语义同 ds-input：value / placeholder / disabled / readonly / invalid /
 * name / label / required / error（invalid 时展示的错误文案）；额外支持
 * rows（默认 3）。label 点击聚焦；invalid 时 aria-invalid + aria-describedby。
 * 事件：textarea-change { value }（用户输入时派发，bubbles + composed）。
 */
import { attachStyles } from "../base.js";

const cssUrl = new URL("./textarea.css", import.meta.url).href;

class DsTextarea extends HTMLElement {
  static observedAttributes = [
    "value",
    "placeholder",
    "disabled",
    "readonly",
    "invalid",
    "name",
    "label",
    "required",
    "error",
    "rows",
  ];

  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLTextAreaElement} */
  #textarea;
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
        <textarea part="base" id="control" rows="3"></textarea>
        <p part="error" class="error" id="error" hidden></p>
      </div>`;
    this.#textarea = this.#root.querySelector("textarea");
    this.#label = this.#root.querySelector("label");
    this.#error = this.#root.querySelector(".error");
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#textarea.addEventListener("input", () => {
      this.dispatchEvent(
        new CustomEvent("textarea-change", {
          detail: { value: this.#textarea.value },
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

  /** attribute → 内部 textarea / label / error 的全量同步 */
  #sync() {
    if (!this.#textarea) return;
    this.#textarea.placeholder = this.getAttribute("placeholder") ?? "";
    this.#textarea.disabled = this.hasAttribute("disabled");
    this.#textarea.readOnly = this.hasAttribute("readonly");
    this.#textarea.required = this.hasAttribute("required");
    this.#textarea.name = this.getAttribute("name") ?? "";
    const rows = Number.parseInt(this.getAttribute("rows") ?? "3", 10);
    this.#textarea.rows = Number.isFinite(rows) && rows > 0 ? rows : 3;
    const value = this.getAttribute("value") ?? "";
    if (this.#textarea.value !== value) this.#textarea.value = value;

    const label = this.getAttribute("label") ?? "";
    this.#label.textContent = label;
    this.#label.hidden = label === "";

    const invalid = this.hasAttribute("invalid");
    const error = this.getAttribute("error") ?? "";
    if (invalid) this.#textarea.setAttribute("aria-invalid", "true");
    else this.#textarea.removeAttribute("aria-invalid");
    this.#error.textContent = error;
    this.#error.hidden = !(invalid && error !== "");
    if (invalid && error !== "") {
      this.#textarea.setAttribute("aria-describedby", "error");
    } else {
      this.#textarea.removeAttribute("aria-describedby");
    }
  }

  get value() {
    return this.#textarea?.value ?? "";
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

  get rows() {
    return this.#textarea?.rows ?? 3;
  }

  set rows(value) {
    if (value == null) this.removeAttribute("rows");
    else this.setAttribute("rows", String(value));
  }

  /** 编程式聚焦代理 */
  focus() {
    this.#textarea?.focus();
  }
}

customElements.define("ds-textarea", DsTextarea);
