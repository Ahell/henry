import { LitElement, html } from "lit";
import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";

export class DetailTable extends LitElement {
  static properties = {
    teachers: { type: Array },
    days: { type: Array },
    dayStatuses: { type: Array },
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
    this.dayStatuses = [];
    this.slotId = null;
    this.slotDate = "";
    this.isPainting = false;
    this.dayHeaderRenderer = null;
    this.teacherDayCellRenderer = null;
    this._headerHeights = {
      week: null,
      weekday: null,
      date: null,
    };
  }

  updated() {
    this._syncHeaderHeights();
  }

  _syncHeaderHeights() {
    const container = this.querySelector(".table-container");
    if (!container) return;

    const measure = (selector) => {
      const row = container.querySelector(selector);
      if (!row) return null;
      const rect = row.getBoundingClientRect();
      return Number.isFinite(rect.height) ? rect.height : null;
    };

    const week = measure("thead .week-row");
    const weekday = measure("thead .weekday-row");
    const date = measure("thead .date-row");

    const apply = (key, value, cssVar) => {
      if (!Number.isFinite(value) || value <= 0) return;
      const rounded = Math.round(value);
      if (this._headerHeights[key] === rounded) return;
      this._headerHeights[key] = rounded;
      container.style.setProperty(cssVar, `${rounded}px`);
    };

    apply("week", week, "--detail-week-row-height");
    apply("weekday", weekday, "--detail-weekday-row-height");
    apply("date", date, "--detail-date-row-height");
  }

