/**
 * app/shell/theme-settings.js — 主题设置面板（docs/Layout.md §3、ARCHITECTURE §6.3）。
 *
 * Header 里的入口（<ds-theme-settings>）：palette 图标按钮 + 下拉面板。
 * 面板为 light DOM（chart-/base- 预览类来自全局调色板样式表，shadow 内
 * 不生效，见 preview-icons.js）；样式经 ensurePageStyles 注入。
 *
 * 分组：风格(8) / 基色(7) / 图表色(12，磁贴预览) / 圆角(4) /
 * 正文字体(3) / 标题字体(3) / 菜单外观(3) / 侧栏变体(3) / 折叠模式(3)。
 * 全部即改即存（pref:* 键，经 appearance 引擎统一应用与广播）。
 */
import { ensurePageStyles } from "/src/shared/lib/page-styles.js";
import { composedPathContains } from "/src/shared/lib/dom.js";
import { t } from "/src/shared/i18n/translate.js";
import {
  BASE_COLOR_NAMES,
  CHART_COLOR_NAMES,
  FONT_FAMILIES,
  getSidebarCollapsible,
  getSidebarVariant,
  getStoredAppearance,
  MENU_APPEARANCES,
  RADIUS_STEPS,
  setAppearance,
  setSidebarCollapsible,
  setSidebarVariant,
  STYLE_NAMES,
} from "/src/shared/lib/appearance.js";
import { createChartPreview } from "./preview-icons.js";
import "/src/shared/ui/icon-button/icon-button.js";

const RADIUS_LABELS = { none: "无", small: "小", medium: "中", large: "大" };
const MENU_LABELS = { subtle: "淡雅", bold: "加粗", inverted: "反色" };
const VARIANT_LABELS = { sidebar: "常规", floating: "悬浮", inset: "内嵌" };
const COLLAPSIBLE_LABELS = {
  offcanvas: "覆盖",
  icon: "图标",
  none: "不可折叠",
};

class DsThemeSettings extends HTMLElement {
  /** @type {HTMLElement} */
  #trigger;
  /** @type {HTMLElement} */
  #panel;
  #open = false;
  #unsubscribers = [];

  connectedCallback() {
    ensurePageStyles(import.meta.url, "./theme-settings.css");

    this.innerHTML =
      `<ds-icon-button icon="palette" class="ts-trigger"></ds-icon-button>` +
      `<div class="ts-panel" role="dialog" aria-label="${
        t("shell.themeSettings", "主题设置")
      }" hidden></div>`;
    this.#trigger = this.querySelector(".ts-trigger");
    this.#trigger.setAttribute(
      "aria-label",
      t("shell.themeSettings", "主题设置"),
    );
    this.#trigger.setAttribute("aria-haspopup", "dialog");
    this.#panel = this.querySelector(".ts-panel");

    this.#trigger.addEventListener("click", () => this.#toggle());
    this.#unsubscribers.push(
      onDoc("click", (e) => {
        if (this.#open && !composedPathContains(e, this)) this.#close();
      }),
      onDoc("keydown", (e) => {
        if (e.key === "Escape" && this.#open) this.#close();
      }),
      onDoc("appearancechange", () => this.#render()),
      onDoc("sidebar-change", () => this.#render()),
    );
    this.#render();
  }

  disconnectedCallback() {
    for (const off of this.#unsubscribers) off();
    this.#unsubscribers = [];
  }

  #toggle() {
    this.#open ? this.#close() : this.#openPanel();
  }

  #openPanel() {
    this.#open = true;
    this.#panel.hidden = false;
    this.#trigger.setAttribute("aria-expanded", "true");
  }

  #close() {
    this.#open = false;
    this.#panel.hidden = true;
    this.#trigger.setAttribute("aria-expanded", "false");
  }

