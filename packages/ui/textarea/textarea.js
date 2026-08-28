import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
}
.textarea {
  width: 100%;
  min-height: 5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-input);
  background-color: var(--color-card);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
}
.textarea::placeholder {
  color: var(--color-fg-muted);
}
.textarea:focus {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

export class DsTextarea extends HTMLElement {
  static get observedAttributes() {
    return ["placeholder", "value", "disabled", "rows"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value() {
    const el = this.shadowRoot.querySelector("textarea");
    return el ? el.value : this.getAttribute("value") || "";
  }

  set value(val) {
    const el = this.shadowRoot.querySelector("textarea");
    if (el) el.value = val;
    this.setAttribute("value", val);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const placeholder = this.getAttribute("placeholder") || "";
    const value = this.getAttribute("value") || "";
    const disabled = this.hasAttribute("disabled");
    const rows = this.getAttribute("rows") || "3";

    this.shadowRoot.innerHTML = `
      <textarea
        data-slot="textarea"
        class="textarea"
        rows="${rows}"
        placeholder="${placeholder}"
        ${disabled ? "disabled" : ""}
      >${value}</textarea>
    `;

    const textarea = this.shadowRoot.querySelector("textarea");
    textarea?.addEventListener("input", (e) => {
      this.dispatchEvent(new CustomEvent("ds-input", { detail: { value: e.target.value } }));
    });
    textarea?.addEventListener("change", (e) => {
      this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: e.target.value } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-textarea")) customElements.define("ds-textarea", DsTextarea);
