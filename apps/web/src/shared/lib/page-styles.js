/**
 * shared/lib/page-styles.js — light-DOM 页面样式注入（docs/CSS.md §1 通道 4）。
 *
 * 模块页面运行在 light DOM（<main> 内），shadow 组件样式管不到；
 * 统一经本入口把模块自带 CSS 以 <link> 注入 document.head，
 * 同一 URL 只注入一次（Set 去重）。链接指向的文件缺失时浏览器静默 404，
 * 不会抛异常阻断模块渲染（孤儿样式文件容错，AGENTS.md「新增模块」步骤 3）。
 */

/** @type {Set<string>} 已注入的样式 URL */
const injected = new Set();

/**
 * 注入模块页面样式（幂等）。
 * @param {string} moduleMetaUrl 调用方 import.meta.url（解析相对路径的基准）
 * @param {string} cssPath 相对模块文件的 CSS 路径（如 "./styles/page.css"）
 * @returns {string} 解析后的样式 URL
 */
export function ensurePageStyles(moduleMetaUrl, cssPath) {
  const url = new URL(cssPath, moduleMetaUrl).href;
  if (injected.has(url)) return url;
  injected.add(url);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.append(link);
  return url;
}
