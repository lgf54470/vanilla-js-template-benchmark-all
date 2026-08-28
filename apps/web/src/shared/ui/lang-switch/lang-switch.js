import { attachStyles, createIcon } from "../base.js";
import { SUPPORTED_LOCALES } from "@contracts/constants.js";
import { eventBus } from "../../core/event-bus.js";

const css = `
:host { display: inline-block; position: relative; }
.lang-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 2rem;
  padding-inline: var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  color: var(--color-fg-muted);
  cursor: pointer;
}
.lang-btn:hover {
  color: var(--color-fg);
  background-color: var(--color-muted);
}
select {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
`;

const LOCALE_NAMES = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "en": "English",
};

export class DsLangSwitch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  get currentLocale() {
    return localStorage.getItem("pref:locale") || "zh-CN";
  }

  render() {
    const cur = this.currentLocale;
    const name = LOCALE_NAMES[cur] || cur;

    const optionsHtml = SUPPORTED_LOCALES.map((loc) => {
      return `<option value="${loc}" ${loc === cur ? "selected" : ""}>${
        LOCALE_NAMES[loc] || loc
      }</option>`;
    }).join("");

    this.shadowRoot.innerHTML = `
      <button class="lang-btn" type="button" aria-label="Change Language">
        ${createIcon("languages")}
        <span>${name}</span>
      </button>
      <select aria-label="Select Language">
        ${optionsHtml}
      </select>
    `;

    const select = this.shadowRoot.querySelector("select");
    select.addEventListener("change", (e) => {
      const newLoc = e.target.value;
      localStorage.setItem("pref:locale", newLoc);
      document.documentElement.setAttribute("lang", newLoc);
      eventBus.emit("locale:changed", { locale: newLoc });
      this.render();
    });

    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-lang-switch")) customElements.define("ds-lang-switch", DsLangSwitch);
