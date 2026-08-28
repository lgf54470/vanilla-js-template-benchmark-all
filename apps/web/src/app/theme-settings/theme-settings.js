// apps/web/src/app/theme-settings/theme-settings.js — <ds-theme-settings>
//
// Header 入口 + 主题设置面板（Architecture §6.3 / 视觉验收基准 4）：风格、基色、
// 图表色、圆角、字体（正文字体/标题字体）、菜单外观、侧栏变体、折叠模式。
// 所有变更即改即生效（appearance.set* → apply() → 持久化 pref:*），刷新不丢。
// 面板打开时从 appearance.getState() 重建控件（外部变化后重开面板同步最新值）。
//
// 控件全部用原生 button/input 构建 + 语义令牌样式（无硬编码字面量）；预览色板
// 走 tokens/appearance-swatches.css。

import { attachStyles, define } from "../../shared/ui/base.js";
import { iconSvg } from "../../shared/lib/icons.js";
import { appearance } from "../../shared/lib/appearance.js";
import { t } from "../../shared/lib/i18n.js";
import {
  BASE_COLORS,
  CHART_COLORS,
  FONT_OPTIONS,
  STYLES,
} from "@contracts/constants.js";

const CSS = `
:host{display:inline-flex}
.trigger{display:inline-flex;align-items:center;justify-content:center;
  inline-size:2.2rem;block-size:2.2rem;border-radius:var(--ds-icon-btn-radius);
  color:var(--color-fg-muted);cursor:pointer;background:transparent}
.trigger:hover{background:var(--color-muted);color:var(--color-fg)}
.trigger:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
.panel{display:flex;flex-direction:column;gap:var(--space-4)}
.field{display:flex;flex-direction:column;gap:var(--space-2)}
.field-label{font-size:.8rem;font-weight:600;color:var(--color-fg)}
.chips{display:flex;flex-wrap:wrap;gap:var(--space-1)}
.chip{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .6rem;
  border-radius:var(--ds-btn-radius);font-size:.78rem;color:var(--color-fg-muted);
  cursor:pointer;background:transparent;border:1px solid var(--color-border)}
.chip:hover{background:var(--color-muted);color:var(--color-fg)}
.chip[aria-checked="true"]{background:var(--color-accent);color:var(--color-accent-fg);
  border-color:transparent;font-weight:600}
.chip:focus-visible{outline:2px solid var(--color-ring);outline-offset:-2px}
.swatches{display:flex;flex-wrap:wrap;gap:var(--space-2)}
.swatch{inline-size:1.6rem;block-size:1.6rem;border-radius:var(--ds-icon-btn-radius);
  cursor:pointer;border:2px solid transparent;padding:0;
  box-shadow:inset 0 0 0 1px var(--color-border)}
.swatch[aria-checked="true"]{border-color:var(--color-fg);
  box-shadow:inset 0 0 0 1px var(--color-fg)}
.swatch:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
.radius-row{display:flex;align-items:center;gap:var(--space-3)}
input[type="range"]{flex:1;accent-color:var(--color-primary)}
.radius-value{font-size:.85rem;font-variant-numeric:tabular-nums;
  color:var(--color-fg-muted);min-inline-size:2.5rem;text-align:end}
select{flex:1;padding:.35rem .6rem;border-radius:var(--ds-btn-radius);
  border:1px solid var(--color-input);background:var(--color-bg);
  color:var(--color-fg);font-size:.85rem}
select:focus-visible{outline:2px solid var(--color-ring);outline-offset:2px}
`;

class DsThemeSettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, CSS);
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <button type="button" class="trigger" aria-label="主题设置"></button>
      <ds-dialog class="dialog" title="${
      t("shell.theme.title")
    }" description="${t("shell.theme.description")}">
        <div class="panel"></div>
      </ds-dialog>`;
    this._trigger = this.shadowRoot.querySelector(".trigger");
    this._trigger.innerHTML = iconSvg("sparkles", 18);
    this._dialog = this.shadowRoot.querySelector("ds-dialog");
    this._panel = this.shadowRoot.querySelector(".panel");
    this._trigger.addEventListener("click", () => {
      this._renderPanel();
      this._dialog.show();
    });
    this._renderPanel();
  }
  /** 从 appearance 当前状态重建全部控件 */
  _renderPanel() {
    const s = appearance.getState();
    this._panel.innerHTML = "";
    this._panel.append(
      this._field(
        t("shell.theme.style"),
        this._chips(STYLES, s.style, (v) => appearance.setStyle(v)),
      ),
      this._field(
        t("shell.theme.base"),
        this._swatches("", BASE_COLORS, s.base, (v) => appearance.setBase(v)),
      ),
      this._field(
        t("shell.theme.chart"),
        this._swatches(
          "chart-",
          CHART_COLORS,
          s.chart,
          (v) => appearance.setChart(v),
        ),
      ),
      this._radiusField(s.radius),
      this._fontField(
        t("shell.theme.fontSans"),
        s.fontSans,
        (v) => appearance.setFontSans(v),
      ),
      this._fontField(
        t("shell.theme.fontHeading"),
        s.fontHeading,
        (v) => appearance.setFontHeading(v),
      ),
      this._field(
        t("shell.theme.menu"),
        this._chips(
          ["default", "compact", "spacious"],
          s.menu,
          (v) => appearance.setMenu(v),
          (v) => t(`shell.menu.${v}`),
        ),
      ),
      this._field(
        t("shell.theme.variant"),
        this._chips(
          ["sidebar", "floating", "inset"],
          s.sidebarVariant,
          (v) => appearance.setSidebarVariant(v),
          (v) => t(`shell.sidebar.variant.${v}`),
        ),
      ),
      this._field(
        t("shell.theme.collapsible"),
        this._chips(
          ["icon", "offcanvas", "none"],
          s.sidebarCollapsible,
          (v) => appearance.setSidebarCollapsible(v),
          (v) => t(`shell.sidebar.collapsible.${v}`),
        ),
      ),
    );
  }
  _field(label, control) {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lab = document.createElement("span");
    lab.className = "field-label";
    lab.textContent = label;
    wrap.append(lab, control);
    return wrap;
  }
  /** 文字选项胶囊组；labelFn 可选（默认直显选项值） */
  _chips(options, value, onChange, labelFn = (v) => v) {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    for (const opt of options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = labelFn(opt);
      btn.setAttribute("aria-pressed", String(opt === value));
      btn.addEventListener("click", () => onChange(opt));
      wrap.append(btn);
    }
    return wrap;
  }
  /** 色块预览组（style 取 tokens/appearance-swatches.css） */
  _swatches(prefix, colors, value, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "swatches";
    for (const color of colors) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch";
      btn.title = color;
      btn.style.background = `var(--swatch-${prefix}${color})`;
      btn.setAttribute("aria-pressed", String(color === value));
      btn.addEventListener("click", () => onChange(color));
      wrap.append(btn);
    }
    return wrap;
  }
  _radiusField(radius) {
    const row = document.createElement("div");
    row.className = "radius-row";
    const input = document.createElement("input");
    input.type = "range";
    input.min = "4";
    input.max = "24";
    input.step = "1";
    input.value = String(radius);
    const value = document.createElement("span");
    value.className = "radius-value";
    value.textContent = `${radius}px`;
    input.addEventListener("input", () => {
      appearance.setRadius(Number(input.value));
      value.textContent = `${input.value}px`;
    });
    row.append(input, value);
    return this._field("圆角", row);
  }
  _fontField(label, value, onChange) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", label);
    for (const font of FONT_OPTIONS) {
      const opt = document.createElement("option");
      opt.value = font;
      opt.textContent = font;
      select.append(opt);
    }
    select.value = value;
    select.addEventListener("change", () => onChange(select.value));
    return this._field(label, select);
  }
}
define("ds-theme-settings", DsThemeSettings);
