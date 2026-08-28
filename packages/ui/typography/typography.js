import { attachStyles } from "../base.js";

const css = `
:host { display: block; }
.h1 { font-size: var(--text-3xl); font-weight: 800; letter-spacing: -0.025em; line-height: 1.25; margin-bottom: var(--space-4); }
.h2 { font-size: var(--text-2xl); font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; margin-bottom: var(--space-3); }
.h3 { font-size: var(--text-xl); font-weight: 600; letter-spacing: -0.015em; line-height: 1.35; margin-bottom: var(--space-2); }
.h4 { font-size: var(--text-lg); font-weight: 600; line-height: 1.4; margin-bottom: var(--space-2); }
.p { font-size: var(--text-base); line-height: 1.625; margin-bottom: var(--space-4); }
.lead { font-size: var(--text-lg); color: var(--color-fg-muted); }
.muted { font-size: var(--text-sm); color: var(--color-fg-muted); }
`;

export class DsTypography extends HTMLElement {
  static get observedAttributes() {
    return ["variant"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const variant = this.getAttribute("variant") || "p";
    this.shadowRoot.innerHTML = `
      <div data-slot="typography" class="${variant}">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-typography")) customElements.define("ds-typography", DsTypography);
