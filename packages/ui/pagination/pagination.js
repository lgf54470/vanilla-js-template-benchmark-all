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
  gap: var(--space-1);
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
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-fg);
  font-size: var(--text-sm);
  cursor: pointer;
}
.page-btn:hover {
  background-color: var(--color-muted);
}
.page-btn--active {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
  border-color: var(--color-primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
`;

export class DsPagination extends HTMLElement {
  static get observedAttributes() {
    return ["page", "total-pages"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get page() {
    return Number(this.getAttribute("page")) || 1;
  }
  set page(val) {
    this.setAttribute("page", String(val));
    this.render();
  }

  get totalPages() {
    return Number(this.getAttribute("total-pages")) || 1;
  }
  set totalPages(val) {
    this.setAttribute("total-pages", String(val));
    this.render();
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
    }>
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
    }>
              ${createIcon("chevron-right")}
            </button>
          </li>
        </ul>
      </nav>
    `;

    this.shadowRoot.querySelector("#btn-prev")?.addEventListener("click", () => {
      if (this.page > 1) {
        this.page--;
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { page: this.page } }));
      }
    });

    this.shadowRoot.querySelector("#btn-next")?.addEventListener("click", () => {
      if (this.page < this.totalPages) {
        this.page++;
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { page: this.page } }));
      }
    });

    this.shadowRoot.querySelectorAll("[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = Number(btn.getAttribute("data-page"));
        this.page = p;
        this.dispatchEvent(new CustomEvent("ds-change", { detail: { page: p } }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-pagination")) customElements.define("ds-pagination", DsPagination);
