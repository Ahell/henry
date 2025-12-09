import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "./button.js";
import { renderDateHeader } from "./date-header.js";
import "./detail-view-header.js";
import "./teacher-cell.js";
import { renderDayHeader } from "./day-header.js";
import { renderTeacherRow } from "./teacher-row.js";
import "./overview-table.js";
import "./detail-table.js";
import {
  hasBusySlotEntry,
  findBusySlotEntry,
  removeBusySlotEntry,
  convertSlotEntryToDayEntries,
  isDayUnavailableConsideringSlot,
  teacherHasSlotEntry,
  findTeacherSlotEntry,
  convertSlotEntryToDayEntriesAndRemove,
  toggleDayAvailability,
  isDayUnavailable,
  toggleSlotAvailability,
} from "../../utils/teacherAvailabilityHelpers.js";

/**
 * Decide presentation for a day header in the detail view.
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{slotId:number, dateStr:string, isEditingExamDate:boolean, store:object}} options
 * @returns {{className:string,title:string,clickMode:('toggleTeachingDay'|'setExamDate'|null)}}
 */
export function getDetailDayHeaderPresentation({
  slotId,
  dateStr,
  isEditingExamDate,
  store,
}) {
  const state = store.getTeachingDayState(slotId, dateStr);
  const isExamDate = store.isExamDate(slotId, dateStr);
  const isExamDateLocked = store.isExamDateLocked(slotId);

  // Defaults
  let className = "";
  let title = "Klicka för att markera som undervisningsdag";
  let clickMode = "toggleTeachingDay";

  if (isExamDate) {
    if (isExamDateLocked) {
      className = "exam-date-locked-header";
      title =
        "Tentamensdatum (låst - tryck 'Ändra tentamensdatum' för att ändra)";
      clickMode = null;
    } else if (isEditingExamDate) {
      className = "exam-date-unlocked-header";
      title = "Nuvarande tentamensdatum (klicka för att byta)";
      clickMode = "setExamDate";
    } else {
      className = "exam-date-unlocked-header";
      title = "Tentamensdatum (olåst)";
      clickMode = null;
    }
  } else if (isEditingExamDate) {
    className = "exam-date-new-header";
    title = "Klicka för att sätta som tentamensdatum";
    clickMode = "setExamDate";
  } else if (state) {
    if (state.isDefault && state.active) {
      className = "teaching-day-default-header";
      title = "Standarddag (klicka för att inaktivera)";
    } else if (state.isDefault && !state.active) {
      className = "teaching-day-default-dimmed-header";
      title = "Inaktiverad standarddag (klicka för att aktivera)";
    } else if (!state.isDefault && state.active) {
      className = "teaching-day-alt-header";
      title = "Alternativ undervisningsdag (klicka för att ta bort)";
    }
  }

  return { className, title, clickMode };
}

/**
 * Decide presentation for a day cell in the detail view.
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{slotId:number, dateStr:string, teacherId:number, isEditingExamDate:boolean, store:object}} options
 * @returns {{className:string,title:string}}
 */
