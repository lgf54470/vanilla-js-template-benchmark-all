/**
 * masked-field — 敏感字段掩码（docs/Components.md §6 / Database.md §5.3）。
 *
 * mask-type: email | phone | generic，掩码策略：
 *   email   → 首字符 + *** + @域名（无 @ 走 generic 兜底）
 *   phone   → 前 3 后 4 中间 ***（不足 8 位走 generic 兜底）
 *   generic → 保留首尾各 1 字符，中间 ***
 * 明文 value 只走 property（内部 #value 私有持有，禁止反射进
 * attribute，避免 devtools Elements 面板默认展开视图泄露明文）。
 * 眼睛按钮切换明文/掩码：宿主 data-revealed + 按钮 aria-pressed
 * 反映状态；事件 masked-reveal-change {revealed}；
 * disconnectedCallback 重置回掩码态（明文展示状态不跨挂载持久化）。
 */
import { attachStyles, createIcon } from "../base.js";
import { t } from "../../i18n/translate.js";

const cssUrl = new URL("./masked-field.css", import.meta.url).href;

const MASK_TYPES = ["email", "phone", "generic"];

/**
 * generic 掩码：保留首尾各 1 字符，中间 ***。
 * @param {string} value
 * @returns {string}
 */
function maskGeneric(value) {
  if (value.length === 0) return "";
  if (value.length === 1) return "*";
  return value[0] + "***" + value[value.length - 1];
}

/**
 * email 掩码：首字符 + *** + @域名；无 @（或空本地部分）走 generic 兜底。
 * @param {string} value
 * @returns {string}
 */
function maskEmail(value) {
  const at = value.indexOf("@");
  if (at < 1 || at === value.length - 1) return maskGeneric(value);
  return value[0] + "***" + value.slice(at);
}

/**
 * phone 掩码：前 3 后 4 中间 ***；不足 8 位走 generic 兜底。
 * @param {string} value
 * @returns {string}
 */
function maskPhone(value) {
  if (value.length >= 8) {
    return value.slice(0, 3) + "***" + value.slice(-4);
  }
  return maskGeneric(value);
}

/**
 * 按 mask-type 选择掩码策略。
 * @param {string} value
 * @param {string} type
 * @returns {string}
 */
function maskValue(value, type) {
  if (type === "email") return maskEmail(value);
  if (type === "phone") return maskPhone(value);
  return maskGeneric(value);
}

class MaskedField extends HTMLElement {
  static observedAttributes = ["mask-type"];

  /** @type {ShadowRoot} */
  #root;
  /** 明文值（私有字段，禁止反射到 attribute） */
  #value = "";
  /** @type {boolean} */
  #revealed = false;
  /** @type {HTMLSpanElement} */
  #valueEl;
  /** @type {HTMLButtonElement} */
  #toggleBtn;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = `
      <span class="field" part="base">
        <span part="value"></span>
        <button type="button" part="toggle"></button>
      </span>`;
    this.#valueEl = this.#root.querySelector('[part="value"]');
    this.#toggleBtn = this.#root.querySelector("button");
    this.#toggleBtn.addEventListener("click", () => this.#toggle());
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  disconnectedCallback() {
    this.#revealed = false;
    this.#sync();
  }

  /** 明文值（只进 property，不反射 attribute） */
  get value() {
    return this.#value;
  }

  set value(value) {
    this.#value = value == null ? "" : String(value);
    this.#sync();
  }

  get maskType() {
    return MASK_TYPES.includes(this.getAttribute("mask-type"))
      ? this.getAttribute("mask-type")
      : "generic";
  }

  set maskType(value) {
    if (value == null) this.removeAttribute("mask-type");
    else this.setAttribute("mask-type", value);
  }

  /** 当前是否显示明文（只读） */
  get revealed() {
    return this.#revealed;
  }

  #toggle() {
    this.#revealed = !this.#revealed;
    this.#sync();
    this.dispatchEvent(
      new CustomEvent("masked-reveal-change", {
        detail: { revealed: this.#revealed },
        bubbles: true,
      }),
    );
  }

  #sync() {
    if (!this.#valueEl) return;
    this.#valueEl.textContent = this.#revealed
      ? this.#value
      : maskValue(this.#value, this.maskType);
    if (this.#revealed) this.setAttribute("data-revealed", "");
    else this.removeAttribute("data-revealed");
    this.#toggleBtn.replaceChildren(
      createIcon(this.#revealed ? "eye-off" : "eye"),
    );
    this.#toggleBtn.setAttribute("aria-pressed", String(this.#revealed));
    this.#toggleBtn.setAttribute(
      "aria-label",
      this.#revealed
        ? t("shell.maskedField.hide", "隐藏明文")
        : t("shell.maskedField.show", "显示明文"),
    );
  }
}

customElements.define("masked-field", MaskedField);
