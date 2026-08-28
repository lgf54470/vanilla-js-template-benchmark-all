// apps/web/src/shared/ui/base.js — Web Component 基础设施
//
// define(name, Ctor)          —— 防重复注册的 customElements.define
// attachStyles(host, cssText) —— 把 no-motion + 组件样式注入 shadow root
//                                （no-motion 永远排第一，CSS.md §9）
// UA 重置：组件 CSS 内必须先把原生 button/input/a 的 font/color/background/
// border 归零（docs/bug/2026-08-28-shadow-ua-styles-leak.md 教训），本文件提供
// resetUaCss() 帮助拼接这段样板。

export const NO_MOTION_CSS =
  "*,*::before,*::after{animation:none!important;transition:none!important}";

/** UA 样式重置样板：shadow 内原生表单元素必须重置（Components.md §1 / CSS.md §9） */
export const UA_RESET_CSS = `
button,input,textarea,select{font:inherit;color:inherit;background:none;border:0;margin:0;padding:0}
button{cursor:pointer}
button:disabled,input:disabled{opacity:.5;cursor:not-allowed}
a{color:inherit;text-decoration:none}
svg{display:block}
`;

/**
 * 注册自定义元素（开发热重载/重复 import 时静默跳过重复定义）。
 * @param {string} name
 * @param {CustomElementConstructor} Ctor
 */
export function define(name, Ctor) {
  if (!customElements.get(name)) customElements.define(name, Ctor);
}

/**
 * 把 no-motion + UA 重置 + 组件样式注入 shadow root。
 * no-motion 样式表恒为第一个（CSS.md §9：light DOM 规则穿不透 shadow，必须注入）。
 * @param {HTMLElement} host
 * @param {string} cssText 组件样式
 */
export function attachStyles(host, cssText) {
  const root = host.shadowRoot;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`${UA_RESET_CSS}\n${cssText}`);

  const existing = [...(root.adoptedStyleSheets ?? [])];
  let noMotion = existing.find((s) => s._noMotion);
  if (!noMotion) {
    noMotion = new CSSStyleSheet();
    noMotion.replaceSync(NO_MOTION_CSS);
    noMotion._noMotion = true;
  }
  root.adoptedStyleSheets = [
    noMotion,
    ...existing.filter((s) => !s._noMotion),
    sheet,
  ];
}

/** 轻量模板辅助：创建元素并设置属性 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2), v);
    } else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(
      child instanceof Node ? child : document.createTextNode(String(child)),
    );
  }
  return node;
}
