import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
  width: 100%;
  overflow-x: auto;
}
.table {
  width: 100%;
  caption-side: bottom;
  font-size: var(--text-sm);
  border-collapse: collapse;
}
::slotted(thead) {
  border-bottom: 1px solid var(--color-border);
}
::slotted(tr) {
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.15s ease;
}
::slotted(tr:hover) {
  background-color: var(--color-muted);
}
::slotted(th) {
  height: 2.5rem;
  padding: 0 var(--space-4);
  text-align: left;
  vertical-align: middle;
  font-weight: 500;
  color: var(--color-fg-muted);
}
::slotted(td) {
  padding: var(--space-3) var(--space-4);
  vertical-align: middle;
}
`;

export class DsTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <table data-slot="table" class="table">
        <slot></slot>
      </table>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-table")) customElements.define("ds-table", DsTable);
