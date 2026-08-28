/**
 * shared/ui/base.js — 所有 ds-* 组件的公共基座。
 *
 * - attachStyles(root, cssUrl)：把 [no-motion, icons.css, 组件 css] 三个样式表
 *   注入 shadow root 的 adoptedStyleSheets（light DOM 全局规则穿不透 shadow，
 *   no-motion 必须逐 root 注入，docs/CSS.md §1/§9）。URL 级缓存，样式表实例
 *   全局复用；CSS modules 在 Deno 下不可用，统一走 fetch + CSSStyleSheet。
 * - createIcon(name)：构建 `<svg class="icon"><use href="/icons.svg#name"/></svg>`。
 * -UA 重置不做在这里——各组件 css 首段必须自行重置原生控件（事故档案
 *   docs/bug/2026-08-28-shadow-ua-styles-leak.md）。
 */

/** @type {Map<string, Promise<CSSStyleSheet>>} */
const sheetCache = new Map();

/**
 * @param {string} url
 * @returns {Promise<CSSStyleSheet>}
 */
function loadStylesheet(url) {
  if (!sheetCache.has(url)) {
    sheetCache.set(
      url,
      (async () => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`attachStyles: fetch ${url} -> ${res.status}`);
        }
        const sheet = new CSSStyleSheet();
        await sheet.replace(await res.text());
        return sheet;
      })(),
    );
  }
  return sheetCache.get(url);
}

/**
 * 把共享基样式（no-motion + 图标基样式）与组件样式注入 shadow root。
 * 无 CSSStyleSheet 的环境（Deno 测试 dom-shim）静默跳过，不阻塞组件逻辑。
 *
 * @param {ShadowRoot} root
 * @param {string} [cssUrl] 组件样式文件绝对 URL（new URL("./x.css", import.meta.url).href）
 */
export async function attachStyles(root, cssUrl) {
  if (typeof CSSStyleSheet === "undefined") return;
  const urls = [
    new URL("../styles/base/no-motion.css", import.meta.url).href,
    new URL("./icons.css", import.meta.url).href,
  ];
  if (cssUrl) urls.push(cssUrl);
  try {
    const sheets = await Promise.all(urls.map(loadStylesheet));
    root.adoptedStyleSheets = sheets;
  } catch (err) {
    console.warn("attachStyles: 样式注入失败", err);
  }
}

/**
 * 构建引用 public/icons.svg sprite 的内联 SVG 图标节点。
 *
 * @param {string} name sprite 内 symbol id
 * @param {{ size?: "sm" | "md" | "lg" | "xl" }} [options]
 * @returns {SVGSVGElement}
 */
export function createIcon(name, options = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const sizeCls = options.size && options.size !== "md"
    ? `icon icon-${options.size}`
    : "icon";
  svg.setAttribute("class", sizeCls);
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `/icons.svg#${name}`);
  svg.appendChild(use);
  return svg;
}
