/**
 * ds-theme-switch — 三段胶囊主题切换（docs/Components.md §7）。
 *
 * 基于 ds-segmented-control：system / light / dark 三项，图标依次为
 * monitor / sun / moon；compact 属性切换"图标+文本"与"纯图标"两种形态。
 * 初值读 shared/lib/appearance.js 已持久化偏好；用户选择后经
 * setAppearance 应用 + 持久化（并广播 document appearancechange），
 * 同时派发 theme-change { theme }；监听 appearancechange 反向同步
 * 外部（如设置面板）发起的主题变更。
 */
import { attachStyles, createIcon } from "../base.js";
import { getStoredAppearance, setAppearance } from "../../lib/appearance.js";
import "../segmented-control/segmented-control.js";

const cssUrl = new URL("./theme-switch.css", import.meta.url).href;

/** 三段选项（label 为 i18n 接入前的界面文案，M5 后走字典） */
const OPTIONS = [
  { value: "system", icon: "monitor", label: "跟随系统" },
  { value: "light", icon: "sun", label: "浅色" },
  { value: "dark", icon: "moon", label: "深色" },
];

class DsThemeSwitch extends HTMLElement {
  static observedAttributes = ["compact"];

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
      const theme = /** @type {CustomEvent<{ value: string }>} */ (event)
        .detail.value;
      setAppearance({ theme });
      this.dispatchEvent(
        new CustomEvent("theme-change", {
          detail: { theme },
          bubbles: true,
          composed: true,
        }),
      );
    });
    document.addEventListener("appearancechange", this.#onAppearanceChange);
    this.#build();
  }

  disconnectedCallback() {
    document.removeEventListener("appearancechange", this.#onAppearanceChange);
  }

  attributeChangedCallback(name) {
    if (name === "compact" && this.#control) this.#build();
  }

  /** 外观引擎广播（可能来自其它组件）：静默同步选中段，不派发事件 */
  #onAppearanceChange = (event) => {
    const theme = /** @type {CustomEvent<{ theme?: string }>} */ (event).detail
      ?.theme;
    if (theme && this.#control) this.#control.value = theme;
  };

  /** 按当前 compact 形态重建三个选项段并回填当前主题 */
  #build() {
    if (!this.#control) return;
    const compact = this.hasAttribute("compact");
    this.#control.replaceChildren();
    for (const opt of OPTIONS) {
      const item = document.createElement("ds-segmented-item");
      item.value = opt.value;
      item.setAttribute("aria-label", opt.label);
      if (compact) item.setAttribute("data-compact", "");
      item.append(createIcon(opt.icon));
      if (!compact) item.append(opt.label);
      this.#control.append(item);
    }
    this.#control.value = getStoredAppearance().theme;
  }

  get compact() {
    return this.hasAttribute("compact");
  }

  set compact(value) {
    if (value) this.setAttribute("compact", "");
    else this.removeAttribute("compact");
  }
}

customElements.define("ds-theme-switch", DsThemeSwitch);
