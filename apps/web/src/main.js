/**
 * src/main.js — 前端引导入口。
 * M1：应用外观引擎（PREPAINT 已在首帧前应用过，这里运行时接管）并渲染
 * 令牌层验收样张（切 base-*、style-*、dark 即时变色）。M4 起替换为应用壳装配。
 *
 * 注意：块注释内不得出现星斜杠序列（会提前终止注释，见 docs/CSS.md §8 同款教训）。
 */

import {
  CHART_OPTIONS,
  FONT_OPTIONS,
  initAppearance,
  PALETTE_OPTIONS,
  STYLE_OPTIONS,
  updatePref,
} from "./shared/lib/appearance.js";
import { ensurePageStyles } from "./shared/lib/page-styles.js";

initAppearance();
ensurePageStyles(import.meta.url, "./app/dev/playground.css");

// ---- M1 验收样张（临时，M4 应用壳替换）----
const app = document.getElementById("app");

const chip = (label, value, active) =>
  `<button class="pg-chip${
    active ? " is-active" : ""
  }" data-set="${label}" data-value="${value}">${value}</button>`;

const group = (title, options, current, key) => `
  <section class="pg-group">
    <h2>${title}</h2>
    <div class="pg-row">
      ${options.map((o) => chip(key, o, o === current)).join("")}
    </div>
  </section>`;

function render() {
  const html = document.documentElement;
  const state = {
    theme: localStorage.getItem("pref:theme") ?? "system",
    style: html.className.match(/style-[\w-]+/)?.[0] ?? "style-nova",
    palette: html.className.match(/base-[\w-]+/)?.[0] ?? "base-zinc",
    chart: html.className.match(/chart-[\w-]+/)?.[0] ?? "",
    font: html.style.getPropertyValue("--font-sans-base").match(/^"([^"]+)"/)
      ?.[1] ?? "",
  };

  app.innerHTML = `
  <main class="pg-main">
    <h1 class="pg-title">令牌层验收样张（M1）</h1>
    <p class="pg-sub">Inter Variable 正文 / Manrope Variable 标题 · 切换即时生效，刷新无闪烁</p>

    ${
    group(
      "亮暗（pref:theme）",
      ["system", "light", "dark"],
      state.theme,
      "theme",
    )
  }
    ${group("风格 style-*", STYLE_OPTIONS, state.style, "style")}
    ${group("基色 base-*", PALETTE_OPTIONS, state.palette, "palette")}
    ${group("图表色 chart-*", ["", ...CHART_OPTIONS], state.chart, "chart")}
    ${group("正文字体", ["", ...FONT_OPTIONS], state.font, "font")}

    <section class="pg-group">
      <h2>语义色样卡</h2>
      <div class="pg-row">
        <div class="pg-card pg-demo-card">card</div>
        <button class="pg-btn">primary 按钮</button>
        <span class="pg-badge">badge</span>
        <span class="pg-status pg-status-danger">danger</span>
        <span class="pg-status pg-status-success">success</span>
        <span class="pg-status pg-status-warning">warning</span>
      </div>
      <div class="pg-row pg-chart-row">
        ${
    [1, 2, 3, 4, 5].map((i) =>
      `<div class="pg-chart pg-chart-${i}">chart-${i}</div>`
    ).join("")
  }
      </div>
    </section>
  </main>`;

  for (const btn of app.querySelectorAll(".pg-chip")) {
    btn.addEventListener("click", () => {
      updatePref(btn.dataset.set, btn.dataset.value);
      render();
    });
  }
}

render();
