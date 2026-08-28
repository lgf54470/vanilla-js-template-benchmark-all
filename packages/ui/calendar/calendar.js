import { attachStyles, createIcon } from "../base.js";
import "../popover/popover.js";
import "../button/button.js";

const css = `
:host { display: inline-block; }
.calendar {
  padding: var(--space-3);
  background-color: var(--color-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.month-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-fg);
}
.grid {
  display: grid;
  grid-template-columns: repeat(7, 2rem);
  gap: 0.25rem;
  text-align: center;
}
.day-header {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
  font-weight: 500;
  padding-bottom: var(--space-1);
}
.day-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--color-fg);
}
.day-btn:hover {
  background-color: var(--color-muted);
}
.day-btn--selected {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
  font-weight: 600;
}
`;

export class DsCalendar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentDate = new Date();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    this.shadowRoot.innerHTML = `
      <div data-slot="calendar" class="calendar">
        <div class="header">
          <button type="button" class="day-btn" id="prev-m">${createIcon("chevron-left")}</button>
          <span class="month-title">${year}年 ${month + 1}月</span>
          <button type="button" class="day-btn" id="next-m">${createIcon("chevron-right")}</button>
        </div>
        <div class="grid">
          <span class="day-header">日</span>
          <span class="day-header">一</span>
          <span class="day-header">二</span>
          <span class="day-header">三</span>
          <span class="day-header">四</span>
          <span class="day-header">五</span>
          <span class="day-header">六</span>
          ${
      days.map((d) => `<button type="button" class="day-btn" data-day="${d}">${d}</button>`).join(
        "",
      )
    }
        </div>
      </div>
    `;

    this.shadowRoot.querySelector("#prev-m")?.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });
    this.shadowRoot.querySelector("#next-m")?.addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    this.shadowRoot.querySelectorAll("[data-day]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const d = btn.getAttribute("data-day");
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${
          String(d).padStart(2, "0")
        }`;
        this.dispatchEvent(new CustomEvent("ds-select", { detail: { date: dateStr } }));
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-calendar")) customElements.define("ds-calendar", DsCalendar);
