import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "./button.js";
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
      background-color: #9333ea;
    }

    .teacher-timeline-table td:has(.teacher-cell.teaching-day-default) {
      background-color: #9333ea;
    }

    .teacher-timeline-table th.teaching-day-default-header {
      background-color: #9333ea;
      color: white;
      cursor: pointer;
      font-weight: var(--font-weight-bold);
    }

    .teacher-timeline-table th.teaching-day-default-header:hover {
      background-color: #7e22ce;
    }

    /* Default teaching day - dimmed (inactive) */
    .teacher-cell.teaching-day-default-dimmed:not(.unavailable) {
      background-color: #e9d5ff;
      opacity: 0.5;
    }

    .teacher-timeline-table td:has(.teacher-cell.teaching-day-default-dimmed) {
      background-color: #e9d5ff;
      opacity: 0.5;
    }

    .teacher-timeline-table th.teaching-day-default-dimmed-header {
      background-color: #e9d5ff;
      color: #6b21a8;
      cursor: pointer;
      font-weight: var(--font-weight-bold);
      opacity: 0.5;
    }

    .teacher-timeline-table th.teaching-day-default-dimmed-header:hover {
      opacity: 0.7;
    }

    /* Alternative teaching day - blue */
    .teacher-cell.teaching-day-alt:not(.unavailable) {
      background-color: #3b82f6;
    }

    .teacher-timeline-table td:has(.teacher-cell.teaching-day-alt) {
      background-color: #3b82f6;
    }

    .teacher-timeline-table th.teaching-day-alt-header {
      background-color: #3b82f6;
      color: white;
      cursor: pointer;
      font-weight: var(--font-weight-bold);
    }

    .teacher-timeline-table th.teaching-day-alt-header:hover {
      background-color: #2563eb;
    }

    /* Exam date - orange (locked) */
    .teacher-cell.exam-date-locked:not(.unavailable) {
      background-color: #ea580c;
      color: white;
    }

    .teacher-timeline-table td:has(.teacher-cell.exam-date-locked) {
      background-color: #ea580c;
    }

    .teacher-timeline-table th.exam-date-locked-header {
      background-color: #ea580c;
      color: white;
      cursor: not-allowed;
      font-weight: var(--font-weight-bold);
    }

    /* Exam date - dimmed orange (unlocked) */
    .teacher-cell.exam-date-unlocked:not(.unavailable) {
      background-color: #fed7aa;
      opacity: 0.7;
    }

    .teacher-timeline-table td:has(.teacher-cell.exam-date-unlocked) {
      background-color: #fed7aa;
      opacity: 0.7;
    }

    .teacher-timeline-table th.exam-date-unlocked-header {
      background-color: #fed7aa;
      color: #9a3412;
      cursor: pointer;
      font-weight: var(--font-weight-bold);
      opacity: 0.7;
    }

    .teacher-timeline-table th.exam-date-unlocked-header:hover {
      opacity: 0.9;
    }

    /* Exam date - yellow (new selection) */
    .teacher-cell.exam-date-new:not(.unavailable) {
      background-color: #eab308;
      color: white;
    }

    .teacher-timeline-table td:has(.teacher-cell.exam-date-new) {
      background-color: #eab308;
    }

    .teacher-timeline-table th.exam-date-new-header {
      background-color: #eab308;
      color: white;
      cursor: pointer;
      font-weight: var(--font-weight-bold);
    }

    .teacher-timeline-table th.exam-date-new-header:hover {
      background-color: #ca8a04;
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
        <div class="detail-view-actions">
          <henry-button
            variant="${this._isEditingExamDate ? "primary" : "outline"}"
            size="small"
            @click="${this._toggleExamDateEditing}"
          >
            ${this._isEditingExamDate
              ? "🚫 Avbryt ändring"
              : "📝 Ändra tentamensdatum"}
          </henry-button>
          <henry-button
            variant="secondary"
            size="small"
            @click="${this._exitDetailView}"
          >
            ← Avsluta detaljläge
          </henry-button>
        </div>
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

    const state = store.getTeachingDayState(this._detailSlotId, dateStr);
    const isExamDate = store.isExamDate(this._detailSlotId, dateStr);
    const isExamDateLocked = store.isExamDateLocked(this._detailSlotId);

    let headerClass = "";
    let titleText = "Klicka för att markera som undervisningsdag";
    let clickHandler = () => this._toggleTeachingDay(dateStr);

    // Exam date logic takes precedence
    if (isExamDate) {
      if (isExamDateLocked) {
        headerClass = "exam-date-locked-header";
        titleText =
          "Tentamensdatum (låst - tryck 'Ändra tentamensdatum' för att ändra)";
        clickHandler = null;
      } else if (this._isEditingExamDate) {
        // Currently editing - this is the unlocked existing date
        headerClass = "exam-date-unlocked-header";
        titleText = "Nuvarande tentamensdatum (klicka för att byta)";
        clickHandler = () => this._setExamDate(dateStr);
      } else {
        // Shouldn't happen - unlocked but not editing
        headerClass = "exam-date-unlocked-header";
        titleText = "Tentamensdatum (olåst)";
        clickHandler = null;
      }
    } else if (this._isEditingExamDate) {
      // Not exam date but editing mode - can set as new exam date
      headerClass = "exam-date-new-header";
      titleText = "Klicka för att sätta som tentamensdatum";
      clickHandler = () => this._setExamDate(dateStr);
    } else if (state) {
      // Teaching day logic
      if (state.isDefault && state.active) {
        headerClass = "teaching-day-default-header";
        titleText = "Standarddag (klicka för att inaktivera)";
      } else if (state.isDefault && !state.active) {
        headerClass = "teaching-day-default-dimmed-header";
        titleText = "Inaktiverad standarddag (klicka för att aktivera)";
      } else if (!state.isDefault && state.active) {
        headerClass = "teaching-day-alt-header";
        titleText = "Alternativ undervisningsdag (klicka för att ta bort)";
      }
    }

    return html`<th
      class="${headerClass}"
      @click="${clickHandler}"
      title="${titleText}"
      style="cursor: ${clickHandler ? "pointer" : "not-allowed"};"
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
    const teacherId = teacher.teacher_id;

    // Determine if the day is unavailable either by day-level entry
    // or by a slot-level busy entry when in detail view
    const isUnavailable = isDayUnavailableConsideringSlot(
      teacherId,
      dateStr,
      this._detailSlotId,
      this._detailSlotDate
    );

    let cellClass = "teacher-cell";
    let titleText = dateStr;

    const state = store.getTeachingDayState(this._detailSlotId, dateStr);
    const isExamDate = store.isExamDate(this._detailSlotId, dateStr);
    const isExamDateLocked = store.isExamDateLocked(this._detailSlotId);

    // Exam date logic takes precedence over teaching days
    if (isExamDate) {
      if (isExamDateLocked) {
        cellClass += " exam-date-locked";
        titleText += " (Tentamensdatum - låst)";
      } else if (this._isEditingExamDate) {
        cellClass += " exam-date-unlocked";
        titleText += " (Tentamensdatum - olåst)";
      } else {
        // Shouldn't happen
        cellClass += " exam-date-unlocked";
        titleText += " (Tentamensdatum - olåst)";
      }
    } else if (this._isEditingExamDate) {
      // Not exam date but in editing mode - potential new selection
      cellClass += " exam-date-new";
      titleText += " (Kan väljas som tentamensdatum)";
    } else if (state) {
      // Teaching day logic
      if (state.isDefault && state.active) {
        cellClass += " teaching-day-default";
        titleText += " (Standarddag)";
      } else if (state.isDefault && !state.active) {
        cellClass += " teaching-day-default-dimmed";
        titleText += " (Inaktiverad standarddag)";
      } else if (!state.isDefault && state.active) {
        cellClass += " teaching-day-alt";
        titleText += " (Alternativ undervisningsdag)";
      }
    }

    if (isUnavailable) {
      cellClass += " unavailable";
      titleText = `Upptagen ${dateStr}`;
      if (isExamDate) {
        titleText += " (Tentamensdatum)";
      } else if (state) {
        if (state.isDefault && state.active) {
          titleText += " (Standarddag)";
        } else if (state.isDefault && !state.active) {
          titleText += " (Inaktiverad standarddag)";
        } else if (!state.isDefault && state.active) {
          titleText += " (Alternativ undervisningsdag)";
        }
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
      if (!isCurrentlyUnavailable && this._detailSlotDate && this._detailSlotId) {
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
