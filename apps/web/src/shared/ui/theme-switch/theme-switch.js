import { attachStyles, createIcon } from "../base.js";
import { getTheme, setTheme } from "../../lib/appearance.js";
import { eventBus } from "../../core/event-bus.js";
import { t } from "../../lib/i18n.js";

const css = `
:host {
  display: inline-block;
}
.theme-group {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-muted);
  border: 1px solid var(--color-border);
}
.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
  user-select: none;
}
.theme-btn:hover {
  color: var(--color-fg);
}
.theme-btn--active {
  background-color: var(--color-bg);
  color: var(--color-fg);
  box-shadow: var(--shadow-xs);
  font-weight: 500;
}
.theme-btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
`;

export class DsThemeSwitch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.unsubscribe = null;
  }

  connectedCallback() {
    this.render();
    this.unsubscribe = eventBus.on("appearance:changed", () => {
      this.render();
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }

  render() {
    const cur = getTheme();

    const buttons = [
      { value: "system", icon: "monitor", label: t("header.system") || "跟随系统" },
      { value: "light", icon: "sun", label: t("header.light") || "浅色模式" },
      { value: "dark", icon: "moon", label: t("header.dark") || "深色模式" },
    ];

    const html = buttons.map((b) => {
      const active = b.value === cur;
      return `
        <button class="theme-btn ${active ? "theme-btn--active" : ""}"
          data-value="${b.value}"
          type="button"
          aria-pressed="${active ? "true" : "false"}"
          title="${b.label}"
          aria-label="${b.label}"
        >
          ${createIcon(b.icon)}
        </button>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `<div class="theme-group" role="group">${html}</div>`;

    this.shadowRoot.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-value");
        setTheme(val);
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-theme-switch")) {
  customElements.define("ds-theme-switch", DsThemeSwitch);
}
