// apps/web/src/shared/lib/dom.js — DOM 工具
//
// waitForTransition(el, fallbackMs)：弹层关闭等"动画"（CSS.md §9 全站 no-motion
// 下 transitionDuration 为 0，立即 resolve；禁止裸 setTimeout(固定ms)）。
// isOutsideClick：document 级"外点关闭"判定，必须用 composedPath()
// （嵌套 shadow 下 Node.contains() 恒 false，CSS.md §9）。

/**
 * 等待元素的 transition 结束；no-motion 下立即完成。
 * @param {Element} el
 * @param {number} fallbackMs transitionDuration 解析失败时的兜底
 * @returns {Promise<void>}
 */
export function waitForTransition(el, fallbackMs = 200) {
  return new Promise((resolve) => {
    const style = getComputedStyle(el);
    let duration = 0;
    try {
      const d = style.transitionDuration;
      if (d && d !== "0s" && !d.includes("0,")) {
        duration = parseFloat(d) * (d.endsWith("ms") ? 1 : 1000) || 0;
      }
    } catch {
      duration = 0;
    }
    if (duration <= 0) {
      resolve();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", finish);
      resolve();
    };
    el.addEventListener("transitionend", finish);
    setTimeout(finish, Math.min(duration + 50, fallbackMs));
  });
}

/**
 * 点击目标是否在 container 之外（含 shadow 穿透）。
 * @param {Event} event
 * @param {Node} container
 */
export function isOutsideClick(event, container) {
  const path = event.composedPath?.() ?? [];
  return !path.includes(container);
}

/** 元素可见性（弹层用） */
export function isElementVisible(el) {
  return !!el && el.getClientRects().length > 0;
}
