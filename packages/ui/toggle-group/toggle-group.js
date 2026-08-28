import { attachStyles } from "../base.js";
import "../toggle/toggle.js";

const css = `
:host { display: inline-block; }
.toggle-group {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.orientation-vertical {
  flex-direction: column;
}
.spacing-0 {
  gap: 0;
}
.spacing-0 ::slotted(ds-toggle:first-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.spacing-0 ::slotted(ds-toggle:last-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
}
.spacing-0 ::slotted(ds-toggle:not(:first-child):not(:last-child)) {
  border-radius: 0;
  margin-left: -1px;
}
`;

export class DsToggleGroup extends HTMLElement {
  static get observedAttributes() {
    return ["type", "orientation", "value", "variant", "size", "spacing"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._handleToggleChange = this._handleToggleChange.bind(this);
  }

  get type() {
    return this.getAttribute("type") || "single";
  }

  connectedCallback() {
    this.render();
    this.addEventListener("ds-change", this._handleToggleChange);
  }

  disconnectedCallback() {
    this.removeEventListener("ds-change", this._handleToggleChange);
  }

  _handleToggleChange(e) {
    if (this.type === "single") {
      const target = e.target;
      if (target.pressed) {
        const toggles = this.querySelectorAll("ds-toggle");
        toggles.forEach((t) => {
          if (t !== target) t.pressed = false;
        });
        this.setAttribute("value", target.value || "");
      }
    }
  }

  render() {
    const orientation = this.getAttribute("orientation") || "horizontal";
    const spacing = this.getAttribute("spacing") || "1";
    this.shadowRoot.innerHTML = `
      <div data-slot="toggle-group" class="toggle-group orientation-${orientation} spacing-${spacing}" role="group">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-toggle-group")) customElements.define("ds-toggle-group", DsToggleGroup);
