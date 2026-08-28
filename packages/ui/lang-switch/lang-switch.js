import { attachStyles, createIcon } from "../base.js";
import "../dropdown-menu/dropdown-menu.js";

const css = `
:host {
  display: inline-block;
  position: relative;
}
.lang-btn {
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
}
.lang-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
.lang-panel {
  min-width: 11rem;
}
.menu-header {
  padding: var(--space-2);
  font-size: var(--text-2xs);
  font-weight: 600;
  color: var(--color-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.lang-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-fg);
  cursor: pointer;
  user-select: none;
}
.lang-item:hover {
  background-color: var(--color-muted);
}
.lang-item--active {
  font-weight: 600;
  color: var(--color-primary);
}
.check-box {
  width: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.short-badge {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
  margin-left: auto;
}
.separator {
  height: 1px;
  background-color: var(--color-border);
  margin-block: var(--space-1);
}
`;

const LOCALES = [
  { value: "zh-CN", native: "简体中文", short: "简体" },
  { value: "zh-TW", native: "繁體中文", short: "繁體" },
  { value: "en", native: "English", short: "EN" },
];

export class DsLangSwitch extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._value = "zh-CN";
  }

  get value() {
    return this.getAttribute("value") || this._value;
  }
  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const cur = this.value;

    this.shadowRoot.innerHTML = `
      <ds-dropdown-menu align="right">
        <button data-slot="lang-switch-trigger" class="lang-btn" slot="trigger" type="button" aria-label="切换语言" title="切换语言">
          ${createIcon("languages")}
        </button>

        <div data-slot="lang-switch-menu" class="lang-panel">
          <div class="menu-header">语言 / Language</div>
          <div class="separator"></div>
          ${
      LOCALES.map((l) => {
        const active = l.value === cur;
        return `
              <div class="lang-item ${active ? "lang-item--active" : ""}" data-value="${l.value}">
                <span class="check-box">${active ? createIcon("check") : ""}</span>
                <span style="flex: 1;">${l.native}</span>
                <span class="short-badge">${l.short}</span>
              </div>
            `;
      }).join("")
    }
        </div>
      </ds-dropdown-menu>
    `;

    this.shadowRoot.querySelectorAll(".lang-item").forEach((item) => {
      item.addEventListener("click", () => {
        const val = item.getAttribute("data-value");
        this.value = val;
        this.dispatchEvent(new CustomEvent("ds-lang-change", { detail: { value: val } }));
        const menu = this.shadowRoot.querySelector("ds-dropdown-menu");
        if (menu) menu.close();
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-lang-switch")) customElements.define("ds-lang-switch", DsLangSwitch);
