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
    :host {
      display: block;
    }

    .panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1.5rem;
      overflow-x: auto;
    }

    .paint-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .legend {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-box {
      width: 20px;
      height: 20px;
      border-radius: 3px;
      border: 1px solid #ddd;
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
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      min-width: 80px;
    }

    .teacher-timeline-table th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 0.85rem;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .teacher-timeline-table tbody tr:first-child td {
      text-align: left;
      font-weight: 500;
      background: #fafafa;
      position: sticky;
      left: 0;
      z-index: 1;
    }

    .teacher-cell {
      min-height: 40px;
      padding: 4px;
      cursor: pointer;
      border-radius: 2px;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .teacher-cell.has-course {
      background: #4dabf7;
      color: white;
    }

    .teacher-cell.assigned-course {
      background: #4caf50;
      color: white;
      font-weight: 600;
    }

    .teacher-cell.unavailable {
      background: #ff6b6b;
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
      return html`<div class="panel">
        <henry-text variant="heading-3">Lärartillgänglighet</henry-text>
        <p>Inga tidsluckor tillgängliga.</p>
      </div>`;
    }

    // Get unique slot start dates, sorted chronologically
    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();

    return html`
      <div class="panel">
        <henry-text variant="heading-3">Lärartillgänglighet</henry-text>
        <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
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
                <span style="color: #666; font-size: 0.85rem;">
                  Klicka eller dra över celler för att markera/avmarkera. Klicka
                  på knappen igen för att avsluta.
                </span>
              `
            : ""}
        </div>

        <div class="legend">
          <div class="legend-item">
            <div class="legend-box" style="background: #4caf50;"></div>
            <span>Tilldelad kurs</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #4dabf7;"></div>
            <span>Kompatibel kurs (ej tilldelad)</span>
          </div>
          <div class="legend-item">
            <div class="legend-box" style="background: #ff6b6b;"></div>
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
    `;
  }

  renderTeacherTimelineRow(teacher, slotDates) {
    return html`
      <tr>
        <td>
          ${teacher.name}<br /><small style="color: #666;"
            >${teacher.home_department}</small
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

customElements.define(
  "teacher-availability-tab",
  TeacherAvailabilityTab
);
