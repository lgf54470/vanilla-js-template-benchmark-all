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
  padding-block: var(--space-3);
  padding-inline: var(--space-4);
  background-color: var(--color-card);
  color: var(--color-card-fg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  min-width: 16rem;
  max-width: 24rem;
  font-size: var(--text-sm);
}
.toast-icon--success { color: var(--color-success); }
.toast-icon--error { color: var(--color-danger); }
.toast-icon--info { color: var(--color-primary); }
.toast-msg { flex: 1; }
.toast-close {
  cursor: pointer;
  color: var(--color-fg-muted);
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

  show(message, type = "info", duration = 3000) {
    const id = "t_" + Math.random().toString(36).slice(2, 8);
    const item = { id, message, type };
    this.toasts.push(item);
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
      if (t.type === "success") iconName = "circle-check";
      else if (t.type === "error") iconName = "alert-circle";

      return `
        <div class="toast-item" data-id="${t.id}">
          <span class="toast-icon--${t.type}">${createIcon(iconName)}</span>
          <span class="toast-msg">${t.message}</span>
          <span class="toast-close" data-id="${t.id}">${createIcon("x")}</span>
        </div>
      `;
    }).join("");

    this.shadowRoot.innerHTML = listHtml;

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

export const toast = {
  success: (msg, dur) => getHost()?.show(msg, "success", dur),
  error: (msg, dur) => getHost()?.show(msg, "error", dur),
  info: (msg, dur) => getHost()?.show(msg, "info", dur),
};
