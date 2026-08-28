import { attachStyles } from "../base.js";
import { getTheme, setTheme } from "../../lib/appearance.js";
import { eventBus } from "../../core/event-bus.js";
import "../segmented-control/segmented-control.js";

const css = `
:host { display: inline-block; }
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
      this.updateControl();
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }

  updateControl() {
    const control = this.shadowRoot.querySelector("ds-segmented-control");
    if (control) control.value = getTheme();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <ds-segmented-control></ds-segmented-control>
    `;

    const control = this.shadowRoot.querySelector("ds-segmented-control");
    control.items = [
      { value: "system", icon: "laptop", label: "" },
      { value: "light", icon: "sun", label: "" },
      { value: "dark", icon: "moon", label: "" },
    ];
    control.value = getTheme();

    control.addEventListener("ds-change", (e) => {
      setTheme(e.detail.value);
    });

    attachStyles(this.shadowRoot, css);
  }
}
if (!customElements.get("ds-theme-switch")) customElements.define("ds-theme-switch", DsThemeSwitch);
