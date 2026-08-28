import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
  width: 100%;
}
.progress-track {
  position: relative;
  height: 0.5rem;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-full);
  background-color: var(--color-muted);
}
.progress-indicator {
  height: 100%;
  width: 0%;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
}
`;

export class DsProgress extends HTMLElement {
  static get observedAttributes() {
    return ["value", "max"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value() {
    return Number(this.getAttribute("value")) || 0;
  }
  set value(val) {
    this.setAttribute("value", String(val));
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const max = Number(this.getAttribute("max")) || 100;
    const pct = Math.min(100, Math.max(0, (this.value / max) * 100));

    this.shadowRoot.innerHTML = `
      <div data-slot="progress" class="progress-track" role="progressbar" aria-valuenow="${this.value}" aria-valuemin="0" aria-valuemax="${max}">
        <div data-slot="progress-indicator" class="progress-indicator" style="width: ${pct}%;"></div>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-progress")) customElements.define("ds-progress", DsProgress);
