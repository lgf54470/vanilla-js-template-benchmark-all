import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}
.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 18rem;
  max-width: 24rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-fg);
  padding: 0.75rem 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  font-size: var(--text-sm);
  box-sizing: border-box;
}
.toast-item--success {
  border-color: var(--color-border);
}
.toast-item--success .toast-icon {
  color: var(--color-primary);
}
.toast-item--error {
  border-color: var(--color-danger);
}
.toast-item--error .toast-icon {
  color: var(--color-danger);
}
.toast-item--info .toast-icon {
  color: var(--color-fg-muted);
}
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
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        this.render();
      }, duration);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div data-slot="toast-container">
        ${
      this.toasts.map((t) => `
          <div data-slot="toast" class="toast-item toast-item--${t.type}">
            <span class="toast-icon">${
        createIcon(
          t.type === "success" ? "check-circle" : t.type === "error" ? "alert-circle" : "info",
        )
      }</span>
            <span class="toast-msg">${t.message}</span>
          </div>
        `).join("")
    }
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

export class DsToastHost extends DsToast {}

if (!customElements.get("ds-toast")) customElements.define("ds-toast", DsToast);
if (!customElements.get("ds-toast-host")) customElements.define("ds-toast-host", DsToastHost);

let globalToastInstance = null;

function getHost() {
  if (typeof document === "undefined") return null;
  if (!globalToastInstance) {
    globalToastInstance = document.querySelector("ds-toast");
    if (!globalToastInstance) {
      globalToastInstance = document.createElement("ds-toast");
      document.body.appendChild(globalToastInstance);
    }
  }
  return globalToastInstance;
}

export const toast = (msg, dur) => getHost()?.show(msg, "info", dur);
toast.success = (msg, dur) => getHost()?.show(msg, "success", dur);
toast.error = (msg, dur) => getHost()?.show(msg, "error", dur);
toast.info = (msg, dur) => getHost()?.show(msg, "info", dur);
