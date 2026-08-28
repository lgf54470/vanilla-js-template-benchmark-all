import { attachStyles, createIcon } from "../base.js";
import { BASE_COLORS, CHART_COLORS, FONTS, RADII, STYLES } from "@contracts/constants.js";
import {
  getAppearanceState,
  setBaseColor,
  setChartColor,
  setFontHeading,
  setFontSans,
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
import { css } from "./appearance-sheet.css.js";

export class DsAppearanceSheet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._unsub = null;
    this._unsubLocale = null;
  }

  connectedCallback() {
    this.render();
    this._unsub = eventBus.on("appearance:changed", () => this.render());
    this._unsubLocale = eventBus.on("locale:changed", () => this.render());
  }

  disconnectedCallback() {
    if (this._unsub) this._unsub();
    if (this._unsubLocale) this._unsubLocale();
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

    const themeItems = [
      { value: "system", icon: "theme-system", labelKey: "header.system" },
      { value: "light", icon: "theme-light", labelKey: "header.light" },
      { value: "dark", icon: "theme-dark", labelKey: "header.dark" },
    ];

    const sidebarItems = [
      { value: "inset", icon: "sidebar-inset", labelKey: "settings.variantOptions.inset" },
      { value: "floating", icon: "sidebar-floating", labelKey: "settings.variantOptions.floating" },
      { value: "sidebar", icon: "sidebar-sidebar", labelKey: "settings.variantOptions.sidebar" },
    ];

    const layout = s.sidebarVariant === "inset"
      ? "default"
      : s.sidebarCollapsible === "offcanvas"
      ? "offcanvas"
      : "icon";
    const layoutItems = [
      { value: "default", icon: "layout-default", labelKey: "settings.layoutOptions.default" },
      { value: "icon", icon: "layout-compact", labelKey: "settings.layoutOptions.icon" },
      { value: "offcanvas", icon: "layout-full", labelKey: "settings.layoutOptions.offcanvas" },
    ];

    this.shadowRoot.innerHTML = `
      <button class="trigger-btn" type="button" aria-label="${t("settings.title")}" title="${
      t("settings.title")
    }">
        ${createIcon("palette")}
      </button>

      <ds-sheet side="right">
        <div class="panel-container">
          <div class="panel-header">
            <h2 class="panel-title">${t("settings.title")}</h2>
            <p class="panel-desc">${t("settings.description")}</p>
            <button class="close-btn" id="btn-close-sheet" type="button" aria-label="${
      t("settings.close")
    }">
              ${createIcon("x")}
            </button>
          </div>

          <div class="panel-body">
            <!-- Theme -->
            <div>
              <div class="section-title">${t("settings.theme")}</div>
              <div class="cards-grid">
                ${
      themeItems.map((item) => {
        const active = s.theme === item.value;
        return `
                    <button type="button" class="preview-card ${
          active ? "preview-card--active" : ""
        }" data-theme="${item.value}">
                      <div class="card-box">
                        ${
          active ? `<span class="check-badge">${createIcon("circle-check")}</span>` : ""
        }
                        <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
          PREVIEW_ICONS[item.icon]
        }</svg>
                      </div>
                      <span class="card-label">${t(item.labelKey)}</span>
                    </button>`;
      }).join("")
    }
              </div>
            </div>

            <!-- Sidebar -->
            <div>
              <div class="section-title">${t("settings.sidebar")}</div>
              <div class="cards-grid">
                ${
      sidebarItems.map((item) => {
        const active = s.sidebarVariant === item.value;
        return `
                    <button type="button" class="preview-card ${
          active ? "preview-card--active" : ""
        }" data-sidebar-variant="${item.value}">
                      <div class="card-box">
                        ${
          active ? `<span class="check-badge">${createIcon("circle-check")}</span>` : ""
        }
                        <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
          PREVIEW_ICONS[item.icon]
        }</svg>
                      </div>
                      <span class="card-label">${t(item.labelKey)}</span>
                    </button>`;
      }).join("")
    }
              </div>
            </div>

            <!-- Layout -->
            <div>
              <div class="section-title">${t("settings.layout")}</div>
              <div class="cards-grid">
                ${
      layoutItems.map((item) => {
        const active = layout === item.value;
        return `
                    <button type="button" class="preview-card ${
          active ? "preview-card--active" : ""
        }" data-layout="${item.value}">
                      <div class="card-box">
                        ${
          active ? `<span class="check-badge">${createIcon("circle-check")}</span>` : ""
        }
                        <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
          PREVIEW_ICONS[item.icon]
        }</svg>
                      </div>
                      <span class="card-label">${t(item.labelKey)}</span>
                    </button>`;
      }).join("")
    }
              </div>
            </div>

            <!-- Base Colors -->
            <div>
              <div class="section-title">${t("settings.baseColor")}</div>
              <div class="swatches-grid-7">
                ${
      BASE_COLORS.map((c) => {
        const active = s.baseColor === c;
        return `
                    <button type="button" class="swatch-btn ${
          active ? "swatch-btn--active" : ""
        }" data-base-color="${c}">
                      <span class="swatch-dot swatch-dot--${c}">
                        ${
          active ? `<span class="check-badge">${createIcon("circle-check")}</span>` : ""
        }
                      </span>
                      <span class="swatch-label">${c}</span>
                    </button>`;
      }).join("")
    }
              </div>
            </div>

            <!-- Chart Colors -->
            <div>
              <div class="section-title">${t("settings.chartColor")}</div>
              <div class="swatches-grid-6">
                ${
      [s.baseColor, ...CHART_COLORS].map((ch) => {
        const active = s.chartColor === ch;
        return `
                    <button type="button" class="swatch-btn ${
          active ? "swatch-btn--active" : ""
        }" data-chart-color="${ch}">
                      <span class="swatch-dot swatch-dot--${ch}">
                        ${
          active ? `<span class="check-badge">${createIcon("circle-check")}</span>` : ""
        }
                      </span>
                      <span class="swatch-label">${ch}</span>
                    </button>`;
      }).join("")
    }
              </div>
            </div>

            <!-- Styles -->
            <div>
              <div class="section-title">${t("settings.style")}</div>
              <div class="segmented-grid-4">
                ${
      STYLES.map((st) => `
                  <button type="button" class="seg-btn ${
        s.style === st ? "seg-btn--active" : ""
      }" data-style="${st}">${st}</button>`).join("")
    }
              </div>
            </div>

            <!-- Body Font -->
            <div>
              <div class="section-title">${t("settings.bodyFont")}</div>
              <div class="segmented-grid-3">
                ${
      FONTS.map((f) => `
                  <button type="button" class="seg-btn ${
        s.fontSans === f.value ? "seg-btn--active" : ""
      }" data-body-font="${f.value}">${f.label}</button>`).join("")
    }
              </div>
            </div>

            <!-- Heading Font -->
            <div>
              <div class="section-title">${t("settings.headingFont")}</div>
              <div class="segmented-grid-3">
                ${
      FONTS.map((f) => `
                  <button type="button" class="seg-btn ${
        s.fontHeading === f.value ? "seg-btn--active" : ""
      }" data-heading-font="${f.value}">${f.label}</button>`).join("")
    }
              </div>
            </div>

            <!-- Icon Library -->
            <div class="readonly-row">
              <span class="readonly-label">${t("settings.iconLibrary")}</span>
              <span class="readonly-badge">${t("settings.lucide")}</span>
            </div>

            <!-- Radius -->
            <div>
              <div class="section-title">${t("settings.radius")}</div>
              <div class="segmented-grid-6">
                ${
      RADII.map((r) => `
                  <button type="button" class="seg-btn ${
        s.radius === r.value ? "seg-btn--active" : ""
      }" data-radius="${r.value}">${t(r.labelKey)}</button>`).join("")
    }
              </div>
            </div>

            <!-- Menu Color -->
            <div>
              <div class="section-title">${t("settings.menuColor")}</div>
              <div class="segmented-grid-2">
                <button type="button" class="seg-btn seg-btn--active">${
      t("settings.menuColorOptions.default")
    }</button>
                <button type="button" class="seg-btn">${
      t("settings.menuColorOptions.inverted")
    }</button>
              </div>
            </div>

            <!-- Menu Appearance -->
            <div>
              <div class="section-title">${t("settings.menuAppearance")}</div>
              <div class="segmented-grid-2">
                <button type="button" class="seg-btn seg-btn--active">${
      t("settings.menuAppearanceOptions.solid")
    }</button>
                <button type="button" class="seg-btn">${
      t("settings.menuAppearanceOptions.translucent")
    }</button>
              </div>
            </div>

            <!-- Menu Accent -->
            <div class="readonly-row">
              <span class="readonly-label">${t("settings.menuAccent")}</span>
              <span class="readonly-badge">${t("settings.subtle")}</span>
            </div>
          </div>

          <div class="panel-footer">
            <button id="btn-reset-all" type="button" class="btn-reset">
              ${createIcon("rotate-ccw")}
              <span>${t("settings.resetAll")}</span>
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
      el.addEventListener("click", () => setTheme(el.getAttribute("data-theme")));
    });

    this.shadowRoot.querySelectorAll("[data-sidebar-variant]").forEach((el) => {
      el.addEventListener(
        "click",
        () => setSidebarVariant(el.getAttribute("data-sidebar-variant")),
      );
    });

    this.shadowRoot.querySelectorAll("[data-layout]").forEach((el) => {
      el.addEventListener("click", () => {
        const mode = el.getAttribute("data-layout");
        if (mode === "default") {
          setSidebarVariant("inset");
          setSidebarCollapsible("icon");
          setSidebarOpen(true);
        } else if (mode === "icon") {
          setSidebarVariant("sidebar");
          setSidebarCollapsible("icon");
          setSidebarOpen(true);
        } else if (mode === "offcanvas") {
          setSidebarVariant("sidebar");
          setSidebarCollapsible("offcanvas");
          setSidebarOpen(true);
        }
      });
    });

    this.shadowRoot.querySelectorAll("[data-base-color]").forEach((el) => {
      el.addEventListener("click", () => setBaseColor(el.getAttribute("data-base-color")));
    });

    this.shadowRoot.querySelectorAll("[data-chart-color]").forEach((el) => {
      el.addEventListener("click", () => setChartColor(el.getAttribute("data-chart-color")));
    });

    this.shadowRoot.querySelectorAll("[data-style]").forEach((el) => {
      el.addEventListener("click", () => setStyle(el.getAttribute("data-style")));
    });

    this.shadowRoot.querySelectorAll("[data-body-font]").forEach((el) => {
      el.addEventListener("click", () => setFontSans(el.getAttribute("data-body-font")));
    });

    this.shadowRoot.querySelectorAll("[data-heading-font]").forEach((el) => {
      el.addEventListener("click", () => setFontHeading(el.getAttribute("data-heading-font")));
    });

    this.shadowRoot.querySelectorAll("[data-radius]").forEach((el) => {
      el.addEventListener("click", () => setRadius(el.getAttribute("data-radius")));
    });

    this.shadowRoot.querySelector("#btn-reset-all")?.addEventListener("click", () => {
      setTheme("system");
      setBaseColor("zinc");
      setStyle("nova");
      setChartColor("zinc");
      setFontSans("inter");
      setFontHeading("manrope");
      setRadius("default");
      setSidebarVariant("sidebar");
      setSidebarCollapsible("icon");
      setSidebarOpen(true);
      toast.success(t("settings.resetAll"));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-appearance-sheet")) {
  customElements.define("ds-appearance-sheet", DsAppearanceSheet);
}
