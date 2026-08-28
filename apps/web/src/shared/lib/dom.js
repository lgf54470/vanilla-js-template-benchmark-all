/**
 * 弹层等待过渡/动画完成（感知全站 no-motion 瞬时完成）
 */
export function waitForTransition(element, fallbackMs = 0) {
  if (!element || typeof globalThis.window === "undefined") {
    return Promise.resolve();
  }

  const computed = globalThis.getComputedStyle(element);
  const durationStr = computed.transitionDuration || "0s";
  const durationSec = parseFloat(durationStr) || 0;

  // If no-motion is in effect or duration is 0, resolve immediately
  if (durationSec === 0 && fallbackMs === 0) {
    return Promise.resolve();
  }

  const timeoutMs = durationSec > 0 ? durationSec * 1000 : fallbackMs;
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

/**
 * 判断事件点击是否发生在目标元素（包括 Shadow DOM 穿透）内部
 */
export function isComposedClickInside(event, targetElement) {
  if (!event || !targetElement) return false;
  const path = event.composedPath ? event.composedPath() : [];
  return path.includes(targetElement);
}
