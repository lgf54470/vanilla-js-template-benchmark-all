import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-toast, 60);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}
.toast-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0.75rem 1rem;
  background-color: var(--color-card);
  color: var(--color-fg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  min-width: 18rem;
  max-width: 24rem;
  font-size: var(--text-sm);
  box-sizing: border-box;
}
.toast-item--success { border-color: var(--color-border); }
.toast-item--success .toast-icon { color: var(--color-primary); }
.toast-item--error { border-color: var(--color-danger); }
.toast-item--error .toast-icon { color: var(--color-danger); }
.toast-item--info .toast-icon { color: var(--color-fg-muted); }
.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}
.toast-msg {
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
}
.toast-close {
  cursor: pointer;
  color: var(--color-fg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}
.toast-close:hover { color: var(--color-fg); }
`;

export class DsToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.toasts = [];
  }

  connectedCallback() {
    this.render();
  }

  show(arg1, arg2 = "info", arg3 = 3000) {
    let message = "";
    let type = "info";
    let duration = 3000;

    if (typeof arg1 === "string") {
      message = arg1;
      type = typeof arg2 === "string" ? arg2 : "info";
      duration = typeof arg3 === "number" ? arg3 : 3000;
    } else if (arg1 && typeof arg1 === "object") {
      message = arg1.message || arg1.title || arg1.text || arg1.description ||
        (arg1.toString && arg1.toString() !== "[object Object]"
          ? arg1.toString()
          : JSON.stringify(arg1));
      type = arg1.type || (typeof arg2 === "string" ? arg2 : "info");
      duration = arg1.duration !== undefined
        ? arg1.duration
        : (typeof arg2 === "number" ? arg2 : 3000);
    }

    const id = "t_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    this.toasts.push({ id, message: String(message), type });
    this.render();

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.render();
  }

  render() {
    const listHtml = this.toasts.map((t) => {
      let iconName = "info";
      if (t.type === "success") iconName = "check-circle";
      else if (t.type === "error") iconName = "alert-circle";

      return `
        <div class="toast-item toast-item--${t.type}" data-id="${t.id}">
          <span class="toast-icon">${createIcon(iconName)}</span>
          <span class="toast-msg">${t.message}</span>
          <span class="toast-close" data-id="${t.id}">${createIcon("x")}</span>
        </div>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `<div data-slot="toast-container">${listHtml}</div>`;

    this.shadowRoot.querySelectorAll(".toast-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.remove(btn.getAttribute("data-id"));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

export class DsToastHost extends DsToast {}

if (!customElements.get("ds-toast")) customElements.define("ds-toast", DsToast);
if (!customElements.get("ds-toast-host")) customElements.define("ds-toast-host", DsToastHost);

let globalHost = null;

function getHost() {
  if (typeof document === "undefined") return null;
  if (!globalHost) {
    globalHost = document.querySelector("ds-toast");
    if (!globalHost) {
      globalHost = document.createElement("ds-toast");
      document.body.appendChild(globalHost);
    }
  }
  return globalHost;
}

export const toast = (msg, dur) => getHost()?.show(msg, "info", dur);
toast.success = (msg, dur) => getHost()?.show(msg, "success", dur);
toast.error = (msg, dur) => getHost()?.show(msg, "error", dur);
toast.info = (msg, dur) => getHost()?.show(msg, "info", dur);
