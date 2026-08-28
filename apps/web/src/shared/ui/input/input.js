import { attachStyles, createIcon } from "../base.js";

const inputCss = `
:host { display: block; width: 100%; }
.input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  border-radius: var(--ds-input-radius, var(--radius-md));
  background-color: var(--ds-input-bg, var(--color-bg));
  border: var(--ds-input-border, 1px solid var(--color-border));
}
.input-wrapper:focus-within {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.input-wrapper--disabled {
  opacity: 0.5;
  pointer-events: none;
}
.input {
  width: 100%;
  height: 2.25rem;
  padding-inline: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg);
  background: transparent;
  border: none;
  outline: none;
}
.input::placeholder {
  color: var(--color-fg-muted);
}
.prefix-icon, .suffix-icon {
  display: flex;
  align-items: center;
  padding-inline: var(--space-2);
  color: var(--color-fg-muted);
}
`;

export class DsInput extends HTMLElement {
  static get observedAttributes() {
    return ["value", "placeholder", "type", "disabled", "icon", "name", "required", "autocomplete"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal !== newVal) this.render();
  }

  get value() {
    const input = this.shadowRoot.querySelector("input");
    return input ? input.value : this.getAttribute("value") || "";
  }

  set value(v) {
    this.setAttribute("value", v);
    const input = this.shadowRoot.querySelector("input");
    if (input) input.value = v;
  }

  render() {
    const icon = this.getAttribute("icon");
    const disabled = this.hasAttribute("disabled");
    const val = this.getAttribute("value") || "";

    this.shadowRoot.innerHTML = `
      <div class="input-wrapper ${disabled ? "input-wrapper--disabled" : ""}">
        ${icon ? `<span class="prefix-icon">${createIcon(icon)}</span>` : ""}
        <input class="input"
          type="${this.getAttribute("type") || "text"}"
          placeholder="${this.getAttribute("placeholder") || ""}"
          name="${this.getAttribute("name") || ""}"
          value="${val}"
          ${disabled ? "disabled" : ""}
          ${this.hasAttribute("required") ? "required" : ""}
          ${
      this.hasAttribute("autocomplete") ? `autocomplete="${this.getAttribute("autocomplete")}"` : ""
    }
        />
        <slot name="suffix"></slot>
      </div>
    `;

    const input = this.shadowRoot.querySelector("input");
    input.addEventListener("input", (e) => {
      this.setAttribute("value", e.target.value);
      this.dispatchEvent(
        new CustomEvent("ds-input", { detail: { value: e.target.value }, bubbles: true }),
      );
    });
    input.addEventListener("change", (e) => {
      this.dispatchEvent(
        new CustomEvent("ds-change", { detail: { value: e.target.value }, bubbles: true }),
      );
    });

    attachStyles(this.shadowRoot, inputCss);
  }
}

const textareaCss = `
:host { display: block; width: 100%; }
.textarea {
  width: 100%;
  min-height: 5rem;
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg);
  background-color: var(--ds-input-bg, var(--color-bg));
  border-radius: var(--ds-input-radius, var(--radius-md));
  border: var(--ds-input-border, 1px solid var(--color-border));
  outline: none;
  resize: vertical;
}
.textarea:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.textarea:disabled {
  opacity: 0.5;
  pointer-events: none;
}
`;

export class DsTextarea extends HTMLElement {
  static get observedAttributes() {
    return ["value", "placeholder", "disabled", "rows", "name"];
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
    const el = this.shadowRoot.querySelector("textarea");
    return el ? el.value : this.getAttribute("value") || "";
  }

  set value(v) {
    this.setAttribute("value", v);
    const el = this.shadowRoot.querySelector("textarea");
    if (el) el.value = v;
  }

  render() {
    const disabled = this.hasAttribute("disabled");
    const val = this.getAttribute("value") || "";

    this.shadowRoot.innerHTML = `
      <textarea class="textarea"
        placeholder="${this.getAttribute("placeholder") || ""}"
        rows="${this.getAttribute("rows") || "3"}"
        name="${this.getAttribute("name") || ""}"
        ${disabled ? "disabled" : ""}
      >${val}</textarea>
    `;

    const el = this.shadowRoot.querySelector("textarea");
    el.addEventListener("input", (e) => {
      this.setAttribute("value", e.target.value);
      this.dispatchEvent(
        new CustomEvent("ds-input", { detail: { value: e.target.value }, bubbles: true }),
      );
    });

    attachStyles(this.shadowRoot, textareaCss);
  }
}

if (!customElements.get("ds-input")) customElements.define("ds-input", DsInput);
if (!customElements.get("ds-textarea")) customElements.define("ds-textarea", DsTextarea);
