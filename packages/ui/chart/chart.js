import { attachStyles } from "../base.js";

const css = `
:host { display: block; width: 100%; height: 100%; min-height: 12rem; }
.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}
`;

export class DsChart extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="chart" class="chart-container">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-chart")) customElements.define("ds-chart", DsChart);
