import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";

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
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
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

    .teacher-cell.unavailable::after {
      content: "✕";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.2rem;
    }

    .painting-active .teacher-cell:hover {
      opacity: 0.7;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-8);
      color: var(--color-text-secondary);
    }
  `;

  constructor() {
    super();
    this.teachers = [];
    this.slots = [];
    this.isPainting = false;
    this._isMouseDown = false;
    this._paintMode = null;
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

    // Get unique slot start dates, sorted chronologically
    const slotDates = [...new Set(this.slots.map((s) => s.start_date))].sort();

    return html`
      <div
        class="table-container ${this.isPainting ? "painting-active" : ""}"
        @mouseup="${this._handlePaintEnd}"
        @mouseleave="${this._handlePaintEnd}"
      >
        <table class="teacher-timeline-table">
          <thead>
            <tr>
              <th>Lärare</th>
              ${slotDates.map((date) => this._renderDateHeader(date))}
            </tr>
          </thead>
          <tbody>
            ${this.teachers.map((teacher) =>
              this._renderTeacherRow(teacher, slotDates)
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderDateHeader(date) {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("sv-SE", { month: "short" });
    const year = d.getFullYear().toString().slice(-2);
    return html`<th>${day} ${month}<br />${year}</th>`;
  }

  _renderTeacherRow(teacher, slotDates) {
    return html`
      <tr>
        <td>
          <span class="teacher-name">${teacher.name}</span>
          <span class="teacher-department">${teacher.home_department}</span>
        </td>
        ${slotDates.map((date) => this._renderTeacherCell(teacher, date))}
      </tr>
    `;
  }

  _renderTeacherCell(teacher, slotDate) {
    const slot = this.slots.find((s) => s.start_date === slotDate);
    if (!slot) {
      return html`<td><div class="teacher-cell"></div></td>`;
    }

    const compatibleCourseIds = teacher.compatible_courses || [];
    const courseRuns = store.getCourseRuns();

    // Find compatible course runs in this slot
    const compatibleRuns = courseRuns.filter(
      (r) =>
        r.slot_id === slot.slot_id && compatibleCourseIds.includes(r.course_id)
    );

    // Find assigned course runs in this slot
    const assignedRuns = courseRuns.filter(
      (r) =>
        r.slot_id === slot.slot_id &&
        r.teachers &&
        r.teachers.includes(teacher.teacher_id)
    );

    const isAssigned = assignedRuns.length > 0;
    const isUnavailable = store.isTeacherUnavailable(
      teacher.teacher_id,
      slotDate
    );

    // Determine cell appearance
    let cellClass = "teacher-cell";
    let content = "";
    let titleText = "";

    if (isAssigned) {
      cellClass += " assigned-course";
      const courseCodes = assignedRuns
        .map((run) => store.getCourse(run.course_id)?.code)
        .filter(Boolean);
      content = courseCodes.join(", ");
      titleText =
        "Tilldelad: " +
        assignedRuns
          .map((run) => store.getCourse(run.course_id)?.name)
          .filter(Boolean)
          .join(", ");
    } else if (compatibleRuns.length > 0) {
      cellClass += " has-course";
      const courseCodes = compatibleRuns
        .map((run) => store.getCourse(run.course_id)?.code)
        .filter(Boolean);
      content = courseCodes.join(", ");
      titleText = compatibleRuns
        .map((run) => store.getCourse(run.course_id)?.name)
        .filter(Boolean)
        .join(", ");
    }

    if (isUnavailable && !isAssigned) {
      cellClass += " unavailable";
      titleText += titleText ? " (Upptagen)" : "Upptagen";
    }

    return html`
      <td>
        <div
          class="${cellClass}"
          data-teacher-id="${teacher.teacher_id}"
          data-slot-date="${slotDate}"
          @mousedown="${this._handleCellMouseDown}"
          @mouseenter="${this._handleCellMouseEnter}"
          title="${titleText}"
        >
          ${content}
        </div>
      </td>
    `;
  }

  _handleCellMouseDown(e) {
    if (!this.isPainting) return;

    e.preventDefault(); // Prevent text selection during drag

    const cell = e.currentTarget;
    const teacherId = parseInt(cell.dataset.teacherId);
    const slotDate = cell.dataset.slotDate;

    const isCurrentlyUnavailable = store.isTeacherUnavailable(
      teacherId,
      slotDate
    );

    // Determine paint mode based on first click
    this._paintMode = isCurrentlyUnavailable ? "remove" : "add";

    // If marking as unavailable, remove teacher from any assigned runs
    if (this._paintMode === "add") {
      this._removeTeacherFromRunsInSlot(teacherId, slotDate);
    }

    // Toggle availability
    store.toggleTeacherAvailabilityForSlot(teacherId, slotDate);
    this._isMouseDown = true;

    // Force immediate re-render
    this.requestUpdate();

    // Dispatch event for parent to know changes were made
    this.dispatchEvent(
      new CustomEvent("availability-changed", {
        detail: { teacherId, slotDate, unavailable: !isCurrentlyUnavailable },
      })
    );
  }

  _handleCellMouseEnter(e) {
    if (!this.isPainting || !this._isMouseDown || !this._paintMode) return;

    const cell = e.currentTarget;
    const teacherId = parseInt(cell.dataset.teacherId);
    const slotDate = cell.dataset.slotDate;

    const isCurrentlyUnavailable = store.isTeacherUnavailable(
      teacherId,
      slotDate
    );

    // Apply paint mode consistently across drag
    if (this._paintMode === "add" && !isCurrentlyUnavailable) {
      this._removeTeacherFromRunsInSlot(teacherId, slotDate);
      store.toggleTeacherAvailabilityForSlot(teacherId, slotDate);

      // Force immediate re-render
      this.requestUpdate();

      this.dispatchEvent(
        new CustomEvent("availability-changed", {
          detail: { teacherId, slotDate, unavailable: true },
        })
      );
    } else if (this._paintMode === "remove" && isCurrentlyUnavailable) {
      store.toggleTeacherAvailabilityForSlot(teacherId, slotDate);

      // Force immediate re-render
      this.requestUpdate();

      this.dispatchEvent(
        new CustomEvent("availability-changed", {
          detail: { teacherId, slotDate, unavailable: false },
        })
      );
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
