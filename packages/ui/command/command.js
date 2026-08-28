import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: block; width: 100%; }
.command-box {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background-color: var(--color-popover);
  color: var(--color-popover-fg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--color-border);
  height: 2.75rem;
}
.cmd-input {
  width: 100%;
  font-size: var(--text-sm);
  color: var(--color-fg);
  outline: none;
  background: transparent;
  border: none;
}
.list {
  padding: var(--space-1);
  max-height: 18rem;
  overflow-y: auto;
}
`;

export class DsCommand extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <div data-slot="command" class="command-box">
        <div data-slot="command-input-wrapper" class="input-wrap">
          <span>${createIcon("search")}</span>
          <input data-slot="command-input" class="cmd-input" placeholder="输入搜索指令..." />
        </div>
        <div data-slot="command-list" class="list">
          <slot></slot>
        </div>
      </div>
    `;

    const input = this.shadowRoot.querySelector(".cmd-input");
    input?.addEventListener("input", (e) => {
      this.dispatchEvent(new CustomEvent("ds-search", { detail: { query: e.target.value } }));
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-command")) customElements.define("ds-command", DsCommand);
