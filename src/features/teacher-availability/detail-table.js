import { LitElement, html } from "lit";
import { store } from "../../utils/store.js";

export class DetailTable extends LitElement {
  static properties = {
    teachers: { type: Array },
    days: { type: Array },
    slotId: { type: Number },
    slotDate: { type: String },
    isPainting: { type: Boolean },
    dayHeaderRenderer: { type: Object },
    teacherDayCellRenderer: { type: Object },
  };

  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    this.teachers = [];
    this.days = [];
    this.slotId = null;
    this.slotDate = "";
    this.isPainting = false;
    this.dayHeaderRenderer = null;
    this.teacherDayCellRenderer = null;
  }

  render() {
    console.log("Days for detail table:", this.days);
    let days =
      this.days && this.days.length
        ? this.days
        : store.getSlotDays(this.slotId || this.slotDate);
    // Robust fallback: if store didn't compute days (maybe slot date mismatched), compute days from store.slots directly
    if ((!days || days.length === 0) && store && Array.isArray(store.slots)) {
      const slotIdOrDate = this.slotId || this.slotDate;
      const isNumeric = slotIdOrDate != null && !isNaN(Number(slotIdOrDate));
      const normalizedDate = slotIdOrDate
        ? String(slotIdOrDate).split("T")[0]
        : null;
      const slot = isNumeric
        ? store.slots.find((s) => s.slot_id == Number(slotIdOrDate))
        : store.slots.find(
            (s) => (s.start_date || "").split("T")[0] === normalizedDate
          );
      if (slot) {
        const allSlots = store.slots
          .slice()
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        const idx = allSlots.findIndex((s) => s.slot_id === slot.slot_id);
        let endDate = null;
        for (let i = idx + 1; i < allSlots.length; i++) {
          const candidate = new Date(allSlots[i].start_date).getTime();
          const cur = new Date(slot.start_date).getTime();
          if (candidate > cur) {
            endDate = new Date(allSlots[i].start_date);
            break;
          }
        }
        if (!endDate) {
          endDate = new Date(slot.start_date);
          endDate.setDate(endDate.getDate() + 28);
        }
        days = [];
        const current = new Date(slot.start_date);
        while (current < endDate) {
          days.push(current.toISOString().split("T")[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    }
    // If days are still empty after fallback, we don't render any day columns.
    const weekSegments = computeWeekSegments(days);
    const firstColWidth = 220;
    const dayColWidth = 120;
    const gridTemplate = `${firstColWidth}px repeat(${days.length}, ${dayColWidth}px)`;
    const weekdayLabels = days.map((d) => formatWeekday(d));

    return html`
      <style>
        .table-container {
          position: relative;
          --first-col-width: ${firstColWidth}px;
          --day-col-width: ${dayColWidth}px;
        }
        .teacher-timeline-table {
          table-layout: fixed;
          width: calc(var(--first-col-width) + ${days.length} * var(--day-col-width));
          min-width: 100%;
        }
        .teacher-timeline-table th:first-child,
        .teacher-timeline-table td:first-child {
          width: var(--first-col-width);
        }
        .teacher-timeline-table th:not(:first-child),
        .teacher-timeline-table td:not(:first-child) {
          width: var(--day-col-width);
        }
        thead .week-row th {
          background: var(--color-surface-muted, #f8fafc);
          color: var(--color-primary-700, #4338ca);
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          padding: 8px;
        }
        thead .weekday-row th {
          background: var(--color-surface, #ffffff);
          color: var(--color-text-secondary, #64748b);
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 6px 8px;
        }
        /* Override sticky first-column background so weekday-row first cell stays white */
        .teacher-timeline-table thead th:first-child {
          background: var(--color-surface, #ffffff);
          position: static;
          left: auto;
          z-index: 1;
        }
        /* Week-row first cell should match the week-row background */
        .teacher-timeline-table thead .week-row th:first-child {
          background: var(--color-surface-muted, #f8fafc);
          position: sticky;
          left: 0;
          z-index: 5;
        }
        /* Weekday-row first cell matches weekday row */
        .teacher-timeline-table thead .weekday-row th:first-child {
          background: var(--color-surface, #ffffff);
          position: sticky;
          left: 0;
          z-index: 4;
        }
      </style>
      <div class="table-container ${this.isPainting ? "painting-active" : ""}">
        <table class="teacher-timeline-table">
          <colgroup>
            <col style="width: ${firstColWidth}px" />
            ${days.map(
              () => html`<col style="width: ${dayColWidth}px" />`
            )}
          </colgroup>
          <thead>
            <tr class="week-row">
              <th></th>
              ${weekSegments.map(
                (seg) =>
                  html`<th colspan=${seg.length} style="text-align: left;">
                    v${seg.week}
                  </th>`
              )}
            </tr>
            <tr class="weekday-row">
              <th></th>
              ${weekdayLabels.map((label) => html`<th>${label}</th>`)}
            </tr>
            <tr>
              <th>Lärare</th>
              ${days.map((day) =>
                this.dayHeaderRenderer
                  ? this.dayHeaderRenderer(day)
                  : html`<th>${day}</th>`
              )}
            </tr>
          </thead>
          <tbody>
            ${this.teachers.map(
              (teacher) => html`
                <tr>
                  ${renderTeacherInfoCell(teacher)}
                  ${days.map((d) =>
                    this.teacherDayCellRenderer
                      ? this.teacherDayCellRenderer(teacher, d)
                      : html`<td></td>`
                  )}
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}

const renderTeacherInfoCell = (teacher) => html`
  <td>
    <span class="teacher-name">${teacher?.name ?? ""}</span>
    <span class="teacher-department">${teacher?.home_department ?? ""}</span>
  </td>
`;

customElements.define("detail-table", DetailTable);

function computeWeekSegments(days) {
  const segments = [];
  let currentWeek = null;
  let startIdx = 0;
  const getISOWeek = (dateStr) => {
    const date = new Date(dateStr);
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  };
  days.forEach((d, idx) => {
    const week = getISOWeek(d);
    if (week !== currentWeek) {
      if (currentWeek !== null) {
        segments.push({ week: currentWeek, start: startIdx, length: idx - startIdx });
      }
      currentWeek = week;
      startIdx = idx;
    }
    if (idx === days.length - 1) {
      segments.push({ week: currentWeek, start: startIdx, length: idx - startIdx + 1 });
    }
  });
  return segments;
}

function formatWeekday(dateStr) {
  const name = new Date(dateStr)
    .toLocaleDateString("sv-SE", { weekday: "long" })
    .replace(".", "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}
