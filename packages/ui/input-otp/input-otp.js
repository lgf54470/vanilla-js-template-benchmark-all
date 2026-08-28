import { attachStyles } from "../base.js";

const css = `
:host { display: inline-flex; }
.otp-group {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.otp-slot {
  width: 2.5rem;
  height: 2.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-input);
  background-color: var(--color-card);
  text-align: center;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-fg);
  outline: none;
}
.otp-slot:focus {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
}
`;

export class DsInputOtp extends HTMLElement {
  static get observedAttributes() {
    return ["length"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const len = Number(this.getAttribute("length")) || 6;
    const slots = [];
    for (let i = 0; i < len; i++) {
      slots.push(
        `<input data-slot="input-otp-slot" class="otp-slot" maxlength="1" data-index="${i}" type="text" inputmode="numeric" />`,
      );
    }

    this.shadowRoot.innerHTML = `
      <div data-slot="input-otp" class="otp-group">
        ${slots.join("")}
      </div>
    `;

    const inputs = this.shadowRoot.querySelectorAll(".otp-slot");
    inputs.forEach((inp, idx) => {
      inp.addEventListener("input", (e) => {
        if (e.target.value && idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        }
        const fullVal = Array.from(inputs).map((i) => i.value).join("");
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { value: fullVal } }));
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && idx > 0) {
          inputs[idx - 1].focus();
        }
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-input-otp")) customElements.define("ds-input-otp", DsInputOtp);
