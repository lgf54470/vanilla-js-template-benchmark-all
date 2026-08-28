/**
 * shared/lib/page-styles.js — light-DOM 页面样式注入（docs/CSS.md §1 通道 4）。
 *
 * 用法：在页面模块里
 *   import { ensurePageStyles } from "../../shared/lib/page-styles.js";
 *   ensurePageStyles(import.meta.url, "./styles/<page>.css");
 * 按解析后的绝对 href 去重注入 <link rel="stylesheet">；孤儿样式文件不报错。
 */

const injected = new Set();

/**
 * @param {string} callerUrl 调用方模块 URL（传 import.meta.url）
 * @param {string} spec 相对调用方的样式路径
 */
export function ensurePageStyles(callerUrl, spec) {
  const href = new URL(spec, callerUrl).href;
  if (injected.has(href)) return;
  injected.add(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
}
