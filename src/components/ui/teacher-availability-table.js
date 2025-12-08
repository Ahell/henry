import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "./button.js";

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
  };

  static styles = css`
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

    .teacher-cell.teaching-day:not(.unavailable) {
      background-color: #3b82f6;
    }

    .teacher-timeline-table td:has(.teacher-cell.teaching-day) {
      background-color: #3b82f6;
    }

    .teacher-timeline-table th.teaching-day-header {
      background-color: #3b82f6;
      color: white;
      cursor: pointer;
      font-weight: var(--font-weight-bold);
    }

    .teacher-timeline-table th.teaching-day-header:hover {
      background-color: #2563eb;
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
  `;

  constructor() {
    super();
    this.teachers = [];
    this.slots = [];
    this.isPainting = false;
    this._isMouseDown = false;
    this._paintMode = null;
    this._detailSlotDate = null;
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

  _renderDetailView() {
    const days = store.getSlotDays(this._detailSlotId);
    const slot = this.slots.find((s) => s.slot_id === this._detailSlotId);

    return html`
      <div class="detail-view-header">
        <div class="detail-view-title">
          📅 Detaljvy för ${this._formatSlotDate(this._detailSlotDate)}
          ${slot ? ` (${days.length} dagar)` : ""}
        </div>
        <henry-button
          variant="secondary"
          size="small"
          @click="${this._exitDetailView}"
        >
          ← Avsluta detaljläge
        </henry-button>
      </div>

      <div
        class="table-container ${this.isPainting ? "painting-active" : ""}"
        @mouseup="${this._handlePaintEnd}"
        @mouseleave="${this._handlePaintEnd}"
      >
        <table class="teacher-timeline-table">
          <thead>
            <tr>
              <th>Lärare</th>
              ${days.map((day) => this._renderDayHeader(day))}
            </tr>
          </thead>
          <tbody>
            ${this.teachers.map((teacher) =>
              this._renderTeacherDetailRow(teacher, days)
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderDayHeader(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("sv-SE", { month: "short" });
    const weekday = d.toLocaleString("sv-SE", { weekday: "short" });
    const isTeachingDay = store.isTeachingDay(this._detailSlotId, dateStr);

    return html`<th
      class="${isTeachingDay ? "teaching-day-header" : ""}"
      @click="${() => this._toggleTeachingDay(dateStr)}"
      title="${isTeachingDay
        ? "Undervisningsdag (klicka för att ta bort)"
        : "Klicka för att markera som undervisningsdag"}"
      style="cursor: pointer;"
    >
      ${weekday}<br />${day} ${month}
    </th>`;
  }

  _renderTeacherDetailRow(teacher, days) {
    return html`
      <tr>
        <td>
          <span class="teacher-name">${teacher.name}</span>
          <span class="teacher-department">${teacher.home_department}</span>
        </td>
        ${days.map((day) => this._renderDayCell(teacher, day))}
      </tr>
    `;
  }

  _renderDayCell(teacher, dateStr) {
    // Check if this specific day is unavailable
    let isUnavailable = store.isTeacherUnavailableOnDay(
      teacher.teacher_id,
      dateStr
    );

    if (dateStr === "2025-01-17" && teacher.teacher_id === 1) {
      console.log("🎨 Rendering 2025-01-17 for teacher 1:", isUnavailable);
    }

    // If not, check if the entire slot is marked as unavailable (slot-level entry)
    if (!isUnavailable && this._detailSlotDate && this._detailSlotId) {
      const hasSlotEntry = store.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacher.teacher_id &&
          a.from_date === this._detailSlotDate &&
          a.slot_id === this._detailSlotId &&
          a.type === "busy"
      );
      if (hasSlotEntry) {
        isUnavailable = true;
        if (dateStr === "2025-01-17" && teacher.teacher_id === 1) {
          console.log("🔴 Found slot entry, marking as unavailable");
        }
      }
    }

    if (dateStr === "2025-01-17" && teacher.teacher_id === 1) {
      console.log("✅ Final isUnavailable:", isUnavailable);
    }

    let cellClass = "teacher-cell";
    let titleText = dateStr;

    const isTeachingDay = store.isTeachingDay(this._detailSlotId, dateStr);
    if (isTeachingDay) {
      cellClass += " teaching-day";
      titleText += " (Undervisningsdag)";
    }

    if (isUnavailable) {
      cellClass += " unavailable";
      titleText = `Upptagen ${dateStr}`;
      if (isTeachingDay) {
        titleText += " (Undervisningsdag)";
      }
    }

    return html`
      <td>
        <div
          class="${cellClass}"
          data-teacher-id="${teacher.teacher_id}"
          data-date="${dateStr}"
          data-is-detail="true"
          @mousedown="${this._handleCellMouseDown}"
          @mouseenter="${this._handleCellMouseEnter}"
          title="${titleText}"
        ></div>
      </td>
    `;
  }

  _toggleTeachingDay(dateStr) {
    if (this._teachingDays.has(dateStr)) {
      this._teachingDays.delete(dateStr);
    } else {
      this._teachingDays.add(dateStr);
    }
    this.requestUpdate();
  }

  _exitDetailView() {
    this._detailSlotDate = null;
    this._detailSlotId = null;
    this.requestUpdate();
  }

  _toggleTeachingDay(dateStr) {
    store.toggleTeachingDay(this._detailSlotId, dateStr);
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
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("sv-SE", { month: "short" });
    const year = d.getFullYear().toString().slice(-2);
    return html`<th
      class="slot-header"
      @click="${(e) => {
        const slot = this.slots.find((s) => s.start_date === date);
        this._enterDetailView(date, slot?.slot_id);
      }}"
      title="Klicka för att se dag-för-dag-vy"
    >
      ${day} ${month}<br />${year}
    </th>`;
  }

  _enterDetailView(slotDate, slotId) {
    this._detailSlotDate = slotDate;
    this._detailSlotId = slotId;
    this.requestUpdate();
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
      slotDate,
      slot.slot_id
    );

    // Check if partially unavailable (has some days marked as busy in detail view)
    const unavailablePercentage = store.getTeacherUnavailablePercentageForSlot(
      teacher.teacher_id,
      slotDate,
      slot.slot_id
    );
    const isPartiallyUnavailable =
      unavailablePercentage > 0 && unavailablePercentage < 1;

    // Determine cell appearance
    let cellClass = "teacher-cell";
    let content = "";
    let titleText = "";

    // Only partially unavailable cells should be locked (not fully unavailable)
    if (isPartiallyUnavailable) {
      cellClass += " locked";
    }

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
    } else if (isPartiallyUnavailable && !isAssigned) {
      cellClass += " partially-unavailable";
      const percentage = Math.round(unavailablePercentage * 100);
      titleText += titleText
        ? ` (${percentage}% upptagen)`
        : `${percentage}% upptagen`;
      titleText += " 🔒 Låst (använd detaljvy för att ändra)";
    }

    return html`
      <td>
        <div
          class="${cellClass}"
          data-teacher-id="${teacher.teacher_id}"
          data-slot-date="${slotDate}"
          data-slot-id="${slot.slot_id}"
          data-is-locked="${isPartiallyUnavailable}"
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
    const isDetailView = cell.dataset.isDetail === "true";

    if (isDetailView) {
      // Detail view: working with specific days
      const date = cell.dataset.date;

      // First check if there's a slot-level entry for THIS specific slot
      let hasSlotEntry = false;
      if (this._detailSlotDate && this._detailSlotId) {
        hasSlotEntry = store.teacherAvailability.some(
          (a) =>
            a.teacher_id === teacherId &&
            a.from_date === this._detailSlotDate &&
            a.slot_id === this._detailSlotId &&
            a.type === "busy"
        );
      }

      if (hasSlotEntry) {
        // There's a slot-level entry, convert it to individual day entries
        // Remove the slot-level entry
        const slotEntry = store.teacherAvailability.find(
          (a) =>
            a.teacher_id === teacherId &&
            a.from_date === this._detailSlotDate &&
            a.slot_id === this._detailSlotId &&
            a.type === "busy"
        );
        if (slotEntry) {
          console.log("🗑️ Removing slot entry:", slotEntry.id);
          store.removeTeacherAvailability(slotEntry.id);
        }

        // Add individual entries for all OTHER days in the slot
        const days = store.getSlotDays(this._detailSlotId);
        console.log("📅 Days in slot:", days.length, "Clicked date:", date);
        days.forEach((day) => {
          if (day !== date) {
            // Add entry for all days except the one being clicked
            console.log("➕ Adding day entry for:", day);
            store.addTeacherAvailability({
              teacher_id: teacherId,
              from_date: day,
              to_date: day,
              type: "busy",
            });
          } else {
            console.log("⏭️ Skipping clicked day:", day);
          }
        });

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
      if (!isCurrentlyUnavailable && this._detailSlotDate) {
        const hasSlotEntry = store.teacherAvailability.some(
          (a) =>
            a.teacher_id === teacherId &&
            a.from_date === this._detailSlotDate &&
            a.type === "busy"
        );
        if (hasSlotEntry) {
          isCurrentlyUnavailable = true;
        }
      }

      if (this._paintMode === "add" && !isCurrentlyUnavailable) {
        // Check if there's a slot-level entry that needs to be converted
        if (this._detailSlotDate) {
          const slotEntry = store.teacherAvailability.find(
            (a) =>
              a.teacher_id === teacherId &&
              a.from_date === this._detailSlotDate &&
              a.type === "busy"
          );
          if (slotEntry) {
            // This shouldn't happen in "add" mode, but handle it just in case
            // (it means we're trying to add to an already fully marked slot)
            store.toggleTeacherAvailabilityForDay(teacherId, date);
          } else {
            store.toggleTeacherAvailabilityForDay(teacherId, date);
          }
        } else {
          store.toggleTeacherAvailabilityForDay(teacherId, date);
        }

        this.requestUpdate();

        this.dispatchEvent(
          new CustomEvent("availability-changed", {
            detail: { teacherId, date, unavailable: true },
          })
        );
      } else if (this._paintMode === "remove" && isCurrentlyUnavailable) {
        // Check if this is from a slot-level entry
        const isDayLevel = store.isTeacherUnavailableOnDay(teacherId, date);

        if (!isDayLevel && this._detailSlotDate) {
          // This is a slot-level entry, need to convert it
          const slotEntry = store.teacherAvailability.find(
            (a) =>
              a.teacher_id === teacherId &&
              a.from_date === this._detailSlotDate &&
              a.type === "busy"
          );
          if (slotEntry) {
            store.removeTeacherAvailability(slotEntry.id);

            // Add individual entries for all OTHER days
            const days = store.getSlotDays(this._detailSlotDate);
            days.forEach((day) => {
              if (day !== date) {
                store.addTeacherAvailability({
                  teacher_id: teacherId,
                  from_date: day,
                  to_date: day,
                  type: "busy",
                });
              }
            });
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