export function getDetailDayCellPresentation({
  slotId,
  slotDate,
  dateStr,
  teacherId,
  isEditingExamDate,
  store,
}) {
  const isUnavailable = isDayUnavailableConsideringSlot(
    teacherId,
    dateStr,
    slotId,
    slotDate
  );

  // NOTE: the helper `isDayUnavailableConsideringSlot` imported earlier already queries store internally

  let className = "";
  let title = dateStr;

  const state = store.getTeachingDayState(slotId, dateStr);
  const isExamDate = store.isExamDate(slotId, dateStr);
  const isExamDateLocked = store.isExamDateLocked(slotId);

  if (isExamDate) {
    if (isExamDateLocked) {
      className = "exam-date-locked";
      title += " (Tentamensdatum - låst)";
    } else if (isEditingExamDate) {
      className = "exam-date-unlocked";
      title += " (Tentamensdatum - olåst)";
    } else {
      className = "exam-date-unlocked";
      title += " (Tentamensdatum - olåst)";
    }
  } else if (isEditingExamDate) {
    className = "exam-date-new";
    title += " (Kan väljas som tentamensdatum)";
  } else if (state) {
    if (state.isDefault && state.active) {
      className = "teaching-day-default";
      title += " (Standarddag)";
    } else if (state.isDefault && !state.active) {
      className = "teaching-day-default-dimmed";
      title += " (Inaktiverad standarddag)";
    } else if (!state.isDefault && state.active) {
      className = "teaching-day-alt";
      title += " (Alternativ undervisningsdag)";
    }
  }

  if (isUnavailable) {
    className += (className ? " " : "") + "unavailable";
    title = `Upptagen ${dateStr}` + (isExamDate ? " (Tentamensdatum)" : "");
  }

  return { className, title };
}

/**
 * Decide presentation for an overview cell (slot-level view).
 * Pure function: queries `store` but does NOT mutate state.
 * @param {{teacher:object, slot:object, slotDate:string, store:object}} options
 * @returns {{className:string,title:string,content:string,isLocked:boolean}}
 */
export function getOverviewCellPresentation({
  teacher,
  slot,
  slotDate,
  store,
}) {
  const compatibleCourseIds = teacher.compatible_courses || [];
  const courseRuns = store.getCourseRuns();

  const compatibleRuns = courseRuns.filter(
    (r) =>
      r.slot_id === slot.slot_id && compatibleCourseIds.includes(r.course_id)
  );

  const assignedRuns = courseRuns.filter(
    (r) =>
      r.slot_id === slot.slot_id &&
      r.teachers &&
      r.teachers.includes(teacher.teacher_id)
  );

  const isAssigned = assignedRuns.length > 0;
  const isUnavailable = store.isTeacherUnavailable(
    teacher.teacher_id,
    slotDate,
    slot.slot_id
  );

  const unavailablePercentage = store.getTeacherUnavailablePercentageForSlot(
    teacher.teacher_id,
    slotDate,
    slot.slot_id
  );
  const isPartiallyUnavailable =
    unavailablePercentage > 0 && unavailablePercentage < 1;

  let className = "";
  let content = "";
  let title = "";
  let isLocked = false;

  if (isPartiallyUnavailable) {
    className += " locked";
    isLocked = true;
  }

  if (isAssigned) {
    className += (className ? " " : "") + "assigned-course";
    const courseCodes = assignedRuns
      .map((run) => store.getCourse(run.course_id)?.code)
      .filter(Boolean);
    content = courseCodes.join(", ");
    title =
      "Tilldelad: " +
      assignedRuns
        .map((run) => store.getCourse(run.course_id)?.name)
        .filter(Boolean)
        .join(", ");
  } else if (compatibleRuns.length > 0) {
    className += (className ? " " : "") + "has-course";
    const courseCodes = compatibleRuns
      .map((run) => store.getCourse(run.course_id)?.code)
      .filter(Boolean);
    content = courseCodes.join(", ");
    title = compatibleRuns
      .map((run) => store.getCourse(run.course_id)?.name)
      .filter(Boolean)
      .join(", ");
  }

  if (isUnavailable && !isAssigned) {
    className += (className ? " " : "") + "unavailable";
    title += title ? " (Upptagen)" : "Upptagen";
  } else if (isPartiallyUnavailable && !isAssigned) {
    className += (className ? " " : "") + "partially-unavailable";
    const percentage = Math.round(unavailablePercentage * 100);
    title += title ? ` (${percentage}% upptagen)` : `${percentage}% upptagen`;
    title += " 🔒 Låst (använd detaljvy för att ändra)";
  }

  // Ensure leading/trailing whitespace trimmed
  className = className.trim();

  return { className, title, content, isLocked };
}

