import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.wrap {
  position: relative;
  width: 100%;
}
.native-select {
  width: 100%;
  height: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-input);
  background-color: transparent;
  padding: 0 2rem 0 0.625rem;
  font-size: var(--text-sm);
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.native-select:hover {
  border-color: var(--color-fg-muted);
}
.native-select:focus-visible, .native-select:focus {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.icon {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
  pointer-events: none;
}
`;

export class DsNativeSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div class="wrap">
        <select data-slot="native-select" class="native-select">
          <slot></slot>
        </select>
        <span class="icon">${createIcon("chevron-down")}</span>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-native-select")) {
  customElements.define("ds-native-select", DsNativeSelect);
}
