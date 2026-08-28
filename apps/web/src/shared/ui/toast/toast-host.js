/**
 * toast-host.js — ds-toast 的命令式单例宿主（docs/Components.md §8）。
 *
 * 用法：import { toast } from "…/shared/ui/toast/toast-host.js"，然后
 * toast.success("已保存") / toast.error("失败") / toast.info("提示")。
 *
 * - 懒挂载：首次调用时在 document.body 末尾创建 fixed 容器；定位选
 *   「屏幕底部居中」——移动端（Sidebar 左滑场景）与桌面均稳定，且避开
 *   右下角常见的悬浮操作按钮（FAB）区域。
 * - 层级：z-index var(--z-toast)（tokens/zindex.css 全站最高层）。
 * - 队列：多条纵向堆叠（flex column + gap --space-2）；容器自身
 *   pointer-events:none，仅条目恢复 auto，不拦截页面交互。
 * - 生命周期：每条展示 3 秒后自动移除（展示时长语义，setTimeout 允许）；
 *   移除前经 waitForTransition 等待样式收尾（no-motion 下立即完成，
 *   docs/CSS.md §9）。
 */
import { waitForTransition } from "../../lib/dom.js";
import "./toast.js";

/** 单条 toast 展示时长（毫秒） */
const DISPLAY_MS = 3000;

/** @type {HTMLDivElement | null} 懒创建的宿主容器 */
let hostEl = null;

/** 惰性创建并返回挂载在 body 末尾的 toast 容器（样式走令牌变量） */
function ensureHost() {
  if (hostEl?.isConnected) return hostEl;
  hostEl = document.createElement("div");
  hostEl.className = "ds-toast-host";
  hostEl.style.cssText = [
    "position: fixed",
    "inset-inline: 0",
    "bottom: var(--space-4)",
    "display: flex",
    "flex-direction: column",
    "align-items: center",
    "gap: var(--space-2)",
    "z-index: var(--z-toast)",
    "pointer-events: none",
  ].join(";");
  document.body.append(hostEl);
  return hostEl;
}

/**
 * 渲染一条 toast：入队 → 3 秒后或手动关闭时移除。
 * @param {"success" | "error" | "info"} type
 * @param {string} message
 */
function show(type, message) {
  const host = ensureHost();
  const el = document.createElement("ds-toast");
  el.setAttribute("type", type);
  el.setAttribute("message", message);
  let dismissed = false;
  let timer = 0;
  const dismiss = async () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(timer);
    await waitForTransition(el, 150);
    el.remove();
  };
  timer = setTimeout(dismiss, DISPLAY_MS);
  el.addEventListener("toast-dismiss", () => {
    clearTimeout(timer);
    dismiss();
  });
  host.append(el);
}

/** 全局 toast API（单例宿主，任意模块直接调用） */
export const toast = {
  /** 成功提示（circle-check / --color-success） */
  success(message) {
    show("success", message);
  },
  /** 错误提示（circle-alert / --color-danger，role=alert 立即播报） */
  error(message) {
    show("error", message);
  },
  /** 中性提示（info / --color-primary） */
  info(message) {
    show("info", message);
  },
};
