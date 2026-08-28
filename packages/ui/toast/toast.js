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
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-card-fg);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
}
.toast-item--success { border-left: 4px solid var(--color-success); }
.toast-item--error { border-left: 4px solid var(--color-danger); }
.toast-item--info { border-left: 4px solid var(--color-primary); }
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

  show({ message, type = "info", duration = 3000 }) {
    const id = Date.now() + Math.random();
    this.toasts.push({ id, message, type });
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
            <span>${
        createIcon(
          t.type === "success" ? "circle-check" : t.type === "error" ? "alert-circle" : "info",
        )
      }</span>
            <span style="flex: 1;">${t.message}</span>
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

export const toast = {
  success: (msg, dur) => getHost()?.show({ message: msg, type: "success", duration: dur }),
  error: (msg, dur) => getHost()?.show({ message: msg, type: "error", duration: dur }),
  info: (msg, dur) => getHost()?.show({ message: msg, type: "info", duration: dur }),
};