  /** 按当前持久化偏好重建面板（每次开关/偏好变化时全量重绘，规模小无压力）。 */
  #render() {
    if (!this.#panel) return;
    const prefs = getStoredAppearance();
    const sections = [
      this.#textSection(
        t("theme.style", "风格"),
        STYLE_NAMES.map((name) => ({
          value: name,
          label: name[0].toUpperCase() + name.slice(1),
          selected: prefs.style === name,
          apply: () => setAppearance({ style: name }),
        })),
      ),
      this.#swatchSection(
        t("theme.baseColor", "基色"),
        BASE_COLOR_NAMES.map((name) => ({
          value: name,
          selected: prefs.baseColor === name,
          apply: () => setAppearance({ baseColor: name }),
        })),
      ),
      this.#chartSection(prefs),
      this.#textSection(
        t("theme.radius", "圆角"),
        Object.keys(RADIUS_STEPS).map((key) => ({
          value: key,
          label: RADIUS_LABELS[key],
          selected: prefs.radius === RADIUS_STEPS[key],
          apply: () => setAppearance({ radius: RADIUS_STEPS[key] }),
        })),
      ),
      this.#textSection(
        t("theme.fontBody", "正文字体"),
        FONT_FAMILIES.map((name) => ({
          value: name,
          label: name.replace(" Variable", ""),
          selected: prefs.fontBody === name,
          apply: () => setAppearance({ fontBody: name }),
        })),
      ),
      this.#textSection(
        t("theme.fontHeading", "标题字体"),
        FONT_FAMILIES.map((name) => ({
          value: name,
          label: name.replace(" Variable", ""),
          selected: prefs.fontHeading === name,
          apply: () => setAppearance({ fontHeading: name }),
        })),
      ),
      this.#textSection(
        t("theme.menu", "菜单外观"),
        MENU_APPEARANCES.map((name) => ({
          value: name,
          label: MENU_LABELS[name],
          selected: prefs.menu === name,
          apply: () => setAppearance({ menu: name }),
        })),
      ),
      this.#textSection(
        t("theme.sidebarVariant", "侧栏变体"),
        ["sidebar", "floating", "inset"].map((name) => ({
          value: name,
          label: VARIANT_LABELS[name],
          selected: getSidebarVariant() === name,
          apply: () => setSidebarVariant(name),
        })),
      ),
      this.#textSection(
        t("theme.sidebarCollapsible", "折叠模式"),
        ["offcanvas", "icon", "none"].map((name) => ({
          value: name,
          label: COLLAPSIBLE_LABELS[name],
          selected: getSidebarCollapsible() === name,
          apply: () => setSidebarCollapsible(name),
        })),
      ),
    ];
    this.#panel.replaceChildren(...sections);
  }

  /**
   * @param {string} label
   * @param {Array<{value: string, label: string, selected: boolean, apply: () => void}>} options
   */
  #textSection(label, options) {
    return this.#section(
      label,
      options.map((opt) => this.#optionButton(opt)),
    );
  }

  /** 基色色板：圆点预览（base-<name> 类提供 --primary）。 */
  #swatchSection(label, options) {
    return this.#section(
      label,
      options.map((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `ts-swatch base-${opt.value}`;
        btn.dataset.selected = String(opt.selected);
        btn.setAttribute(
          "aria-label",
          `${label} ${opt.value}`,
        );
        btn.addEventListener("click", opt.apply);
        return btn;
      }),
    );
  }

  /** 图表色：12 个迷你柱状图磁贴（chart-<name> 类提供 --chart-1..5）。 */
  #chartSection(prefs) {
    return this.#section(
      t("theme.chartColor", "图表色"),
      CHART_COLOR_NAMES.map((name) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ts-chart-tile";
        btn.dataset.selected = String(prefs.chartColor === name);
        btn.setAttribute(
          "aria-label",
          `${t("theme.chartColor", "图表色")} ${name}`,
        );
        btn.append(createChartPreview(name));
        btn.addEventListener(
          "click",
          () => setAppearance({ chartColor: name }),
        );
        return btn;
      }),
    );
  }

  #section(label, children) {
    const section = document.createElement("section");
    section.className = "ts-section";
    const labelEl = document.createElement("div");
    labelEl.className = "ts-label";
    labelEl.textContent = label;
    const options = document.createElement("div");
    options.className = "ts-options";
    options.append(...children);
    section.append(labelEl, options);
    return section;
  }

  /** @param {{value: string, label: string, selected: boolean, apply: () => void}} opt */
  #optionButton(opt) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ts-opt";
    btn.dataset.selected = String(opt.selected);
    btn.textContent = opt.label;
    btn.addEventListener("click", opt.apply);
    return btn;
  }
}

/** document 级监听封装（返回解绑函数）。 */
function onDoc(type, fn) {
  document.addEventListener(type, fn);
  return () => document.removeEventListener(type, fn);
}

customElements.define("ds-theme-settings", DsThemeSettings);
