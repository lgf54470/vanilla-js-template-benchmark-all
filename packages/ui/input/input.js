import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.input {
  width: 100%;
  height: 2.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-input);
  background-color: var(--color-card);
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.input::placeholder {
  color: var(--color-fg-muted);
}
.input:focus {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

export class DsInput extends HTMLElement {
  static get observedAttributes() {
    return ["type", "placeholder", "value", "disabled", "name"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value() {
    const input = this.shadowRoot.querySelector("input");
    return input ? input.value : this.getAttribute("value") || "";
  }

  set value(val) {
    const input = this.shadowRoot.querySelector("input");
    if (input) input.value = val;
    this.setAttribute("value", val);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, _oldVal, newVal) {
    const input = this.shadowRoot.querySelector("input");
    if (input && name === "value") input.value = newVal;
  }

  render() {
    const type = this.getAttribute("type") || "text";
    const placeholder = this.getAttribute("placeholder") || "";
    const value = this.getAttribute("value") || "";
    const disabled = this.hasAttribute("disabled");
    const name = this.getAttribute("name") || "";

    this.shadowRoot.innerHTML = `
      <div data-slot="input-wrapper" class="input-wrapper">
        <input
          data-slot="input"
          class="input"
          type="${type}"
          placeholder="${placeholder}"
          value="${value}"
          name="${name}"
          ${disabled ? "disabled" : ""}
        />
      </div>
    `;

    const input = this.shadowRoot.querySelector("input");
    input?.addEventListener("input", (e) => {
      this.dispatchEvent(new CustomEvent("ds-input", { detail: { value: e.target.value } }));
    });
    input?.addEventListener("change", (e) => {
      this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: e.target.value } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-input")) customElements.define("ds-input", DsInput);
