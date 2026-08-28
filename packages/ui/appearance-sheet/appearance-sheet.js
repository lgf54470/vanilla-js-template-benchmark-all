import { BASE_COLORS, CHART_COLORS, FONTS, RADII, STYLES } from "@contracts/constants.js";
import {
  getBaseColor,
  getChartColor,
  getFont,
  getRadius,
  getStyle,
  getTheme,
  resetAppearance,
  setBaseColor,
  setChartColor,
  setFont,
  setRadius,
  setStyle,
  setTheme,
} from "../../../apps/web/src/shared/lib/appearance.js";
import { t } from "../../../apps/web/src/shared/lib/i18n.js";
import { attachStyles, createIcon } from "../base.js";
import { css } from "./appearance-sheet.css.js";
import { PREVIEW_ICONS } from "./preview-icons.js";
import "../sheet/sheet.js";

export class DsAppearanceSheet extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleOutside = this._handleOutside.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._boundOnLocaleChanged = () => {
      if (this.open) this.render();
    };
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(val) {
    if (val) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  connectedCallback() {
    this.render();
    document.addEventListener("keydown", this._handleKeydown);
    globalThis.window?.addEventListener?.("locale:changed", this._boundOnLocaleChanged);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._handleKeydown);
    globalThis.window?.removeEventListener?.("locale:changed", this._boundOnLocaleChanged);
  }

  attributeChangedCallback() {
    const sheet = this.shadowRoot.querySelector("ds-sheet");
    if (sheet) {
      if (this.open) sheet.setAttribute("open", "");
      else sheet.removeAttribute("open");
    }
  }

  _handleKeydown(e) {
    if (this.open && e.key === "Escape") {
      this.close();
    }
  }

  _handleOutside() {
    this.close();
  }

  close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent("ds-close"));
  }

  render() {
    const currentTheme = getTheme();
    const currentBaseColor = getBaseColor();
    const currentStyle = getStyle();
    const currentChartColor = getChartColor();
    const currentRadius = getRadius();
    const currentFont = getFont();

    this.shadowRoot.innerHTML = `
      <ds-sheet side="right" ${this.open ? "open" : ""}>
        <div data-slot="appearance-sheet" class="sheet-container">
          <div class="header">
            <div class="title-wrap">
              <h2 class="title">${t("settings.title") || "主题设置"}</h2>
              <p class="desc">${t("settings.appearanceDesc") || "自定义外观、风格与布局。"}</p>
            </div>
            <button type="button" class="btn-close" id="btn-close" aria-label="${
      t("common.close") || "关闭"
    }">
              ${createIcon("x")}
            </button>
          </div>

          <div class="content">
            <!-- 1. 主题模式 -->
            <div class="section">
              <div class="section-title">${t("settings.themeMode") || "主题模式"}</div>
              <div class="card-grid col-3">
                <div class="preview-card ${
      currentTheme === "system" ? "preview-card--active" : ""
    }" data-action="set-theme" data-value="system">
                  <div class="card-thumb">${PREVIEW_ICONS.themeSystem}</div>
                  <div class="card-label">
                    <span>${t("settings.themeOptions.system") || "跟随系统"}</span>
                    ${
      currentTheme === "system" ? `<span class="check-badge">${createIcon("check")}</span>` : ""
    }
                  </div>
                </div>
                <div class="preview-card ${
      currentTheme === "light" ? "preview-card--active" : ""
    }" data-action="set-theme" data-value="light">
                  <div class="card-thumb">${PREVIEW_ICONS.themeLight}</div>
                  <div class="card-label">
                    <span>${t("settings.themeOptions.light") || "浅色模式"}</span>
                    ${
      currentTheme === "light" ? `<span class="check-badge">${createIcon("check")}</span>` : ""
    }
                  </div>
                </div>
                <div class="preview-card ${
      currentTheme === "dark" ? "preview-card--active" : ""
    }" data-action="set-theme" data-value="dark">
                  <div class="card-thumb">${PREVIEW_ICONS.themeDark}</div>
                  <div class="card-label">
                    <span>${t("settings.themeOptions.dark") || "深色模式"}</span>
                    ${
      currentTheme === "dark" ? `<span class="check-badge">${createIcon("check")}</span>` : ""
    }
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. 基准色彩 -->
            <div class="section">
              <div class="section-title">${t("settings.baseColor") || "基准色彩"}</div>
              <div class="segmented-control">
                ${
      BASE_COLORS.map((c) => `
                  <button type="button" class="segmented-item ${
        currentBaseColor === c.value ? "segmented-item--active" : ""
      }" data-action="set-base-color" data-value="${c.value}">
                    ${t(c.labelKey) || c.labelKey.split(".").pop()}
                  </button>
                `).join("")
    }
              </div>
            </div>

            <!-- 3. 强调色 / 图表配色 -->
            <div class="section">
              <div class="section-title">${t("settings.chartColor") || "强调色"}</div>
              <div class="swatch-grid">
                ${
      CHART_COLORS.map((c) => `
                  <button type="button" class="swatch-btn ${
        currentChartColor === c.value ? "swatch-btn--active" : ""
      }" data-action="set-chart-color" data-value="${c.value}" style="background-color: var(--swatch-${c.value});" title="${
        t(c.labelKey) || c.value
      }">
                    ${
        currentChartColor === c.value
          ? `<span class="swatch-check">${createIcon("check")}</span>`
          : ""
      }
                  </button>
                `).join("")
    }
              </div>
            </div>

            <!-- 4. 设计风格 -->
            <div class="section">
              <div class="section-title">${t("settings.style") || "设计风格"}</div>
              <div class="style-grid">
                ${
      STYLES.map((s) => `
                  <button type="button" class="style-btn ${
        currentStyle === s.value ? "style-btn--active" : ""
      }" data-action="set-style" data-value="${s.value}">
                    <span class="style-name">${s.value}</span>
                    <span class="style-tag">${s.tag}</span>
                  </button>
                `).join("")
    }
              </div>
            </div>

            <!-- 5. 圆角大小 -->
            <div class="section">
              <div class="section-title">${t("settings.radius") || "圆角大小"}</div>
              <div class="segmented-control">
                ${
      RADII.map((r) => `
                  <button type="button" class="segmented-item ${
        currentRadius === r.value ? "segmented-item--active" : ""
      }" data-action="set-radius" data-value="${r.value}">
                    ${t(r.labelKey) || r.value}
                  </button>
                `).join("")
    }
              </div>
            </div>

            <!-- 6. 正文字体 -->
            <div class="section">
              <div class="section-title">${t("settings.font") || "正文字体"}</div>
              <div class="segmented-control">
                ${
      FONTS.map((f) => `
                  <button type="button" class="segmented-item ${
        currentFont === f.value ? "segmented-item--active" : ""
      }" data-action="set-font" data-value="${f.value}">
                    ${f.name}
                  </button>
                `).join("")
    }
              </div>
            </div>

            <!-- 7. 一键重置 -->
            <div class="section" style="margin-top: var(--space-8); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">
              <button type="button" class="reset-btn" id="btn-reset">
                ${createIcon("rotate-ccw")}
                <span>${t("settings.resetDefault") || "重置全部为默认"}</span>
              </button>
            </div>
          </div>
        </div>
      </ds-sheet>
    `;

    this._bindEvents();
    attachStyles(this.shadowRoot, css);
  }

  _bindEvents() {
    this.shadowRoot.querySelector("#btn-close")?.addEventListener("click", () => this.close());
    this.shadowRoot.querySelector("ds-sheet")?.addEventListener("ds-close", () => this.close());

    this.shadowRoot.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", () => {
        const action = el.getAttribute("data-action");
        const val = el.getAttribute("data-value");
        if (action === "set-theme") setTheme(val);
        else if (action === "set-base-color") setBaseColor(val);
        else if (action === "set-chart-color") setChartColor(val);
        else if (action === "set-style") setStyle(val);
        else if (action === "set-radius") setRadius(val);
        else if (action === "set-font") setFont(val);
        this.render();
      });
    });

    this.shadowRoot.querySelector("#btn-reset")?.addEventListener("click", () => {
      resetAppearance();
      this.render();
    });
  }
}

if (!customElements.get("ds-appearance-sheet")) {
  customElements.define("ds-appearance-sheet", DsAppearanceSheet);
}
