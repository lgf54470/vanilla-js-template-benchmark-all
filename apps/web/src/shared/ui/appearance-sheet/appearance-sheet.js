import { attachStyles, createIcon } from "../base.js";
import { BASE_COLORS, CHART_COLORS, RADII, STYLES } from "@contracts/constants.js";
import {
  getAppearanceState,
  setBaseColor,
  setChartColor,
  setRadius,
  setSidebarCollapsible,
  setSidebarOpen,
  setSidebarVariant,
  setStyle,
  setTheme,
} from "../../lib/appearance.js";
import { eventBus } from "../../core/event-bus.js";
import { t } from "../../lib/i18n.js";
import "../sheet/sheet.js";
import { toast } from "../toast/toast.js";
import { PREVIEW_ICONS } from "./preview-icons.js";

const css = `
:host { display: inline-block; }
.trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.trigger-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
.panel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 22rem;
  max-width: 90vw;
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.panel-title {
  font-size: var(--text-base);
  font-weight: 600;
}
.panel-desc {
  font-size: var(--text-xs);
  color: var(--color-fg-muted);
  margin-top: 0.125rem;
}
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.section-title {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-muted);
  margin-bottom: var(--space-2);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}
.preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}
.card-box {
  position: relative;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  overflow: hidden;
  width: 100%;
  background: var(--color-muted);
}
.preview-card--active .card-box {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary);
}
.card-label {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
}
.preview-card--active .card-label {
  color: var(--color-fg);
  font-weight: 600;
}
.swatches-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-2);
}
.swatch-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}
.swatch-dot {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.swatch-dot--zinc { background-color: var(--swatch-zinc); }
.swatch-dot--slate { background-color: var(--swatch-slate); }
.swatch-dot--stone { background-color: var(--swatch-stone); }
.swatch-dot--gray { background-color: var(--swatch-gray); }
.swatch-dot--neutral { background-color: var(--swatch-neutral); }
.swatch-dot--red { background-color: var(--swatch-red); }
.swatch-dot--rose { background-color: var(--swatch-rose); }
.swatch-dot--orange { background-color: var(--swatch-orange); }
.swatch-dot--green { background-color: var(--swatch-green); }
.swatch-dot--blue { background-color: var(--swatch-blue); }
.swatch-dot--yellow { background-color: var(--swatch-yellow); }
.swatch-dot--violet { background-color: var(--swatch-violet); }

.swatch-btn--active .swatch-dot {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary);
}
.swatch-label {
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}
.segmented-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  background-color: var(--color-muted);
  padding: 0.125rem;
  border-radius: var(--radius-md);
}
.seg-btn {
  flex: 1;
  min-width: 3rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  color: var(--color-fg-muted);
  cursor: pointer;
}
.seg-btn--active {
  background-color: var(--color-bg);
  color: var(--color-fg);
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}
.panel-footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}
`;