/**
 * TeacherAvailabilityTable - A specialized table component for displaying and managing teacher availability
 * Features:
 * - Paint mode for marking unavailable time slots
 * - Visual indication of assigned courses, compatible courses, and unavailability
 * - Mouse drag support for efficient bulk marking
 * - Automatic conflict handling (removes teacher from runs when marked unavailable)
 */
export class TeacherAvailabilityTable extends LitElement {
  static properties = {
    teachers: { type: Array },
    slots: { type: Array },
    isPainting: { type: Boolean },
    _isMouseDown: { type: Boolean },
    _paintMode: { type: String }, // 'add' or 'remove'
    _detailSlotDate: { type: String }, // Set when in detail view for a specific slot
    _detailSlotId: { type: Number }, // The specific slot_id being viewed in detail
    _isEditingExamDate: { type: Boolean }, // Whether exam date editing is enabled
  };

  static styles = css`
    :host {
      display: block;
      --teaching-day-default-bg: #9333ea;
      --teaching-day-default-text: white;
      --teaching-day-default-cursor: pointer;
      --teaching-day-default-hover-bg: color-mix(
        in srgb,
        var(--teaching-day-default-bg),
        black 15%
      );
      --teaching-day-default-dimmed-bg: #e9d5ff;
      --teaching-day-default-dimmed-text: #6b21a8;
      --teaching-day-default-dimmed-cursor: pointer;
      --teaching-day-default-dimmed-opacity: 0.5;
      --teaching-day-default-dimmed-hover-opacity: 0.7;
      --teaching-day-alt-bg: #3b82f6;
      --teaching-day-alt-text: white;
      --teaching-day-alt-cursor: pointer;
      --teaching-day-alt-hover-bg: color-mix(
        in srgb,
        var(--teaching-day-alt-bg),
        black 10%
      );
      --exam-date-locked-bg: #ea580c;
      --exam-date-locked-text: white;
      --exam-date-locked-cursor: not-allowed;
      --exam-date-unlocked-bg: #fed7aa;
      --exam-date-unlocked-text: #9a3412;
      --exam-date-unlocked-cursor: pointer;
      --exam-date-unlocked-opacity: 0.7;
      --exam-date-unlocked-hover-opacity: 0.9;
      --exam-date-new-bg: #eab308;
      --exam-date-new-text: white;
      --exam-date-new-cursor: pointer;
      --exam-date-new-hover-bg: color-mix(
        in srgb,
        var(--exam-date-new-bg),
        black 10%
      );
    }

    .table-container {
      overflow-x: auto;
      margin-top: var(--space-4);
    }

    .table-container.painting-active {
      cursor: crosshair;
    }

    .teacher-timeline-table {
      width: 100%;
      border-collapse: collapse;
    }

    .teacher-timeline-table th,
    .teacher-timeline-table td {
      border: 1px solid var(--color-border);
      padding: var(--space-2);
      text-align: center;
      min-width: 80px;
    }

    .teacher-timeline-table th {
      background: var(--color-gray-100);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .teacher-timeline-table th.slot-header {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .teacher-timeline-table th.slot-header:hover {
      background: var(--color-gray-200);
    }

    .teacher-timeline-table th.slot-header::after {
      content: " 🔍";
      font-size: 0.8em;
      opacity: 0.5;
    }

    .teacher-timeline-table tbody tr td:first-child {
      text-align: left;
      font-weight: var(--font-weight-medium);
      background: var(--color-surface);
      position: sticky;
      left: 0;
      z-index: 1;
    }

    .teacher-name {
      display: block;
    }

    .teacher-department {
      color: var(--color-text-secondary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-normal);
    }

    .teacher-cell {
      min-height: 40px;
      padding: var(--space-1);
      cursor: pointer;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      transition: var(--transition-all);
      user-select: none;
    }

    .teacher-cell.assigned-course {
      background: var(--color-success);
      color: white;
      font-weight: var(--font-weight-semibold);
    }

    .teacher-cell.has-course {
      background: var(--color-info);
      color: white;
    }

    .teacher-cell.unavailable {
      background: var(--color-danger);
      color: white;
      position: relative;
    }

    /* Default teaching day - purple/lila, active */
    .teacher-cell.teaching-day-default:not(.unavailable) {
      background-color: var(--teaching-day-default-bg);
    }

    .teacher-timeline-table td:has(.teacher-cell.teaching-day-default) {
      background-color: var(--teaching-day-default-bg);
    }

    .teacher-timeline-table th.teaching-day-default-header {
      background-color: var(--teaching-day-default-bg);
      color: var(--teaching-day-default-text);
      cursor: var(--teaching-day-default-cursor);
      font-weight: var(--font-weight-bold);
    }

    .teacher-timeline-table th.teaching-day-default-header:hover {
      background-color: var(--teaching-day-default-hover-bg);
    }

    /* Default teaching day - dimmed (inactive) */
    .teacher-cell.teaching-day-default-dimmed:not(.unavailable) {
      background-color: var(--teaching-day-default-dimmed-bg);
      opacity: var(--teaching-day-default-dimmed-opacity);
    }

    .teacher-timeline-table td:has(.teacher-cell.teaching-day-default-dimmed) {
      background-color: var(--teaching-day-default-dimmed-bg);
      opacity: var(--teaching-day-default-dimmed-opacity);
    }

    .teacher-timeline-table th.teaching-day-default-dimmed-header {
      background-color: var(--teaching-day-default-dimmed-bg);
      color: var(--teaching-day-default-dimmed-text);
      cursor: var(--teaching-day-default-dimmed-cursor);
      font-weight: var(--font-weight-bold);
      opacity: var(--teaching-day-default-dimmed-opacity);
    }

    .teacher-timeline-table th.teaching-day-default-dimmed-header:hover {
      opacity: var(--teaching-day-default-dimmed-hover-opacity);
    }

    /* Alternative teaching day - blue */
    .teacher-cell.teaching-day-alt:not(.unavailable) {
      background-color: var(--teaching-day-alt-bg);
    }

    .teacher-timeline-table td:has(.teacher-cell.teaching-day-alt) {
      background-color: var(--teaching-day-alt-bg);
    }

    .teacher-timeline-table th.teaching-day-alt-header {
      background-color: var(--teaching-day-alt-bg);
      color: var(--teaching-day-alt-text);
      cursor: var(--teaching-day-alt-cursor);
      font-weight: var(--font-weight-bold);
    }

    .teacher-timeline-table th.teaching-day-alt-header:hover {
      background-color: var(--teaching-day-alt-hover-bg);
    }

    /* Exam date - orange (locked) */
    .teacher-cell.exam-date-locked:not(.unavailable) {
      background-color: var(--exam-date-locked-bg);
      color: var(--exam-date-locked-text);
    }

    .teacher-timeline-table td:has(.teacher-cell.exam-date-locked) {
      background-color: var(--exam-date-locked-bg);
    }

    .teacher-timeline-table th.exam-date-locked-header {
      background-color: var(--exam-date-locked-bg);
      color: var(--exam-date-locked-text);
      cursor: var(--exam-date-locked-cursor);
      font-weight: var(--font-weight-bold);
    }

    /* Exam date - dimmed orange (unlocked) */
    .teacher-cell.exam-date-unlocked:not(.unavailable) {
      background-color: var(--exam-date-unlocked-bg);
      opacity: var(--exam-date-unlocked-opacity);
    }

    .teacher-timeline-table td:has(.teacher-cell.exam-date-unlocked) {
      background-color: var(--exam-date-unlocked-bg);
      opacity: var(--exam-date-unlocked-opacity);
    }

    .teacher-timeline-table th.exam-date-unlocked-header {
      background-color: var(--exam-date-unlocked-bg);
      color: var(--exam-date-unlocked-text);
      cursor: var(--exam-date-unlocked-cursor);
      font-weight: var(--font-weight-bold);
      opacity: var(--exam-date-unlocked-opacity);
    }

    .teacher-timeline-table th.exam-date-unlocked-header:hover {
      opacity: var(--exam-date-unlocked-hover-opacity);
    }

    /* Exam date - yellow (new selection) */
    .teacher-cell.exam-date-new:not(.unavailable) {
      background-color: var(--exam-date-new-bg);
      color: var(--exam-date-new-text);
    }

    .teacher-timeline-table td:has(.teacher-cell.exam-date-new) {
      background-color: var(--exam-date-new-bg);
    }

    .teacher-timeline-table th.exam-date-new-header {
      background-color: var(--exam-date-new-bg);
      color: var(--exam-date-new-text);
      cursor: var(--exam-date-new-cursor);
      font-weight: var(--font-weight-bold);
    }

    .teacher-timeline-table th.exam-date-new-header:hover {
      background-color: var(--exam-date-new-hover-bg);
    }

    .teacher-cell.unavailable::after {
      content: "✕";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.2rem;
    }

    .teacher-cell.partially-unavailable {
      background: repeating-linear-gradient(
        45deg,
        var(--color-danger),
        var(--color-danger) 2px,
        white 2px,
        white 4px
      );
      position: relative;
    }

    .teacher-cell.locked {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .teacher-cell.locked::before {
      content: "🔒";
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.7rem;
      opacity: 0.6;
    }

    .painting-active .teacher-cell:hover {
      opacity: 0.7;
    }

    .painting-active .teacher-cell.locked:hover {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-8);
      color: var(--color-text-secondary);
    }

    .detail-view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      padding: var(--space-3);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
    }

    .detail-view-title {
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary);
    }

    .detail-view-actions {
      display: flex;
      gap: var(--space-2);
    }
  `;

