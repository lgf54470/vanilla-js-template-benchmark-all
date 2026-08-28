// apps/web/src/shared/ui/masked-field/masked-field.js — <masked-field>
//
// 敏感字段掩码 + 眼睛切换（Database.md §5.3 / Components.md §6）。
// value 通过 **property** 传入（明文不落到可见 attribute，避免 devtools 默认
// 展开视图误泄露）；data-revealed 反映显隐；组件卸载/刷新后重置为掩码。
// 切换按钮 aria-pressed + aria-label（显示明文/隐藏明文）。

import { attachStyles, define } from "../base.js";
import { maskValue } from "../../lib/mask.js";
import { iconSvg } from "../../lib/icons.js";

const CSS = `
:host{display:inline-flex;align-items:center;gap:.35rem;font-variant-numeric:tabular-nums}
.text{font-size:.85rem;color:var(--color-fg)}
button{display:inline-flex;align-items:center;justify-content:center;width:1.5rem;
  height:1.5rem;border-radius:var(--ds-icon-btn-radius);color:var(--color-fg-muted);
  cursor:pointer}
button:hover{background:var(--color-muted);color:var(--color-fg)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
`;

class MaskedField extends HTMLElement {
  static observedAttributes = ["mask-type"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CSS);
    /** @type {string} 明文（property 注入，不反射 attribute） */
    this._value = "";
    this._revealed = false;
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <span class="text"></span>
      <button type="button" class="eye" aria-label="显示明文" aria-pressed="false"></button>`;
    this._text = this.shadowRoot.querySelector(".text");
    this._eye = this.shadowRoot.querySelector(".eye");
    this._eye.innerHTML = iconSvg("eye", 14);
    this._eye.addEventListener("click", () => {
      this._revealed = !this._revealed;
      this._sync();
    });
    this._sync();
  }
  disconnectedCallback() {
    this._revealed = false;
  }
  attributeChangedCallback() {
    if (this._text) this._sync();
  }
  _sync() {
    if (!this._text) return;
    const type = this.getAttribute("mask-type") ?? "generic";
    const shown = this._revealed ? this.value : maskValue(this.value, type);
    this._text.textContent = shown || "—";
    this.toggleAttribute("data-revealed", this._revealed);
    this._eye.setAttribute("aria-pressed", String(this._revealed));
    this._eye.setAttribute(
      "aria-label",
      this._revealed ? "隐藏明文" : "显示明文",
    );
    this._eye.innerHTML = iconSvg(this._revealed ? "eye-off" : "eye", 14);
  }
  /** 明文值（property 注入；赋值即重新掩码渲染） */
  get value() {
    return this._value;
  }
  set value(v) {
    this._value = v ?? "";
    if (this._text) this._sync();
  }
  /** 外部可调用：强制回到掩码态（路由切换时） */
  resetMask() {
    this._revealed = false;
    this._sync();
  }
}
define("masked-field", MaskedField);
