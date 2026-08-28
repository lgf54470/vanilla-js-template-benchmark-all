import { attachStyles, createIcon } from "../base.js";

const css = `
:host {
  display: flex;
  justify-content: center;
  width: 100%;
}
.pagination-list {
  display: flex;
  align-items: center;
  gap: 2px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background-color: transparent;
  color: var(--color-fg-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.page-btn:hover:not(:disabled):not(.page-btn--active) {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
.page-btn:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.page-btn--active {
  background-color: var(--color-card);
  color: var(--color-fg);
  border-color: var(--color-input);
  font-weight: 600;
}
.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
`;

export class DsPagination extends HTMLElement {
  static get observedAttributes() {
    return ["page", "total-pages", "total", "page-size", "current"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get page() {
    return Number(this.getAttribute("current") || this.getAttribute("page")) || 1;
  }
  set page(val) {
    this.setAttribute("current", String(val));
    this.setAttribute("page", String(val));
    this.render();
  }

  get totalPages() {
    if (this.hasAttribute("total-pages")) {
      return Number(this.getAttribute("total-pages")) || 1;
    }
    const total = Number(this.getAttribute("total")) || 10;
    const size = Number(this.getAttribute("page-size")) || 10;
    return Math.max(1, Math.ceil(total / size));
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const cur = this.page;
    const total = this.totalPages;

    const pages = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }

    this.shadowRoot.innerHTML = `
      <nav data-slot="pagination" aria-label="pagination">
        <ul data-slot="pagination-list" class="pagination-list">
          <li>
            <button data-slot="pagination-prev" class="page-btn" id="btn-prev" ${
      cur <= 1 ? "disabled" : ""
    } aria-label="上一页">
              ${createIcon("chevron-left")}
            </button>
          </li>
          ${
      pages.map((p) => `
            <li>
              <button data-slot="pagination-link" class="page-btn ${
        p === cur ? "page-btn--active" : ""
      }" data-page="${p}">
                ${p}
              </button>
            </li>
          `).join("")
    }
          <li>
            <button data-slot="pagination-next" class="page-btn" id="btn-next" ${
      cur >= total ? "disabled" : ""
    } aria-label="下一页">
              ${createIcon("chevron-right")}
            </button>
          </li>
        </ul>
      </nav>
    `;

    this.shadowRoot.querySelector("#btn-prev")?.addEventListener("click", () => {
      if (this.page > 1) {
        this.page--;
        this.dispatchEvent(
          new CustomEvent("ds-page-change", { detail: { page: this.page }, bubbles: true }),
        );
      }
    });

    this.shadowRoot.querySelector("#btn-next")?.addEventListener("click", () => {
      if (this.page < this.totalPages) {
        this.page++;
        this.dispatchEvent(
          new CustomEvent("ds-page-change", { detail: { page: this.page }, bubbles: true }),
        );
      }
    });

    this.shadowRoot.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = Number(btn.getAttribute("data-page"));
        this.page = p;
        this.dispatchEvent(
          new CustomEvent("ds-page-change", { detail: { page: p }, bubbles: true }),
        );
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-pagination")) customElements.define("ds-pagination", DsPagination);