  constructor() {
    super();
    this.teachers = [];
    this.slots = [];
    this.isPainting = false;
    this._isMouseDown = false;
    this._paintMode = null;
    this._detailSlotDate = null;
    this._detailSlotId = null;
    this._isEditingExamDate = false;
  }

  connectedCallback() {
    super.connectedCallback();

    // Keep a bound listener so we can unsubscribe later
    this._onStoreChange = () => {
      this.teachers = store.getTeachers();
      this.slots = store.getSlots();
      this.requestUpdate();
    };

    // Subscribe to store changes and initialize values
    store.subscribe(this._onStoreChange);
    this._onStoreChange();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Unsubscribe our listener from the store (store exposes listeners array)
    if (this._onStoreChange) {
      const idx = store.listeners.indexOf(this._onStoreChange);
      if (idx !== -1) store.listeners.splice(idx, 1);
      this._onStoreChange = null;
    }
  }

  render() {
    if (this.slots.length === 0) {
      return html`
        <div class="empty-state">
          <p>Inga tidsluckor tillgängliga.</p>
        </div>
      `;
    }

    if (this.teachers.length === 0) {
      return html`
        <div class="empty-state">
          <p>Inga lärare tillgängliga.</p>
        </div>
      `;
    }

    // If in detail view, render day-by-day view
    if (this._detailSlotDate) {
      return this._renderDetailView();
    }

    // Get unique slot start dates, sorted chronologically
    const slotDates = [...new Set(this.slots.map((s) => s.start_date))].sort();

    return html`
      <div
        class="table-container ${this.isPainting ? "painting-active" : ""}"
        @mouseup=${this._handlePaintEnd}
        @mouseleave=${this._handlePaintEnd}
      >
        <table class="teacher-timeline-table">
          <thead>
            <tr>
              <th>Lärare</th>
              ${slotDates.map((date) => this._renderDateHeader(date))}
            </tr>
          </thead>
          <tbody>
            ${this.teachers.map((teacher) => renderTeacherRow(teacher, slotDates, this._renderTeacherCell.bind(this)))}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderDetailView() {
    const days = store.getSlotDays(this._detailSlotId);
    const slot = this.slots.find((s) => s.slot_id === this._detailSlotId);

    return html`
      <detail-view-header
        slotTitle="${this._formatSlotDate(this._detailSlotDate)}"
        .daysLength=${days.length}
        .isEditingExamDate=${this._isEditingExamDate}
        @toggle-edit-exam=${() => this._toggleExamDateEditing()}
        @exit-detail=${() => this._exitDetailView()}
      ></detail-view-header>

      <detail-table
        .teachers=${this.teachers}
        .days=${days}
        .slotId=${this._detailSlotId}
        .slotDate=${this._detailSlotDate}
        .isPainting=${this.isPainting}
        .dayHeaderRenderer=${this._renderDayHeader.bind(this)}
        .teacherDayCellRenderer=${this._renderDayCell.bind(this)}
        @mouseup=${this._handlePaintEnd}
        @mouseleave=${this._handlePaintEnd}
      ></detail-table>
    `;
  }

  _renderDayHeader(dateStr) {
    const presentation = getDetailDayHeaderPresentation({
      slotId: this._detailSlotId,
      dateStr,
      isEditingExamDate: this._isEditingExamDate,
      store,
    });

    let clickHandler = null;
    if (presentation.clickMode === "toggleTeachingDay") {
      clickHandler = () => this._toggleTeachingDay(dateStr);
    } else if (presentation.clickMode === "setExamDate") {
      clickHandler = () => this._setExamDate(dateStr);
    }

    return renderDayHeader(dateStr, presentation, clickHandler);
  }

  

  _renderDayCell(teacher, dateStr) {
    const teacherId = teacher.teacher_id;
    const presentation = getDetailDayCellPresentation({
      slotId: this._detailSlotId,
      slotDate: this._detailSlotDate,
      dateStr,
      teacherId,
      isEditingExamDate: this._isEditingExamDate,
      store,
    });

    return html`
      <td>
        <teacher-cell
          .teacherId=${teacher.teacher_id}
          .date=${dateStr}
          .slotId=${this._detailSlotId}
          .slotDate=${this._detailSlotDate}
          .isDetail=${true}
          .classNameSuffix=${presentation.className}
          .titleText=${presentation.title}
          @mousedown="${this._handleCellMouseDown}"
          @mouseenter="${this._handleCellMouseEnter}"
        ></teacher-cell>
      </td>
    `;
  }

  _exitDetailView() {
    this._detailSlotDate = null;
    this._detailSlotId = null;
    this._isEditingExamDate = false; // Reset exam date editing state
    this.requestUpdate();
  }

  _toggleTeachingDay(dateStr) {
    store.toggleTeachingDay(this._detailSlotId, dateStr);
    this.requestUpdate();
  }

  _toggleExamDateEditing() {
    this._isEditingExamDate = !this._isEditingExamDate;
    if (this._isEditingExamDate) {
      // When entering edit mode, unlock the current exam date if it exists
      store.unlockExamDate(this._detailSlotId);
    } else {
      // When exiting edit mode, lock the current exam date
      store.lockExamDate(this._detailSlotId);
    }
    this.requestUpdate();
  }

  _setExamDate(dateStr) {
    store.setExamDate(this._detailSlotId, dateStr);
    // Exit editing mode and lock the new date
    this._isEditingExamDate = false;
    store.lockExamDate(this._detailSlotId);
    this.requestUpdate();
  }

  _formatSlotDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  _renderDateHeader(date) {
    const slot = this.slots.find((s) => s.start_date === date);
    const slotId = slot?.slot_id;
    return renderDateHeader(date, slotId, (slotDate, id) => this._enterDetailView(slotDate, id));
  }

  _enterDetailView(slotDate, slotId) {
    this._detailSlotDate = slotDate;
    this._detailSlotId = slotId;
    this.requestUpdate();
  }

  

  _renderTeacherCell(teacher, slotDate) {
    const slot = this.slots.find((s) => s.start_date === slotDate);
    if (!slot) {
      return html`<td><div class="teacher-cell"></div></td>`;
    }

    const presentation = getOverviewCellPresentation({
      teacher,
      slot,
      slotDate,
      store,
    });

    

    return html`
      <td>
        <teacher-cell
          .teacherId=${teacher.teacher_id}
          .slotDate=${slotDate}
          .slotId=${slot.slot_id}
          .isDetail=${false}
          .classNameSuffix=${presentation.className}
          .titleText=${presentation.title}
          .content=${presentation.content}
          .isLocked=${presentation.isLocked}
          @mousedown="${this._handleCellMouseDown}"
          @mouseenter="${this._handleCellMouseEnter}"
        ></teacher-cell>
      </td>
    `;
  }

  _handleCellMouseDown(e) {
    if (!this.isPainting) return;

    e.preventDefault(); // Prevent text selection during drag

    const cell = e.currentTarget;
    const teacherId = parseInt(cell.dataset.teacherId);
    const isDetailView = cell.dataset.isDetail === "true";

    if (isDetailView) {
      // Detail view: working with specific days
      const date = cell.dataset.date;

      // First check if there's a slot-level entry for THIS specific slot
      const hasSlotEntry = hasBusySlotEntry(
        teacherId,
        this._detailSlotId,
        this._detailSlotDate
      );

      if (hasSlotEntry) {
        // Convert slot-level entry into day-level entries and remove it
        const removed = convertSlotEntryToDayEntriesAndRemove(
          this._detailSlotId,
          teacherId,
          date
        );
        if (removed) {
          console.log("🗑️ Removing slot entry:", removed.id);
          const days = store.getSlotDays(this._detailSlotId);
          console.log("📅 Days in slot:", days.length, "Clicked date:", date);
        }

        // Set paint mode to remove (since we just unmarked this day)
        this._paintMode = "remove";
        this._isMouseDown = true;
        this.requestUpdate();

        this.dispatchEvent(
          new CustomEvent("availability-changed", {
            detail: { teacherId, date, unavailable: false },
          })
        );
        return;
      }

      // No slot-level entry, check day-level
      const isCurrentlyUnavailable = store.isTeacherUnavailableOnDay(
        teacherId,
        date
      );

      this._paintMode = isCurrentlyUnavailable ? "remove" : "add";

      store.toggleTeacherAvailabilityForDay(teacherId, date);
      this._isMouseDown = true;

      // Force immediate re-render
      this.requestUpdate();

      this.dispatchEvent(
        new CustomEvent("availability-changed", {
          detail: { teacherId, date, unavailable: !isCurrentlyUnavailable },
        })
      );
    } else {
      // Slot view: working with entire slots
      const slotDate = cell.dataset.slotDate;
      const slotId = parseInt(cell.dataset.slotId);

      // Check if cell is locked (has day-specific availability data)
      const isLocked = cell.dataset.isLocked === "true";
      if (isLocked) {
        return; // Don't allow toggling locked cells
      }

      const isCurrentlyUnavailable = store.isTeacherUnavailable(
        teacherId,
        slotDate,
        slotId
      );

      this._paintMode = isCurrentlyUnavailable ? "remove" : "add";

      if (this._paintMode === "add") {
        this._removeTeacherFromRunsInSlot(teacherId, slotDate);
      }

      store.toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId);
      this._isMouseDown = true;

      // Force immediate re-render
      this.requestUpdate();

      this.dispatchEvent(
        new CustomEvent("availability-changed", {
          detail: { teacherId, slotDate, unavailable: !isCurrentlyUnavailable },
        })
      );
    }
  }

  _handleCellMouseEnter(e) {
    if (!this.isPainting || !this._isMouseDown || !this._paintMode) return;

    const cell = e.currentTarget;
    const teacherId = parseInt(cell.dataset.teacherId);
    const isDetailView = cell.dataset.isDetail === "true";

    if (isDetailView) {
      // Detail view: working with specific days
      const date = cell.dataset.date;

      // Check if this day is unavailable (either day-level or slot-level)
      let isCurrentlyUnavailable = store.isTeacherUnavailableOnDay(
        teacherId,
        date
      );

      // If not a day-level entry, check if there's a slot-level entry
      if (
        !isCurrentlyUnavailable &&
        this._detailSlotDate &&
        this._detailSlotId
      ) {
        if (
          hasBusySlotEntry(teacherId, this._detailSlotId, this._detailSlotDate)
        ) {
          isCurrentlyUnavailable = true;
        }
      }

      if (this._paintMode === "add" && !isCurrentlyUnavailable) {
        // Check if there's a slot-level entry that needs to be converted
        // In add mode we simply toggle the day-level availability
        store.toggleTeacherAvailabilityForDay(teacherId, date);

        this.requestUpdate();

        this.dispatchEvent(
          new CustomEvent("availability-changed", {
            detail: { teacherId, date, unavailable: true },
          })
        );
      } else if (this._paintMode === "remove" && isCurrentlyUnavailable) {
        // Check if this is from a slot-level entry
        const isDayLevel = store.isTeacherUnavailableOnDay(teacherId, date);

        if (!isDayLevel && this._detailSlotDate && this._detailSlotId) {
          // This is a slot-level entry, convert+remove via helper
          const removed = convertSlotEntryToDayEntriesAndRemove(
            this._detailSlotId,
            teacherId,
            date
          );
          if (removed) {
            // converted and removed
          }
        } else {
          // Regular day-level entry, just toggle it
          store.toggleTeacherAvailabilityForDay(teacherId, date);
        }

        this.requestUpdate();

        this.dispatchEvent(
          new CustomEvent("availability-changed", {
            detail: { teacherId, date, unavailable: false },
          })
        );
      }
    } else {
      // Slot view: working with entire slots
      const slotDate = cell.dataset.slotDate;
      const slotId = parseInt(cell.dataset.slotId);

      // Check if cell is locked (has day-specific availability data)
      const isLocked = cell.dataset.isLocked === "true";
      if (isLocked) {
        return; // Skip locked cells during drag painting
      }

      const isCurrentlyUnavailable = store.isTeacherUnavailable(
        teacherId,
        slotDate,
        slotId
      );

      if (this._paintMode === "add" && !isCurrentlyUnavailable) {
        this._removeTeacherFromRunsInSlot(teacherId, slotDate);
        store.toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId);

        // Force immediate re-render
        this.requestUpdate();

        this.dispatchEvent(
          new CustomEvent("availability-changed", {
            detail: { teacherId, slotDate, unavailable: true },
          })
        );
      } else if (this._paintMode === "remove" && isCurrentlyUnavailable) {
        store.toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId);

        // Force immediate re-render
        this.requestUpdate();

        this.dispatchEvent(
          new CustomEvent("availability-changed", {
            detail: { teacherId, slotDate, unavailable: false },
          })
        );
      }
    }
  }

  _handlePaintEnd() {
    if (this._isMouseDown) {
      this._isMouseDown = false;
      this._paintMode = null;

      // Dispatch event that painting session ended
      this.dispatchEvent(new CustomEvent("paint-session-ended"));
    }
  }

  _removeTeacherFromRunsInSlot(teacherId, slotDate) {
    const slot = this.slots.find((s) => s.start_date === slotDate);
    if (!slot) return;

    const runsInSlot = store
      .getCourseRuns()
      .filter((r) => r.slot_id === slot.slot_id);

    for (const run of runsInSlot) {
      if (run.teachers && run.teachers.includes(teacherId)) {
        run.teachers = run.teachers.filter((id) => id !== teacherId);
      }
    }
  }
}

customElements.define("teacher-availability-table", TeacherAvailabilityTable);
