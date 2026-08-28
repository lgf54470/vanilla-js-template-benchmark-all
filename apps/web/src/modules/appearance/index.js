import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { BASE_COLORS, CHART_COLORS, FONTS, RADII, STYLES } from "@contracts/constants.js";
import {
  getAppearanceState,
  setBaseColor,
  setChartColor,
  setFontHeading,
  setFontSans,
  setRadius,
  setSidebarCollapsible,
  setSidebarVariant,
  setStyle,
  setTheme,
} from "../../shared/lib/appearance.js";
import { PREVIEW_ICONS } from "../../shared/ui/appearance-sheet/preview-icons.js";
import { createIcon } from "../../shared/ui/base.js";
import { toast } from "../../shared/ui/toast/toast.js";
import { eventBus } from "../../shared/core/event-bus.js";

registerTranslations("zh-CN", "appearance", zhCN);
registerTranslations("zh-TW", "appearance", zhTW);
registerTranslations("en", "appearance", en);

let _unsubLocale = null;
let _unsubAppearance = null;

export default {
  mount(container) {
    const renderContent = () => {
      const s = getAppearanceState();

      const themeItems = [
        { value: "system", icon: "theme-system", labelKey: "header.system" },
        { value: "light", icon: "theme-light", labelKey: "header.light" },
        { value: "dark", icon: "theme-dark", labelKey: "header.dark" },
      ];

      const sidebarItems = [
        { value: "inset", icon: "sidebar-inset", labelKey: "settings.variantOptions.inset" },
        {
          value: "floating",
          icon: "sidebar-floating",
          labelKey: "settings.variantOptions.floating",
        },
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

      container.innerHTML = `
        <div class="page-container" style="max-width: 56rem; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6);">
          <div class="page-header">
            <div>
              <h1 class="page-title" style="font-size: var(--text-2xl); font-weight: 700;">${
        t("settings.title")
      }</h1>
              <p class="page-description" style="font-size: var(--text-sm); color: var(--color-fg-muted); margin-top: 0.25rem;">${
        t("settings.description")
      }</p>
            </div>
          </div>

          <!-- Theme -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.theme")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
              ${
        themeItems.map((item) => {
          const active = s.theme === item.value;
          return `
                  <button type="button" class="preview-card" data-theme="${item.value}" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; border: none; background: transparent; cursor: pointer; padding: 0;">
                    <div style="position: relative; border-radius: 6px; border: 2px solid ${
            active ? "var(--color-primary)" : "var(--color-border)"
          }; width: 100%; overflow: visible; background: var(--color-muted);">
                      ${
            active
              ? `<span style="position: absolute; top: -0.375rem; right: -0.375rem; z-index: 10; display: flex; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-primary-fg);">${
                createIcon("circle-check")
              }</span>`
              : ""
          }
                      <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
            PREVIEW_ICONS[item.icon]
          }</svg>
                    </div>
                    <span style="font-size: var(--text-sm); font-weight: ${
            active ? "600" : "400"
          }; color: ${active ? "var(--color-fg)" : "var(--color-fg-muted)"};">${
            t(item.labelKey)
          }</span>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Sidebar Style -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.sidebar")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
              ${
        sidebarItems.map((item) => {
          const active = s.sidebarVariant === item.value;
          return `
                  <button type="button" class="preview-card" data-sidebar-variant="${item.value}" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; border: none; background: transparent; cursor: pointer; padding: 0;">
                    <div style="position: relative; border-radius: 6px; border: 2px solid ${
            active ? "var(--color-primary)" : "var(--color-border)"
          }; width: 100%; overflow: visible; background: var(--color-muted);">
                      ${
            active
              ? `<span style="position: absolute; top: -0.375rem; right: -0.375rem; z-index: 10; display: flex; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-primary-fg);">${
                createIcon("circle-check")
              }</span>`
              : ""
          }
                      <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
            PREVIEW_ICONS[item.icon]
          }</svg>
                    </div>
                    <span style="font-size: var(--text-sm); font-weight: ${
            active ? "600" : "400"
          }; color: ${active ? "var(--color-fg)" : "var(--color-fg-muted)"};">${
            t(item.labelKey)
          }</span>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Layout Mode -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.layout")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
              ${
        layoutItems.map((item) => {
          const active = layout === item.value;
          return `
                  <button type="button" class="preview-card" data-layout="${item.value}" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; border: none; background: transparent; cursor: pointer; padding: 0;">
                    <div style="position: relative; border-radius: 6px; border: 2px solid ${
            active ? "var(--color-primary)" : "var(--color-border)"
          }; width: 100%; overflow: visible; background: var(--color-muted);">
                      ${
            active
              ? `<span style="position: absolute; top: -0.375rem; right: -0.375rem; z-index: 10; display: flex; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-primary-fg);">${
                createIcon("circle-check")
              }</span>`
              : ""
          }
                      <svg viewBox="0 0 79.86 51.14" style="width: 100%; height: auto; display: block;">${
            PREVIEW_ICONS[item.icon]
          }</svg>
                    </div>
                    <span style="font-size: var(--text-sm); font-weight: ${
            active ? "600" : "400"
          }; color: ${active ? "var(--color-fg)" : "var(--color-fg-muted)"};">${
            t(item.labelKey)
          }</span>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Base Colors -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.baseColor")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-3);">
              ${
        BASE_COLORS.map((c) => {
          const active = s.baseColor === c;
          return `
                  <button type="button" class="swatch-btn" data-base-color="${c}" style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem; border: none; background: transparent; cursor: pointer; padding: 0;">
                    <span class="swatch-dot swatch-dot--${c}" style="position: relative; width: 2rem; height: 2rem; border-radius: var(--radius-full); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center;">
                      ${
            active
              ? `<span style="position: absolute; top: -0.25rem; right: -0.25rem; display: flex; align-items: center; justify-content: center; width: 1rem; height: 1rem; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-primary-fg);">${
                createIcon("circle-check")
              }</span>`
              : ""
          }
                    </span>
                    <span style="font-size: var(--text-xs); color: ${
            active ? "var(--color-fg)" : "var(--color-fg-muted)"
          }; text-transform: lowercase;">${c}</span>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Chart Colors -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.chartColor")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-3);">
              ${
        [s.baseColor, ...CHART_COLORS].map((ch) => {
          const active = s.chartColor === ch;
          return `
                  <button type="button" class="swatch-btn" data-chart-color="${ch}" style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem; border: none; background: transparent; cursor: pointer; padding: 0;">
                    <span class="swatch-dot swatch-dot--${ch}" style="position: relative; width: 2rem; height: 2rem; border-radius: var(--radius-full); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center;">
                      ${
            active
              ? `<span style="position: absolute; top: -0.25rem; right: -0.25rem; display: flex; align-items: center; justify-content: center; width: 1rem; height: 1rem; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-primary-fg);">${
                createIcon("circle-check")
              }</span>`
              : ""
          }
                    </span>
                    <span style="font-size: var(--text-xs); color: ${
            active ? "var(--color-fg)" : "var(--color-fg-muted)"
          };">${ch}</span>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Design Styles -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.style")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); background: var(--color-muted); padding: 0.25rem; border-radius: var(--radius-md);">
              ${
        STYLES.map((st) => `
                <button type="button" data-style="${st}" style="height: 2rem; border: none; background: ${
          s.style === st ? "var(--color-bg)" : "transparent"
        }; color: ${s.style === st ? "var(--color-fg)" : "var(--color-fg-muted)"}; font-weight: ${
          s.style === st ? "600" : "400"
        }; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-xs); text-transform: capitalize;">${st}</button>
              `).join("")
      }
            </div>
          </ds-card>

          <!-- Typography -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.bodyFont")
      } / ${t("settings.headingFont")}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
              <div>
                <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("settings.bodyFont")
      }</label>
                <div style="display: flex; gap: var(--space-2); background: var(--color-muted); padding: 0.25rem; border-radius: var(--radius-md);">
                  ${
        FONTS.map((f) => `
                    <button type="button" data-body-font="${f.value}" style="flex: 1; height: 2rem; border: none; background: ${
          s.fontSans === f.value ? "var(--color-bg)" : "transparent"
        }; color: ${
          s.fontSans === f.value ? "var(--color-fg)" : "var(--color-fg-muted)"
        }; font-weight: ${
          s.fontSans === f.value ? "600" : "400"
        }; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-xs);">${f.label}</button>
                  `).join("")
      }
                </div>
              </div>
              <div>
                <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">${
        t("settings.headingFont")
      }</label>
                <div style="display: flex; gap: var(--space-2); background: var(--color-muted); padding: 0.25rem; border-radius: var(--radius-md);">
                  ${
        FONTS.map((f) => `
                    <button type="button" data-heading-font="${f.value}" style="flex: 1; height: 2rem; border: none; background: ${
          s.fontHeading === f.value ? "var(--color-bg)" : "transparent"
        }; color: ${
          s.fontHeading === f.value ? "var(--color-fg)" : "var(--color-fg-muted)"
        }; font-weight: ${
          s.fontHeading === f.value ? "600" : "400"
        }; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-xs);">${f.label}</button>
                  `).join("")
      }
                </div>
              </div>
            </div>
          </ds-card>

          <!-- Radius -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("settings.radius")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-2); background: var(--color-muted); padding: 0.25rem; border-radius: var(--radius-md);">
              ${
        RADII.map((r) => `
                <button type="button" data-radius="${r.value}" style="height: 2rem; border: none; background: ${
          s.radius === r.value ? "var(--color-bg)" : "transparent"
        }; color: ${
          s.radius === r.value ? "var(--color-fg)" : "var(--color-fg-muted)"
        }; font-weight: ${
          s.radius === r.value ? "600" : "400"
        }; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-xs);">${
          t(r.labelKey)
        }</button>
              `).join("")
      }
            </div>
          </ds-card>

          <div style="display: flex; justify-content: flex-end;">
            <button id="btn-reset-page" type="button" style="height: 2.25rem; padding-inline: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 500; color: var(--color-fg); background: transparent; cursor: pointer; display: inline-flex; align-items: center; gap: var(--space-2);">
              ${createIcon("rotate-ccw")}
              <span>${t("settings.resetAll")}</span>
            </button>
          </div>
        </div>
      `;

      // Event handlers
      container.querySelectorAll("[data-theme]").forEach((el) => {
        el.addEventListener("click", () => {
          setTheme(el.getAttribute("data-theme"));
          renderContent();
        });
      });

      container.querySelectorAll("[data-sidebar-variant]").forEach((el) => {
        el.addEventListener("click", () => {
          setSidebarVariant(el.getAttribute("data-sidebar-variant"));
          renderContent();
        });
      });

      container.querySelectorAll("[data-layout]").forEach((el) => {
        el.addEventListener("click", () => {
          const mode = el.getAttribute("data-layout");
          if (mode === "default") {
            setSidebarVariant("inset");
            setSidebarCollapsible("icon");
          } else if (mode === "icon") {
            setSidebarVariant("sidebar");
            setSidebarCollapsible("icon");
          } else if (mode === "offcanvas") {
            setSidebarVariant("sidebar");
            setSidebarCollapsible("offcanvas");
          }
          renderContent();
        });
      });

      container.querySelectorAll("[data-base-color]").forEach((el) => {
        el.addEventListener("click", () => {
          setBaseColor(el.getAttribute("data-base-color"));
          renderContent();
        });
      });

      container.querySelectorAll("[data-chart-color]").forEach((el) => {
        el.addEventListener("click", () => {
          setChartColor(el.getAttribute("data-chart-color"));
          renderContent();
        });
      });

      container.querySelectorAll("[data-style]").forEach((el) => {
        el.addEventListener("click", () => {
          setStyle(el.getAttribute("data-style"));
          renderContent();
        });
      });

      container.querySelectorAll("[data-body-font]").forEach((el) => {
        el.addEventListener("click", () => {
          setFontSans(el.getAttribute("data-body-font"));
          renderContent();
        });
      });

      container.querySelectorAll("[data-heading-font]").forEach((el) => {
        el.addEventListener("click", () => {
          setFontHeading(el.getAttribute("data-heading-font"));
          renderContent();
        });
      });

      container.querySelectorAll("[data-radius]").forEach((el) => {
        el.addEventListener("click", () => {
          setRadius(el.getAttribute("data-radius"));
          renderContent();
        });
      });

      container.querySelector("#btn-reset-page")?.addEventListener("click", () => {
        setTheme("system");
        setBaseColor("zinc");
        setStyle("nova");
        setChartColor("zinc");
        setFontSans("inter");
        setFontHeading("manrope");
        setRadius("default");
        setSidebarVariant("sidebar");
        setSidebarCollapsible("icon");
        toast.success(t("settings.resetAll"));
        renderContent();
      });
    };

    _unsubLocale = eventBus.on("locale:changed", () => renderContent());
    _unsubAppearance = eventBus.on("appearance:changed", () => renderContent());

    renderContent();
  },
  unmount() {
    if (_unsubLocale) _unsubLocale();
    if (_unsubAppearance) _unsubAppearance();
  },
};
