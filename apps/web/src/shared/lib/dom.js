/**
 * shared/lib/dom.js — DOM 工具集。
 *
 * waitForTransition：弹层关闭等需要"等动画结束再卸载 DOM"的场景统一入口
 * （docs/CSS.md §9）。全站 no-motion 下 transitionDuration 为 0，立即完成；
 * 禁止在组件里裸 setTimeout(固定ms) 或依赖 transitionend 单一事件。
 */

/**
 * 解析 CSS 时间值（"0s" / "150ms"）为毫秒。
 * @param {string} value
 * @returns {number}
 */
function parseDurationMs(value) {
  const m = String(value ?? "").trim().match(/^([\d.]+)(ms|s)?$/);
  if (!m) return 0;
  const n = Number(m[1]);
  return m[2] === "s" ? n * 1000 : n;
}

/**
 * 等待元素的 transition 结束（取多段 duration 的最大值做超时兜底）。
 * no-motion（或无样式环境）下计算值为 0 → 同步完成，不等待。
 *
 * @param {Element} el
 * @param {number} fallbackMs computed style 不可用时兜底
 * @returns {Promise<void>}
 */
export function waitForTransition(el, fallbackMs = 200) {
  let maxMs = 0;
  try {
    const durations = getComputedStyle(el).transitionDuration;
    maxMs = durations
      .split(",")
      .reduce((acc, d) => Math.max(acc, parseDurationMs(d)), 0);
  } catch {
    maxMs = fallbackMs;
  }
  if (maxMs <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, maxMs + 60);
    el.addEventListener("transitionend", finish);
  });
}

/**
 * document 级"外点关闭"判定：必须用 composedPath()（嵌套 shadow 下
 * Node.contains() 恒 false，docs/CSS.md §9）。
 *
 * @param {Event} event
 * @param {Element} element 目标组件（含其 shadow 内容）
 * @returns {boolean} 事件路径包含 element（即点击发生在其内部）
 */
export function composedPathContains(event, element) {
  const path = event.composedPath?.() ?? [];
  return path.includes(element);
}

/**
 * 深度 contains：跨 shadow 边界递归判断 element 是否包含 target。
 * 适用于无法拿到 event composedPath 的场景。
 *
 * @param {Element} element
 * @param {Node} target
 * @returns {boolean}
 */
export function deepContains(element, target) {
  if (!element || !target) return false;
  if (element.contains(target)) return true;
  if (element.shadowRoot) return deepContains(element.shadowRoot, target);
  return false;
}
