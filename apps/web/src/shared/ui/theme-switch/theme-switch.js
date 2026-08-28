// apps/web/src/shared/ui/theme-switch/theme-switch.js
// <ds-theme-switch>（三段胶囊 system/dark/light，Components.md §7）
// <ds-lang-switch>（语言切换）
//
// theme-switch 基于 ds-segmented-control；选中态用 translateX 滑块。
// 值通过 ds-segmented-control-change 事件上抛，由壳层接 appearance 引擎。

import { attachStyles, define } from "../base.js";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../../lib/locales.js";

const THEME_CSS = `
:host{display:inline-flex}
.wrap{position:relative;display:inline-flex;padding:.125rem;
  border-radius:var(--ds-btn-radius);background:var(--color-muted)}
.slider{position:absolute;top:.125rem;bottom:.125rem;width:33.333%;
  border-radius:calc(var(--ds-btn-radius) - .125rem);background:var(--color-bg);
  box-shadow:var(--ds-card-ring)}
button{position:relative;display:inline-flex;align-items:center;justify-content:center;
  width:2rem;padding:.3rem 0;color:var(--color-fg-muted);cursor:pointer}
button[aria-checked="true"]{color:var(--color-fg)}
button:focus-visible{outline:2px solid var(--color-ring);outline-offset:-2px}
`;

class DsThemeSwitch extends HTMLElement {
  static observedAttributes = ["value"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, THEME_CSS);
  }
  connectedCallback() {
    this.setAttribute("role", "radiogroup");
    this.setAttribute("aria-label", "主题");
    this._render();
  }
  attributeChangedCallback() {
    if (this._group) this._render();
  }
  _render() {
    const value = this.getAttribute("value") ?? "system";
    const options = [
      { v: "system", icon: "laptop", label: "system" },
      { v: "dark", icon: "moon", label: "dark" },
      { v: "light", icon: "sun", label: "light" },
    ];
    this.shadowRoot.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const slider = document.createElement("div");
    slider.className = "slider";
    slider.style.left = `${options.findIndex((o) => o.v === value) * 33.333}%`;
    wrap.append(slider);
    options.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(o.v === value));
      btn.setAttribute("aria-label", o.label);
      btn.innerHTML =
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-${o.icon}"></use></svg>`;
      btn.addEventListener("click", () => this._select(o.v));
      wrap.append(btn);
    });
    this.shadowRoot.append(wrap);
    this._group = wrap;
  }
  _select(v) {
    if (this.getAttribute("value") === v) return;
    this.setAttribute("value", v);
    this.dispatchEvent(
      new CustomEvent("ds-theme-switch-change", {
        bubbles: true,
        composed: true,
        detail: { value: v },
      }),
    );
  }
  get value() {
    return this.getAttribute("value") ?? "system";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
}
define("ds-theme-switch", DsThemeSwitch);

const LANG_CSS = `
:host{display:inline-flex}
button.trigger{display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .7rem;
  border-radius:var(--ds-btn-radius);font-size:var(--ds-btn-font-size);
  color:var(--color-fg-muted);cursor:pointer;background:transparent}
button.trigger:hover{background:var(--color-muted);color:var(--color-fg)}
button.trigger:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
.lang-name{font-size:.78rem}
`;

class DsLangSwitch extends HTMLElement {
  static observedAttributes = ["value"];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, LANG_CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu>
        <button slot="trigger" type="button" class="trigger" aria-label="切换语言">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="/icons.svg#i-languages"></use></svg>
          <span class="lang-name"></span>
        </button>
        <div slot="content"></div>
      </ds-dropdown-menu>`;
    this._menu = this.shadowRoot.querySelector("ds-dropdown-menu");
    this._name = this.shadowRoot.querySelector(".lang-name");
    this._content = this.shadowRoot.querySelector("[slot='content']");
    this._content.addEventListener("ds-menu-item-select", (e) => {
      const value = e.detail?.value;
      if (!value || value === this.value) {
        this._menu.close();
        return;
      }
      this.setAttribute("value", value);
      this._menu.close();
      this.dispatchEvent(
        new CustomEvent("ds-lang-switch-change", {
          bubbles: true,
          composed: true,
          detail: { value },
        }),
      );
    });
    this._renderItems();
    this._sync();
  }
  attributeChangedCallback() {
    if (this._name) this._sync();
  }
  _sync() {
    const value = this.getAttribute("value") ?? "zh-CN";
    this._name.textContent = LOCALE_LABELS[value] ?? value;
    this._renderItems();
  }
  _renderItems() {
    if (!this._content) return;
    const value = this.getAttribute("value") ?? "zh-CN";
    this._content.innerHTML = "";
    for (const locale of SUPPORTED_LOCALES) {
      const item = document.createElement("ds-menu-item");
      item.setAttribute("label", LOCALE_LABELS[locale] ?? locale);
      item.setAttribute("value", locale);
      if (locale === value) item.setAttribute("checked", "true");
      this._content.append(item);
    }
  }
  get value() {
    return this.getAttribute("value") ?? "zh-CN";
  }
  set value(v) {
    this.setAttribute("value", v);
  }
}
define("ds-lang-switch", DsLangSwitch);
