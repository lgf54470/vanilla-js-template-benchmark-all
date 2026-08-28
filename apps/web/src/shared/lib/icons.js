// apps/web/src/shared/lib/icons.js — 图标 sprite 辅助（Design.md §5）
//
// public/icons.svg 是 Lucide 符号表（55 个 symbol，id 前缀 i-，见
// packages/contracts/constants.js 的 ICON_NAMES 登记）。<use href="/icons.svg#i-x">
// 在 shadow DOM 内同样可用（href 相对文档 base 解析），组件经 iconEl() 生成。

export const ICON_SPRITE_URL = "/icons.svg";

/**
 * @param {string} name 图标名（ICON_NAMES 中的 id，不含 i- 前缀）
 * @param {{ size?: number, class?: string }} [opts]
 * @returns {SVGElement}
 */
export function iconEl(name, opts = {}) {
  const { size = 16, class: cls } = opts;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  if (cls) svg.classList.add(cls);
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `${ICON_SPRITE_URL}#i-${name}`);
  svg.append(use);
  return svg;
}

/** 渲染图标 HTML 字符串（用于 innerHTML 模板场景） */
export function iconSvg(name, size = 16) {
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round" aria-hidden="true">` +
    `<use href="${ICON_SPRITE_URL}#i-${name}"></use></svg>`
  );
}
