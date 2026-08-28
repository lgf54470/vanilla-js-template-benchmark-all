import { attachStyles } from "../base.js";

const css = `
:host {
  display: inline-flex;
  vertical-align: middle;
}
.button-group {
  display: inline-flex;
  align-items: stretch;
  width: fit-content;
  box-sizing: border-box;
}
.orientation-horizontal {
  flex-direction: row;
}
.orientation-vertical {
  flex-direction: column;
}

/* Seamless item collapse and focus z-index elevation */
::slotted(*) {
  position: relative;
}
::slotted(*:hover) {
  z-index: 5;
}
::slotted(*:focus-within), ::slotted(*:focus), ::slotted(*:focus-visible) {
  z-index: 10;
}

/* Horizontal border collapsing and rounding */
.orientation-horizontal ::slotted(*:not(:first-child)) {
  margin-left: -1px;
}
.orientation-horizontal ::slotted(:first-child) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
.orientation-horizontal ::slotted(:last-child) {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
.orientation-horizontal ::slotted(:not(:first-child):not(:last-child)) {
  border-radius: 0 !important;
}

/* Vertical border collapsing and rounding */
.orientation-vertical ::slotted(*:not(:first-child)) {
  margin-top: -1px;
}
.orientation-vertical ::slotted(:first-child) {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
.orientation-vertical ::slotted(:last-child) {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
.orientation-vertical ::slotted(:not(:first-child):not(:last-child)) {
  border-radius: 0 !important;
}

/* Single child case */
.orientation-horizontal ::slotted(:only-child),
.orientation-vertical ::slotted(:only-child) {
  border-radius: var(--radius-lg) !important;
  margin: 0 !important;
}
`;

export class DsButtonGroup extends HTMLElement {
  static get observedAttributes() {
    return ["orientation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get orientation() {
    return this.getAttribute("orientation") || "horizontal";
  }

  set orientation(val) {
    this.setAttribute("orientation", val);
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const orientation = this.orientation;
    this.shadowRoot.innerHTML = `
      <div data-slot="button-group" class="button-group orientation-${orientation}" role="group" data-orientation="${orientation}">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

const textCss = `
:host {
  display: inline-flex;
}
.btn-group-text {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 2rem;
  padding: 0 0.625rem;
  background-color: var(--color-muted);
  color: var(--color-fg);
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: var(--radius-lg);
  box-sizing: border-box;
  user-select: none;
  white-space: nowrap;
}
`;

export class DsButtonGroupText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="button-group-text" class="btn-group-text">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, textCss);
  }
}

const separatorCss = `
:host {
  display: inline-flex;
  align-self: stretch;
}
.btn-group-separator {
  background-color: var(--color-border);
  box-sizing: border-box;
}
.orientation-vertical {
  width: 1px;
  height: 100%;
  margin: 0 1px;
}
.orientation-horizontal {
  height: 1px;
  width: 100%;
  margin: 1px 0;
}
`;

export class DsButtonGroupSeparator extends HTMLElement {
  static get observedAttributes() {
    return ["orientation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const orientation = this.getAttribute("orientation") || "vertical";
    this.shadowRoot.innerHTML = `
      <div data-slot="button-group-separator" class="btn-group-separator orientation-${orientation}"></div>
    `;
    attachStyles(this.shadowRoot, separatorCss);
  }
}

if (!customElements.get("ds-button-group")) customElements.define("ds-button-group", DsButtonGroup);
if (!customElements.get("ds-button-group-text")) {
  customElements.define("ds-button-group-text", DsButtonGroupText);
}
if (!customElements.get("ds-button-group-separator")) {
  customElements.define("ds-button-group-separator", DsButtonGroupSeparator);
}
