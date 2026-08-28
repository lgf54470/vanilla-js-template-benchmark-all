/**
 * app/shell/preview-icons.js — 主题面板图表色磁贴预览（ARCHITECTURE §3）。
 *
 * 磁贴必须渲染在 light DOM：chart-<name> 类由全局 palettes-chart.css 定义，
 * 文档样式表穿不透 shadow 边界（docs/CSS.md §9），shadow 内拿不到
 * --chart-1..5。五根高低不一的色条模拟迷你柱状图，直观预览该图表色的
 * 五段序列。
 */

/**
 * @param {string} chartColor 图表色名（CHART_COLOR_NAMES 之一）
 * @returns {HTMLSpanElement} 挂在 light DOM 的预览磁贴
 */
export function createChartPreview(chartColor) {
  const tile = document.createElement("span");
  tile.className = `ts-chart chart-${chartColor}`;
  tile.setAttribute("aria-hidden", "true");
  const heights = ["0.35rem", "0.55rem", "0.45rem", "0.65rem", "0.5rem"];
  for (const h of heights) {
    const bar = document.createElement("i");
    bar.className = "ts-bar";
    bar.style.blockSize = h;
    tile.append(bar);
  }
  return tile;
}