export class DsAppearanceSheet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._unsub = null;
  }

  connectedCallback() {
    this.render();
    this._unsub = eventBus.on("appearance:changed", () => {
      this.render();
    });
  }

  disconnectedCallback() {
    if (this._unsub) this._unsub();
  }

  open() {
    const sheet = this.shadowRoot.querySelector("ds-sheet");
    if (sheet) sheet.open = true;
  }

  close() {
    const sheet = this.shadowRoot.querySelector("ds-sheet");
    if (sheet) sheet.open = false;
  }

  render() {
    const s = getAppearanceState();

    const themes = [
      { id: "system", label: "跟随系统", icon: "theme-system" },
      { id: "light", label: "浅色", icon: "theme-light" },
      { id: "dark", label: "深色", icon: "theme-dark" },
    ];

    const sidebars = [
      { id: "sidebar", label: "固定侧栏", icon: "sidebar-sidebar" },
      { id: "floating", label: "悬浮卡片", icon: "sidebar-floating" },
      { id: "inset", label: "主区内嵌", icon: "sidebar-inset" },
    ];

    this.shadowRoot.innerHTML = `
      <button class="trigger-btn" type="button" aria-label="外观设置" title="外观设置">
        ${createIcon("palette")}
      </button>

      <ds-sheet side="right">
        <div class="panel-container">
          <div class="panel-header">
            <div>
              <div class="panel-title">${t("settings.title") || "外观定制"}</div>
              <div class="panel-desc">定制主题色彩、风格与布局结构</div>
            </div>
            <button class="trigger-btn" id="btn-close-sheet" type="button" aria-label="关闭" title="关闭">
              ${createIcon("x")}
            </button>
          </div>

          <div class="panel-body">
            <!-- Theme -->
            <div>
              <div class="section-title">明暗主题</div>
              <div class="cards-grid">
                ${
      themes.map((th) => `
                  <div class="preview-card ${
        s.theme === th.id ? "preview-card--active" : ""
      }" data-theme="${th.id}">
                    <div class="card-box">
                      <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
        PREVIEW_ICONS[th.icon]
      }</svg>
                    </div>
                    <span class="card-label">${th.label}</span>
                  </div>
                `).join("")
    }
              </div>
            </div>

            <!-- Sidebar Variant -->
            <div>
              <div class="section-title">侧栏形态</div>
              <div class="cards-grid">
                ${
      sidebars.map((sb) => `
                  <div class="preview-card ${
        s.sidebarVariant === sb.id ? "preview-card--active" : ""
      }" data-sidebar-variant="${sb.id}">
                    <div class="card-box">
                      <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
        PREVIEW_ICONS[sb.icon]
      }</svg>
                    </div>
                    <span class="card-label">${sb.label}</span>
                  </div>
                `).join("")
    }
              </div>
            </div>

            <!-- Base Colors -->
            <div>
              <div class="section-title">基准色彩 (Base Color)</div>
              <div class="swatches-grid">
                ${
      BASE_COLORS.map((c) => `
                  <div class="swatch-btn ${
        s.baseColor === c ? "swatch-btn--active" : ""
      }" data-base-color="${c}">
                    <span class="swatch-dot swatch-dot--${c}">
                      ${
        s.baseColor === c
          ? '<span style="color: var(--color-primary-fg); font-size: 10px;">✓</span>'
          : ""
      }
                    </span>
                    <span class="swatch-label">${c}</span>
                  </div>
                `).join("")
    }
              </div>
            </div>

            <!-- Chart Colors -->
            <div>
              <div class="section-title">图表配色 (Chart Color)</div>
              <div class="segmented-row">
                ${
      CHART_COLORS.slice(0, 6).map((ch) => `
                  <div class="seg-btn ${
        s.chartColor === ch ? "seg-btn--active" : ""
      }" data-chart-color="${ch}">${ch.replace("chart-", "#")}</div>
                `).join("")
    }
              </div>
            </div>

            <!-- Styles -->
            <div>
              <div class="section-title">设计风格 (Style)</div>
              <div class="segmented-row">
                ${
      STYLES.map((st) => `
                  <div class="seg-btn ${
        s.style === st ? "seg-btn--active" : ""
      }" data-style="${st}">${st}</div>
                `).join("")
    }
              </div>
            </div>

            <!-- Radius -->
            <div>
              <div class="section-title">圆角大小 (Radius)</div>
              <div class="segmented-row">
                ${
      RADII.map((r) => `
                  <div class="seg-btn ${
        s.radius === r.value ? "seg-btn--active" : ""
      }" data-radius="${r.value}">${r.value}</div>
                `).join("")
    }
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <button id="btn-reset-all" type="button" style="width: 100%; height: 2.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 500; color: var(--color-fg); background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: var(--space-2);">
              ${createIcon("rotate-ccw")}
              <span>恢复默认外观设置</span>
            </button>
          </div>
        </div>
      </ds-sheet>
    `;

    // Event handlers
    this.shadowRoot.querySelector(".trigger-btn")?.addEventListener("click", () => this.open());
    this.shadowRoot.querySelector("#btn-close-sheet")?.addEventListener(
      "click",
      () => this.close(),
    );

    this.shadowRoot.querySelectorAll("[data-theme]").forEach((el) => {
      el.addEventListener("click", () => {
        setTheme(el.getAttribute("data-theme"));
      });
    });

    this.shadowRoot.querySelectorAll("[data-sidebar-variant]").forEach((el) => {
      el.addEventListener("click", () => {
        setSidebarVariant(el.getAttribute("data-sidebar-variant"));
      });
    });

    this.shadowRoot.querySelectorAll("[data-base-color]").forEach((el) => {
      el.addEventListener("click", () => {
        setBaseColor(el.getAttribute("data-base-color"));
      });
    });

    this.shadowRoot.querySelectorAll("[data-chart-color]").forEach((el) => {
      el.addEventListener("click", () => {
        setChartColor(el.getAttribute("data-chart-color"));
      });
    });

    this.shadowRoot.querySelectorAll("[data-style]").forEach((el) => {
      el.addEventListener("click", () => {
        setStyle(el.getAttribute("data-style"));
      });
    });

    this.shadowRoot.querySelectorAll("[data-radius]").forEach((el) => {
      el.addEventListener("click", () => {
        setRadius(el.getAttribute("data-radius"));
      });
    });

    this.shadowRoot.querySelector("#btn-reset-all")?.addEventListener("click", () => {
      setTheme("system");
      setBaseColor("zinc");
      setStyle("nova");
      setChartColor("chart-1");
      setRadius("0.625rem");
      setSidebarVariant("sidebar");
      setSidebarCollapsible("icon");
      setSidebarOpen(true);
      toast.success("已恢复默认外观设置");
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-appearance-sheet")) {
  customElements.define("ds-appearance-sheet", DsAppearanceSheet);
}
