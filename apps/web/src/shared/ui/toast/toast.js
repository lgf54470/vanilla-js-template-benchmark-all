// apps/web/src/shared/ui/toast/toast.js — <ds-toast-host> + toast.* 命令式 API
//
// 替代 alert（硬规则 4）。全局单例挂载于 <body> 末尾（Components.md §8），
// 提供 toast.success/error/info。内部渲染队列，--z-toast 层级最高。
// no-motion 下瞬时出现/消失。

import { attachStyles, define } from "../base.js";
import { iconSvg } from "../../lib/icons.js";

const TOAST_CSS = `
:host{position:fixed;right:1rem;bottom:1rem;display:flex;flex-direction:column;
  gap:.5rem;z-index:var(--z-toast);pointer-events:none}
.item{display:flex;align-items:flex-start;gap:.5rem;min-width:16rem;max-width:24rem;
  padding:.6rem .9rem;border-radius:var(--ds-toast-radius);
  background:var(--ds-toast-bg);color:var(--ds-toast-fg);
  border:1px solid var(--ds-toast-border);box-shadow:var(--ds-toast-shadow);
  font-size:.85rem;line-height:1.5;pointer-events:auto}
.item .icon{flex:none;margin-top:.1rem}
.item[variant="success"] .icon{color:var(--color-success)}
.item[variant="error"] .icon{color:var(--color-danger)}
.item[variant="info"] .icon{color:var(--color-fg-muted)}
.item .close{margin-left:auto;flex:none;background:none;border:0;color:var(--color-fg-muted);
  cursor:pointer;padding:.1rem}
.item .close:hover{color:var(--color-fg)}
`;

class DsToastHost extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    attachStyles(this, TOAST_CSS);
  }
  connectedCallback() {
    // 仅当挂载到 body 时接管渲染
    this.setAttribute("role", "status");
    this.setAttribute("aria-live", "polite");
  }
  show(message, variant = "info", timeoutMs = 4000) {
    const item = document.createElement("div");
    item.className = "item";
    item.setAttribute("variant", variant);
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.innerHTML = iconSvg(
      variant === "success"
        ? "circle-check"
        : variant === "error"
        ? "circle-alert"
        : "info",
      15,
    );
    const text = document.createElement("span");
    text.textContent = message;
    const close = document.createElement("button");
    close.className = "close";
    close.setAttribute("aria-label", "关闭");
    close.innerHTML = iconSvg("x", 13);
    close.addEventListener("click", () => this._dismiss(item));
    item.append(icon, text, close);
    this.shadowRoot.append(item);

    if (timeoutMs > 0) {
      setTimeout(() => this._dismiss(item), timeoutMs);
    }
    return item;
  }
  _dismiss(item) {
    if (!item.isConnected) return;
    item.remove();
  }
}
define("ds-toast-host", DsToastHost);

let host = null;
function getHost() {
  if (!host) {
    host = document.createElement("ds-toast-host");
    document.body.append(host);
  }
  return host;
}

export const toast = {
  success(message) {
    getHost().show(message, "success");
  },
  error(message) {
    getHost().show(message, "error", 6000);
  },
  info(message) {
    getHost().show(message, "info");
  },
};
