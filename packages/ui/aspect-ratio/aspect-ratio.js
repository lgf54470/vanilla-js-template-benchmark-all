import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; position: relative; }
.ratio-box {
  width: 100%;
  position: relative;
}
::slotted(*) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
`;

export class DsAspectRatio extends HTMLElement {
  static get observedAttributes() {
    return ["ratio"];
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

  render() {
    const ratio = Number(this.getAttribute("ratio")) || (16 / 9);
    const pb = `${(1 / ratio) * 100}%`;

    this.shadowRoot.innerHTML = `
      <div data-slot="aspect-ratio" class="ratio-box" style="padding-bottom: ${pb};">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-aspect-ratio")) customElements.define("ds-aspect-ratio", DsAspectRatio);
