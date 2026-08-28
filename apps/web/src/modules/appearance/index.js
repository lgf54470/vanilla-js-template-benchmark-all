import { registerTranslations, t } from "../../shared/lib/i18n.js";
import zhCN from "./i18n/zh-CN.json" with { type: "json" };
import zhTW from "./i18n/zh-TW.json" with { type: "json" };
import en from "./i18n/en.json" with { type: "json" };
import { BASE_COLORS, CHART_COLORS, FONTS, STYLES } from "@contracts/constants.js";
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

registerTranslations("zh-CN", "appearance", zhCN);
registerTranslations("zh-TW", "appearance", zhTW);
registerTranslations("en", "appearance", en);

export default {
  mount(container) {
    const renderContent = () => {
      const state = getAppearanceState();

      container.innerHTML = `
        <div class="page-container">
          <div class="page-header">
            <div>
              <h1 class="page-title">${t("appearance.title")}</h1>
              <p class="page-description">${t("appearance.description")}</p>
            </div>
          </div>

          <!-- Theme -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("appearance.themeMode")
      }</div>
            <ds-segmented-control id="seg-theme"></ds-segmented-control>
          </ds-card>

          <!-- Base Colors -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("appearance.baseColors")
      }</div>
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
              ${
        BASE_COLORS.map((c) => {
          const active = state.baseColor === c;
          return `
                  <button class="color-btn" data-color="${c}" style="display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 2px solid ${
            active ? "var(--color-primary)" : "var(--color-border)"
          }; background: var(--color-card); cursor: pointer;">
                    <span class="swatch-${c}" style="display: inline-block; width: 1.25rem; height: 1.25rem; border-radius: var(--radius-full);"></span>
                    <span style="font-size: var(--text-sm); text-transform: capitalize; font-weight: ${
            active ? "600" : "400"
          };">${c}</span>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Design Styles -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("appearance.designStyles")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: var(--space-3);">
              ${
        STYLES.map((s) => {
          const active = state.style === s;
          return `
                  <button class="style-btn" data-style="${s}" style="padding: var(--space-3); border-radius: var(--radius-md); border: 2px solid ${
            active ? "var(--color-primary)" : "var(--color-border)"
          }; background: var(--color-card); text-align: center; cursor: pointer;">
                    <div style="font-size: var(--text-base); font-weight: 600; text-transform: capitalize; color: var(--color-fg);">${s}</div>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Chart Colors -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("appearance.chartPalettes")
      }</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr)); gap: var(--space-2);">
              ${
        CHART_COLORS.map((ch) => {
          const active = state.chartColor === ch;
          return `
                  <button class="chart-btn" data-chart="${ch}" style="padding: var(--space-2); border-radius: var(--radius-md); border: 2px solid ${
            active ? "var(--color-primary)" : "var(--color-border)"
          }; background: var(--color-card); cursor: pointer; text-align: center;">
                    <span style="font-size: var(--text-xs); font-weight: ${
            active ? "600" : "400"
          };">${ch}</span>
                  </button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Corner Radius -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("appearance.radiusSize")
      }</div>
            <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
              ${
        ["0rem", "0.375rem", "0.5rem", "0.625rem", "0.75rem", "1rem"].map((r) => {
          const active = state.radius === r;
          return `
                  <ds-button class="radius-btn" data-radius="${r}" variant="${
            active ? "primary" : "outline"
          }" size="sm">${r}</ds-button>
                `;
        }).join("")
      }
            </div>
          </ds-card>

          <!-- Typography -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("appearance.fontSettings")
      }</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
              <div>
                <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">正文字体</label>
                <ds-select id="select-font-sans">
                  ${
        FONTS.map((f) =>
          `<option value="${f.value}" ${
            state.fontSans === f.value ? "selected" : ""
          }>${f.name}</option>`
        ).join("")
      }
                </ds-select>
              </div>
              <div>
                <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">标题字体</label>
                <ds-select id="select-font-heading">
                  <option value="inherit">跟随正文 (Inherit)</option>
                  ${
        FONTS.map((f) =>
          `<option value="${f.value}" ${
            state.fontHeading === f.value ? "selected" : ""
          }>${f.name}</option>`
        ).join("")
      }
                </ds-select>
              </div>
            </div>
          </ds-card>

          <!-- Sidebar Settings -->
          <ds-card>
            <div style="font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3);">${
        t("appearance.sidebarSettings")
      }</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
              <div>
                <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">侧栏形态</label>
                <ds-select id="select-sidebar-variant">
                  <option value="sidebar" ${
        state.sidebarVariant === "sidebar" ? "selected" : ""
      }>标准嵌入 (Sidebar)</option>
                  <option value="floating" ${
        state.sidebarVariant === "floating" ? "selected" : ""
      }>悬浮卡片 (Floating)</option>
                  <option value="inset" ${
        state.sidebarVariant === "inset" ? "selected" : ""
      }>内凹结构 (Inset)</option>
                </ds-select>
              </div>
              <div>
                <label style="font-size: var(--text-xs); font-weight: 500; margin-bottom: var(--space-1); display: block;">折叠模式</label>
                <ds-select id="select-sidebar-collapsible">
                  <option value="icon" ${
        state.sidebarCollapsible === "icon" ? "selected" : ""
      }>紧凑图标 (Icon)</option>
                  <option value="offcanvas" ${
        state.sidebarCollapsible === "offcanvas" ? "selected" : ""
      }>抽屉隐藏 (Offcanvas)</option>
                  <option value="none" ${
        state.sidebarCollapsible === "none" ? "selected" : ""
      }>禁止折叠 (None)</option>
                </ds-select>
              </div>
            </div>
          </ds-card>
        </div>
      `;

      // Event Bindings
      const themeSeg = container.querySelector("#seg-theme");
      if (themeSeg) {
        themeSeg.items = [
          { value: "system", label: "跟随系统" },
          { value: "light", label: "明亮模式" },
          { value: "dark", label: "暗黑模式" },
        ];
        themeSeg.value = state.theme;
        themeSeg.addEventListener("ds-change", (e) => {
          setTheme(e.detail.value);
          renderContent();
        });
      }

      container.querySelectorAll(".color-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          setBaseColor(btn.getAttribute("data-color"));
          renderContent();
        });
      });

      container.querySelectorAll(".style-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          setStyle(btn.getAttribute("data-style"));
          renderContent();
        });
      });

      container.querySelectorAll(".chart-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          setChartColor(btn.getAttribute("data-chart"));
          renderContent();
        });
      });

      container.querySelectorAll(".radius-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          setRadius(btn.getAttribute("data-radius"));
          renderContent();
        });
      });

      container.querySelector("#select-font-sans")?.addEventListener("ds-change", (e) => {
        setFontSans(e.detail.value);
      });

      container.querySelector("#select-font-heading")?.addEventListener("ds-change", (e) => {
        setFontHeading(e.detail.value);
      });

      container.querySelector("#select-sidebar-variant")?.addEventListener("ds-change", (e) => {
        setSidebarVariant(e.detail.value);
      });

      container.querySelector("#select-sidebar-collapsible")?.addEventListener("ds-change", (e) => {
        setSidebarCollapsible(e.detail.value);
      });
    };

    renderContent();
  },
  unmount() {},
};
