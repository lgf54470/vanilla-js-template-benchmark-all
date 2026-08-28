import { attachStyles } from "../base.js";

const css = `
:host {
  display: block;
  width: 100%;
  overflow-x: auto;
}
.table-container {
  width: 100%;
  overflow-x: auto;
}
table, ::slotted(table) {
  width: 100%;
  caption-side: bottom;
  font-size: var(--text-sm);
  border-collapse: collapse;
  text-align: left;
}
::slotted(thead) {
  border-bottom: 1px solid var(--color-border);
}
::slotted(tbody tr) {
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.15s ease;
}
::slotted(tbody tr:hover) {
  background-color: var(--color-muted);
}
::slotted(th) {
  height: 2.5rem;
  padding: 0.5rem;
  text-align: left;
  vertical-align: middle;
  font-weight: 500;
  color: var(--color-fg);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
::slotted(td) {
  padding: 0.5rem;
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
`;

export class DsTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="table-container" class="table-container">
        <slot></slot>
      </div>
    `;
    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-table")) customElements.define("ds-table", DsTable);
