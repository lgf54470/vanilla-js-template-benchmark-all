// apps/web/src/shared/lib/styles.js — 页面样式注入
//
// 用法（AGENTS.md「新增模块最小步骤」）：
//   ensurePageStyles(import.meta.url, "./styles/page.css")
//
// 以「调用模块的 URL」为基准解析相对路径（<link rel="stylesheet"> 在 head 里以
// 文档 URL 为基准，模块内相对路径必须自己 resolve），同一 URL 只注入一次。
// 默认注入 document.head；传 targetRoot（如 shadowRoot）则注入该根，供
// app-shell 等 shadow 组件复用同一套外链 CSS 机制（shadow 内 <link> 与
// document 同源加载，无 URL 解析歧义，天然缓存去重）。
//
// 孤儿样式文件（模块被移除但 CSS 仍在）不会报错，见
// docs/bug/2026-08-28-orphan-page-css.md。

const injected = new Set();

/**
 * @param {string} importMetaUrl 调用方的 import.meta.url
 * @param {string} relativePath 相对该模块的 CSS 路径（"./styles/x.css"）
 * @param {Node} [targetRoot] 注入目标（默认 document.head）
 * @returns {string} 解析后的绝对 URL（幂等）
 */
export function ensurePageStyles(
  importMetaUrl,
  relativePath,
  targetRoot = null,
) {
  const url = new URL(relativePath, importMetaUrl).href;
  if (injected.has(url)) return url;
  injected.add(url);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  (targetRoot ?? document.head).append(link);
  return url;
}
