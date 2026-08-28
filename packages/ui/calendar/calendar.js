import { attachStyles, createIcon } from "../base.js";

const css = `
:host { display: inline-block; }
.calendar {
  padding: 0.5rem;
  background-color: var(--color-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-sizing: border-box;
  user-select: none;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.month-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg);
}
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1.75rem);
  gap: 2px;
  text-align: center;
}
.day-header {
  font-size: var(--text-2xs);
  color: var(--color-fg-muted);
  font-weight: 500;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.day-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 400;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-fg);
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: background-color 0.15s ease;
}
.day-btn:hover:not(.day-btn--selected) {
  background-color: var(--color-muted);
}
.day-btn:focus-visible {
  border-color: var(--ring);
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}
.day-btn--selected {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
  font-weight: 500;
}
.nav-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}
.nav-btn:hover {
  background-color: var(--color-muted);
  color: var(--color-fg);
}
`;

export class DsCalendar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentDate = new Date();
    this.selectedDateStr = "";
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array.from({ length: firstDayOfWeek });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    this.shadowRoot.innerHTML = `
      <div data-slot="calendar" class="calendar">
        <div class="header">
          <button type="button" class="nav-btn" id="prev-m" aria-label="上个月">${
      createIcon("chevron-left")
    }</button>
          <span class="month-title">${year}年 ${month + 1}月</span>
          <button type="button" class="nav-btn" id="next-m" aria-label="下个月">${
      createIcon("chevron-right")
    }</button>
        </div>
        <div class="grid">
          <span class="day-header">日</span>
          <span class="day-header">一</span>
          <span class="day-header">二</span>
          <span class="day-header">三</span>
          <span class="day-header">四</span>
          <span class="day-header">五</span>
          <span class="day-header">六</span>
          ${blanks.map(() => `<span></span>`).join("")}
          ${
      days.map((d) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${
          String(d).padStart(2, "0")
        }`;
        const isSel = dateStr === this.selectedDateStr;
        return `<button type="button" class="day-btn ${
          isSel ? "day-btn--selected" : ""
        }" data-day="${d}" data-date="${dateStr}">${d}</button>`;
      }).join("")
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

    this.shadowRoot.querySelectorAll("[data-date]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dateStr = btn.getAttribute("data-date");
        this.selectedDateStr = dateStr;
        this.render();
        this.dispatchEvent(
          new CustomEvent("ds-select", { detail: { date: dateStr }, bubbles: true }),
        );
      });
    });

    attachStyles(this.shadowRoot, css);
  }
}

if (!customElements.get("ds-calendar")) customElements.define("ds-calendar", DsCalendar);