  render() {
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
            endDate.setDate(endDate.getDate() - 1);
            break;
          }
        }
        if (!endDate) {
          endDate = new Date(slot.start_date);
          endDate.setDate(
            endDate.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1
          );
        }
        days = [];
        const current = new Date(slot.start_date);
        while (current <= endDate) {
          days.push(current.toISOString().split("T")[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    }
    // If days are still empty after fallback, we don't render any day columns.
    const weekSegments = computeWeekSegments(days);
    const firstColWidth = 220;
    const dayColWidth = 150;
    const gridTemplate = `${firstColWidth}px repeat(${days.length}, ${dayColWidth}px)`;
    const weekdayLabels = days.map((d) => formatWeekday(d));

    return html`
      <style>
        .table-container {
          position: relative;
          --first-col-width: ${firstColWidth}px;
          --day-col-width: ${dayColWidth}px;
          --detail-week-row-height: 28px;
          --detail-weekday-row-height: 28px;
          --detail-date-row-height: 36px;
          font-family: var(--font-family-base);
        }
        .teacher-timeline-table {
          table-layout: fixed;
          width: calc(var(--first-col-width) + ${days.length} * var(--day-col-width));
          min-width: 100%;
          border-collapse: separate; 
          border-spacing: 0;
        }
        .teacher-timeline-table th:first-child,
        .teacher-timeline-table td:first-child {
          width: var(--first-col-width);
          border-right: 1px solid var(--color-border);
        }
        .teacher-timeline-table th:first-child {
          background: var(--color-gray-lighter);
        }
        .teacher-timeline-table td:first-child {
          background: var(--color-surface);
        }
        .teacher-timeline-table th:not(:first-child),
        .teacher-timeline-table td:not(:first-child) {
          width: var(--day-col-width);
          min-width: var(--day-col-width);
          max-width: var(--day-col-width);
        }
        .teacher-timeline-table thead th {
          background: var(--color-gray-lighter);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-semibold);
          text-align: center;
          padding: var(--space-3) var(--space-4);
          border-bottom: 2px solid var(--color-border);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          position: sticky;
          top: 0;
          z-index: 4;
          box-sizing: border-box;
        }
        .teacher-timeline-table th,
        .teacher-timeline-table td {
          border-right: 1px solid var(--color-border);
        }
        .teacher-timeline-table th:last-child,
        .teacher-timeline-table td:last-child {
          border-right: none;
        }
        thead .week-row th {
          text-align: left;
          background: var(--color-white);
          color: var(--color-text-secondary);
          border-bottom: 0;
          text-transform: none;
          letter-spacing: normal;
          font-weight: var(--font-weight-medium);
          padding: var(--space-2) var(--space-4);
          top: 0;
          z-index: 6;
          height: var(--detail-week-row-height);
        }
        thead .weekday-row th {
          text-align: left;
          padding: var(--space-2) var(--space-4);
          background: var(--color-white);
          color: var(--color-text-secondary);
          border-bottom: 0;
          text-transform: none;
          letter-spacing: normal;
          font-weight: var(--font-weight-medium);
          top: var(--detail-week-row-height);
          z-index: 5;
          height: var(--detail-weekday-row-height);
        }
        thead .date-row th {
          text-align: center;
          background: var(--color-gray-lighter);
          color: var(--color-text-secondary);
          border-radius: 0 !important;
          top: calc(
            var(--detail-week-row-height) + var(--detail-weekday-row-height)
          );
          z-index: 4;
          height: var(--detail-date-row-height);
        }
        /* Ensure selected/default/alt headers do not change background */
        .teacher-timeline-table thead .date-row th.slot-header {
          background: var(--color-gray-lighter) !important;
          color: var(--color-text-secondary) !important;
          border-color: var(--color-border) !important;
        }
        /* Keep first column sticky with matching background */
        .teacher-timeline-table thead th:first-child {
          position: sticky;
          left: 0;
          z-index: 5;
          background: var(--color-gray-lighter);
          text-align: left;
        }
        .teacher-timeline-table thead .week-row th:first-child {
          z-index: 7;
        }
        .teacher-timeline-table thead .weekday-row th:first-child {
          z-index: 6;
        }
        .teacher-timeline-table thead .date-row th:first-child {
          z-index: 5;
        }
        .teacher-timeline-table thead .date-row th:first-child {
          background: var(--color-gray-lighter);
        }
        .teacher-timeline-table thead .weekday-row th:first-child,
        .teacher-timeline-table thead .week-row th:first-child {
          z-index: 5;
          background: var(--color-white);
        }
        /* Neutralize any legacy header class styling */
        .teacher-timeline-table
          thead
          th.teaching-day-default-header,
        .teacher-timeline-table
          thead
          th.teaching-day-default-dimmed-header,
        .teacher-timeline-table thead th.teaching-day-alt-header {
          background: var(--color-gray-lighter);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          box-shadow: none;
        }
        /* Status pills */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: 2px var(--space-2);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          border: 1px solid transparent;
          color: var(--color-text-primary);
          background: var(--color-gray-light);
          white-space: nowrap;
        }
        .status-pill--os {
          background: var(--color-light-blue);
          border-color: var(--color-sky-blue);
          color: var(--color-kth-blue);
        }
        .status-pill--od {
          background: var(--color-gray-light);
          border-color: var(--color-gray);
          color: var(--color-text-secondary);
        }
        .status-pill--xs {
          background: var(--color-success-bg);
          border-color: var(--color-success);
          color: var(--color-success-text);
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
              ${weekdayLabels.map((label, idx) => {
                const statusClass = (this.dayStatuses || [])[idx] || "";
                const pillClass = mapStatusToPill(statusClass);
                return html`<th>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span>${label}</span>
                    ${pillClass
                      ? html`<span class="status-pill ${pillClass}">
                          ${pillLabel(pillClass)}
                        </span>`
                      : ""}
                  </div>
                </th>`;
              })}
            </tr>
            <tr class="date-row">
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

function mapStatusToPill(statusClass) {
  if (statusClass?.includes("teaching-day-default-header")) return "status-pill--os";
  if (statusClass?.includes("teaching-day-default-dimmed-header")) return "status-pill--od";
  if (statusClass?.includes("teaching-day-alt-header")) return "status-pill--xs";
  return "";
}

function pillLabel(pillClass) {
  switch (pillClass) {
    case "status-pill--os":
      return "Ordinarie";
    case "status-pill--od":
      return "Bortvald";
    case "status-pill--xs":
      return "Extra";
    default:
      return "";
  }
}
