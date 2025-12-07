import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";

export class TeacherAvailabilityTab extends LitElement {
  static properties = {
    isPainting: { type: Boolean },
    paintMode: { type: String },
    _isMouseDown: { type: Boolean },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .paint-controls {
      display: flex;
      gap: var(--space-4);
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .legend {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
    }

    .legend-box {
      width: 20px;
      height: 20px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }

    .teacher-timeline-container {
      overflow-x: auto;
    }

    .teacher-timeline-container.painting-active {
      cursor: crosshair;
    }

    .teacher-timeline-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
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

    .teacher-timeline-table tbody tr:first-child td {
      text-align: left;
      font-weight: var(--font-weight-medium);
      background: var(--color-surface);
      position: sticky;
      left: 0;
      z-index: 1;
    }

    .teacher-cell {
      min-height: 40px;
      padding: var(--space-1);
      cursor: pointer;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      transition: var(--transition-all);
    }

    .teacher-cell.has-course {
      background: var(--color-info);
      color: white;
    }

    .teacher-cell.assigned-course {
      background: var(--color-success);
      color: white;
      font-weight: var(--font-weight-semibold);
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
  `;

  constructor() {
    super();
    this.isPainting = false;
    this.paintMode = null;
    this._isMouseDown = false;
    store.subscribe(() => this.requestUpdate());
  }

  render() {
    const slots = store.getSlots();
    const teachers = store.getTeachers();

    if (slots.length === 0) {
      return html`<henry-panel>
        <div slot="header">
          <henry-text variant="heading-3">Lärartillgänglighet</henry-text>
        </div>
        <p>Inga tidsluckor tillgängliga.</p>
      </henry-panel>`;
    }

    // Get unique slot start dates, sorted chronologically
    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();

    return html`
      <henry-panel noPadding>
        <div slot="header">
          <henry-text variant="heading-3">Lärartillgänglighet</henry-text>
        </div>
        <div style="padding: var(--space-6);">
          <p
            style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4);"
          >
            Klicka på "Markera upptagen" och måla sedan i cellerna för att markera
            när en lärare är upptagen. Blå celler visar schemalagda kurser.
          </p>

        <div class="paint-controls">
          <henry-button
            variant="${this.isPainting ? "success" : "secondary"}"
            @click="${this.togglePaintMode}"
          >
            ${this.isPainting ? "✓ Målningsläge aktivt" : "🖌️ Markera upptagen"}
          </henry-button>
          ${this.isPainting
            ? html`
                <span
                  style="color: var(--color-text-secondary); font-size: var(--font-size-sm);"
                >
                  Klicka eller dra över celler för att markera/avmarkera. Klicka
                  på knappen igen för att avsluta.
                </span>
              `
            : ""}
        </div>

        <div class="legend">
          <div class="legend-item">
            <div
              class="legend-box"
              style="background: var(--color-success);"
            ></div>
            <span>Tilldelad kurs</span>
          </div>
          <div class="legend-item">
            <div
              class="legend-box"
              style="background: var(--color-info);"
            ></div>
            <span>Kompatibel kurs (ej tilldelad)</span>
          </div>
          <div class="legend-item">
            <div
              class="legend-box"
              style="background: var(--color-danger);"
            ></div>
            <span>Upptagen/ej tillgänglig</span>
          </div>
        </div>

        <div
          class="teacher-timeline-container ${this.isPainting
            ? "painting-active"
            : ""}"
          @mouseup="${this.handlePaintEnd}"
          @mouseleave="${this.handlePaintEnd}"
        >
          <table class="teacher-timeline-table">
            <thead>
              <tr>
                <th>Lärare</th>
                ${slotDates.map((date) => {
                  const d = new Date(date);
                  const day = d.getDate();
                  const month = d.toLocaleString("sv-SE", { month: "short" });
                  const year = d.getFullYear().toString().slice(-2);
                  return html`<th>${day} ${month}<br />${year}</th>`;
                })}
              </tr>
            </thead>
            <tbody>
              ${teachers.map((teacher) =>
                this.renderTeacherTimelineRow(teacher, slotDates)
              )}
            </tbody>
          </table>
        </div>
        </div>
      </henry-panel>
    `;
  }

  renderTeacherTimelineRow(teacher, slotDates) {
    return html`
      <tr>
        <td>
          ${teacher.name}<br /><small
            style="color: var(--color-text-secondary);"
          >
            ${teacher.home_department}</small
          >
        </td>
        ${slotDates.map((date) => this.renderTeacherCell(teacher, date))}
      </tr>
    `;
  }

  renderTeacherCell(teacher, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    const compatibleCourseIds = teacher.compatible_courses || [];

    const compatibleRuns = slot
      ? store
          .getCourseRuns()
          .filter(
            (r) =>
              r.slot_id === slot.slot_id &&
              compatibleCourseIds.includes(r.course_id)
          )
      : [];

    const assignedRuns = slot
      ? store
          .getCourseRuns()
          .filter(
            (r) =>
              r.slot_id === slot.slot_id &&
              r.teachers &&
              r.teachers.includes(teacher.teacher_id)
          )
      : [];
    const isAssigned = assignedRuns.length > 0;
    const isUnavailable = store.isTeacherUnavailable(
      teacher.teacher_id,
      slotDate
    );

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
          @mousedown="${this.handleCellMouseDown}"
          @mouseenter="${this.handleCellMouseEnter}"
          title="${titleText}"
        >
          ${content}
        </div>
      </td>
    `;
  }

  togglePaintMode() {
    this.isPainting = !this.isPainting;
    this.paintMode = null;
  }

  removeTeacherFromRunsInSlot(teacherId, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
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

  handleCellMouseDown(e) {
    if (!this.isPainting) return;

    const cell = e.currentTarget;
    const teacherId = parseInt(cell.dataset.teacherId);
    const slotDate = cell.dataset.slotDate;

    const isCurrentlyUnavailable = store.isTeacherUnavailable(
      teacherId,
      slotDate
    );
    this.paintMode = isCurrentlyUnavailable ? "remove" : "add";

    if (this.paintMode === "add") {
      this.removeTeacherFromRunsInSlot(teacherId, slotDate);
    }

    store.toggleTeacherAvailabilityForSlot(teacherId, slotDate);
    this._isMouseDown = true;
  }

  handleCellMouseEnter(e) {
    if (!this.isPainting || !this._isMouseDown || !this.paintMode) return;

    const cell = e.currentTarget;
    const teacherId = parseInt(cell.dataset.teacherId);
    const slotDate = cell.dataset.slotDate;

    const isCurrentlyUnavailable = store.isTeacherUnavailable(
      teacherId,
      slotDate
    );

    if (this.paintMode === "add" && !isCurrentlyUnavailable) {
      this.removeTeacherFromRunsInSlot(teacherId, slotDate);
      store.toggleTeacherAvailabilityForSlot(teacherId, slotDate);
    } else if (this.paintMode === "remove" && isCurrentlyUnavailable) {
      store.toggleTeacherAvailabilityForSlot(teacherId, slotDate);
    }
  }

  handlePaintEnd() {
    this._isMouseDown = false;
    this.paintMode = null;
  }
}

customElements.define("teacher-availability-tab", TeacherAvailabilityTab);
