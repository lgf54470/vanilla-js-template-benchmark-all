/**
 * ds-lang-switch — 三语切换（zh-CN / zh-TW / en，docs/Components.md §2）。
 *
 * 基于 ds-segmented-control 的纯文本三段胶囊（中文简体 / 中文繁體 / English）。
 * 不直接操作 i18n 字典（M5 接入）：仅把选择结果写入 localStorage
 * （STORAGE_KEYS.locale，键 "pref:locale"，与 shared/lib/appearance.js
 * 使用同一份 contracts 常量），并派发 lang-change { locale }。
 */
import { attachStyles } from "../base.js";
import { STORAGE_KEYS } from "/packages/contracts/constants.js";
import "../segmented-control/segmented-control.js";

const cssUrl = new URL("./lang-switch.css", import.meta.url).href;

/** 三语选项（显示名固定为各自语言的自称） */
const LOCALES = [
  { value: "zh-CN", label: "中文简体" },
  { value: "zh-TW", label: "中文繁體" },
  { value: "en", label: "English" },
];

/** 无持久化记录时的默认语言（与 i18n 默认 locale 对齐） */
const DEFAULT_LOCALE = "zh-CN";

class DsLangSwitch extends HTMLElement {
  /** @type {ShadowRoot} */
  #root;
  /** @type {HTMLElement} 内部 ds-segmented-control */
  #control;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML =
      `<ds-segmented-control part="base"></ds-segmented-control>`;
  }

  connectedCallback() {
    attachStyles(this.#root, cssUrl);
    this.#control = this.#root.querySelector("ds-segmented-control");
    this.#control.addEventListener("segmented-change", (event) => {
      const locale = /** @type {CustomEvent<{ value: string }>} */ (event)
        .detail.value;
      this.#persist(locale);
      this.dispatchEvent(
        new CustomEvent("lang-change", {
          detail: { locale },
          bubbles: true,
          composed: true,
        }),
      );
    });
    this.#build();
  }

  /** 重建三个语言段并回填持久化的 locale */
  #build() {
    if (!this.#control) return;
    this.#control.replaceChildren();
    for (const opt of LOCALES) {
      const item = document.createElement("ds-segmented-item");
      item.value = opt.value;
      item.setAttribute("aria-label", opt.label);
      item.append(opt.label);
      this.#control.append(item);
    }
    const stored = this.#stored();
    const current = LOCALES.some((opt) => opt.value === stored)
      ? stored
      : DEFAULT_LOCALE;
    this.#control.value = current;
  }

  /** @returns {string | null} 持久化的 locale（读失败返回 null） */
  #stored() {
    try {
      return localStorage.getItem(STORAGE_KEYS.locale);
    } catch {
      return null;
    }
  }

  /** @param {string} locale */
  #persist(locale) {
    try {
      localStorage.setItem(STORAGE_KEYS.locale, locale);
    } catch {
      /* 隐私模式等场景下静默跳过持久化 */
    }
  }
}

customElements.define("ds-lang-switch", DsLangSwitch);
