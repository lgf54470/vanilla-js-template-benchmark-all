import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: var(--ds-input-radius, var(--radius-md));
  background-color: var(--ds-input-bg, var(--color-bg));
  border: var(--ds-input-border, 1px solid var(--color-border));
}
.select-wrapper:focus-within {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.select {
  width: 100%;
  height: 2.25rem;
  padding-inline: var(--space-3);
  padding-inline-end: var(--space-8);
  font-size: var(--text-sm);
  color: var(--color-fg);
  background: transparent;
  border: none;
  appearance: none;
  cursor: pointer;
}
.arrow-icon {
  position: absolute;
  inset-inline-end: var(--space-3);
  pointer-events: none;
  color: var(--color-fg-muted);
}
`;

export class DsSelect extends HTMLElement {
  static get observedAttributes() {
    return ["value", "disabled", "name"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get value() {
    const sel = this.shadowRoot.querySelector("select");
    return sel ? sel.value : this.getAttribute("value") || "";
  }

  set value(v) {
    this.setAttribute("value", v);
    const sel = this.shadowRoot.querySelector("select");
    if (sel) sel.value = v;
  }

  render() {
    const disabled = this.hasAttribute("disabled");

    this.shadowRoot.innerHTML = `
      <div class="select-wrapper">
        <select class="select" ${disabled ? "disabled" : ""} name="${
      this.getAttribute("name") || ""
    }">
          <slot></slot>
        </select>
        <span class="arrow-icon">${createIcon("chevron-down")}</span>
      </div>
    `;

    const select = this.shadowRoot.querySelector("select");
    if (this.hasAttribute("value")) {
      select.value = this.getAttribute("value");
    }

    select.addEventListener("change", (e) => {
      this.setAttribute("value", e.target.value);
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { value: e.target.value }, bubbles: true }),
      );
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-select")) customElements.define("ds-select", DsSelect);
