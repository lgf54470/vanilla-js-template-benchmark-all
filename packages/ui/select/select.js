import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.select-wrapper {
  position: relative;
  width: 100%;
}
.select {
  width: 100%;
  height: 2.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-input);
  background-color: var(--color-card);
  padding: 0 var(--space-8) 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;
}
.select:focus {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.chevron {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
}
`;

export class DsSelect extends HTMLElement {
  static get observedAttributes() {
    return ["value", "disabled"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value() {
    const sel = this.shadowRoot.querySelector("select");
    return sel ? sel.value : this.getAttribute("value") || "";
  }

  set value(val) {
    const sel = this.shadowRoot.querySelector("select");
    if (sel) sel.value = val;
    this.setAttribute("value", val);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const disabled = this.hasAttribute("disabled");

    this.shadowRoot.innerHTML = `
      <div data-slot="select-wrapper" class="select-wrapper">
        <select data-slot="select" class="select" ${disabled ? "disabled" : ""}>
          <slot></slot>
        </select>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    `;

    const sel = this.shadowRoot.querySelector("select");
    sel?.addEventListener("change", (e) => {
      this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: e.target.value } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-select")) customElements.define("ds-select", DsSelect);
