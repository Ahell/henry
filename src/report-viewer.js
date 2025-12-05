import { LitElement, html, css } from "lit";
import { store } from "./store.js";

export class ReportViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    .tabs {
      display: flex;
      border-bottom: 2px solid #ddd;
      margin-bottom: 1.5rem;
    }

    .tab-button {
      background: none;
      border: none;
      padding: 1rem;
      cursor: pointer;
      color: #666;
      font-size: 1rem;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }

    .tab-button.active {
      color: #007bff;
      border-bottom-color: #007bff;
      background: #f9f9f9;
    }

    .tab-button:hover {
      color: #007bff;
    }

    .panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1.5rem;
      overflow-x: auto;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .panel-header h3 {
      margin: 0;
    }

    .warning-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .warning-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f44336;
      color: white;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
      animation: pulse-pill 1.5s infinite;
    }

    .warning-pill .cohort-name {
      font-weight: 600;
    }

    @keyframes pulse-pill {
      0%,
      100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.02);
      }
    }

    h3 {
      margin-top: 0;
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    th,
    td {
      border: 1px solid #ddd;
      padding: 0.75rem;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: bold;
    }

    tr:hover {
      background: #f9f9f9;
    }

    .gantt-container {
      display: flex;
      flex-direction: column;
    }

    .gantt-scroll-wrapper {
      overflow-x: auto;
      overflow-y: auto;
      max-height: calc(100vh - 220px);
      padding-bottom: 15px;
    }

    .gantt-table {
      border-collapse: collapse;
      min-width: 100%;
    }

    .gantt-table th,
    .gantt-table td {
      border: 1px solid #ddd;
      padding: 0;
      min-width: 100px;
      width: 100px;
      height: 44px;
      text-align: center;
      vertical-align: middle;
    }

    .gantt-table th {
      background: #e9ecef;
      font-size: 0.7rem;
      font-weight: bold;
      padding: 0.3rem 0.2rem;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .gantt-table th.cohort-header {
      min-width: 70px;
      width: 70px;
      text-align: left;
      padding-left: 0.4rem;
      position: sticky;
      background: #e9ecef;
      z-index: 20;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .gantt-table th.cohort-header:first-child {
      left: 0;
      min-width: 180px;
      width: 180px;
    }

    .gantt-table th.cohort-header:nth-child(2) {
      left: 180px;
    }

    .gantt-table td.depot-cell {
      min-width: 180px;
      width: 180px;
      max-width: 180px;
      background: #f8f9fa;
      position: sticky;
      left: 0;
      z-index: 5;
      vertical-align: top;
      padding: 3px;
    }

    .gantt-table td.cohort-cell {
      min-width: 70px;
      width: 70px;
      text-align: left;
      padding-left: 0.4rem;
      font-weight: bold;
      font-size: 0.75rem;
      background: #f9f9f9;
      position: sticky;
      left: 180px;
      z-index: 5;
    }

    .gantt-table td.slot-cell {
      background: #fafafa;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
      overflow: visible;
      min-width: 85px;
      width: 85px;
    }

    .gantt-table td.slot-cell:hover {
      background: #e3f2fd;
    }

    .gantt-table td.slot-cell.drag-over {
      background: #bbdefb;
      box-shadow: inset 0 0 0 2px #2196f3;
    }

    .gantt-table td.slot-cell.drag-over-invalid {
      background: #ffcdd2;
      box-shadow: inset 0 0 0 2px #f44336;
    }

    .gantt-table td.slot-cell.no-teachers-available {
      background: #ffcdd2 !important;
      box-shadow: inset 0 0 0 2px #f44336;
    }

    .available-teachers-overlay {
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      font-size: 0.45rem;
      padding: 2px 3px;
      border-radius: 3px;
      z-index: 10;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 1px;
      line-height: 1.2;
    }

    .inline-teacher-select {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      border: 2px solid #4caf50;
      border-radius: 4px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      min-width: 120px;
      overflow: visible;
    }

    .inline-teacher-select .course-header {
      font-size: 0.5rem;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 1px solid #eee;
    }

    .inline-teacher-select .teacher-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 150px;
      overflow-y: auto;
    }

    .inline-teacher-select .teacher-option {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.55rem;
      cursor: pointer;
      padding: 2px;
      border-radius: 2px;
    }

    .inline-teacher-select .teacher-option:hover {
      background: #e8f5e9;
    }

    .inline-teacher-select .teacher-option input {
      width: 12px;
      height: 12px;
      margin: 0;
    }

    .inline-teacher-select .teacher-option label {
      cursor: pointer;
      flex: 1;
    }

    .inline-teacher-select .select-buttons {
      display: flex;
      gap: 4px;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #eee;
    }

    .inline-teacher-select .select-buttons button {
      flex: 1;
      padding: 3px 6px;
      font-size: 0.5rem;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }

    .inline-teacher-select .select-buttons .btn-ok {
      background: #4caf50;
      color: white;
    }

    .inline-teacher-select .select-buttons .btn-cancel {
      background: #f5f5f5;
      color: #333;
    }

    .no-teachers-message {
      color: #f44336;
      padding: 1rem;
      text-align: center;
    }

    .gantt-table td.slot-cell.disabled-slot {
      background: #e0e0e0;
      cursor: not-allowed;
      opacity: 0.5;
    }

    .gantt-table td.slot-cell.disabled-slot:hover {
      background: #e0e0e0;
    }

    .gantt-table td.slot-cell.cohort-start-slot {
      position: relative;
    }

    .cohort-start-marker {
      position: absolute;
      top: 2px;
      left: 2px;
      background: #2196f3;
      color: white;
      font-size: 0.5rem;
      padding: 1px 3px;
      border-radius: 2px;
      font-weight: bold;
      z-index: 1;
    }

    .gantt-block {
      margin: 1px;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.6rem;
      color: white;
      font-weight: bold;
      cursor: grab;
      overflow: hidden;
      user-select: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 1.1;
      position: relative;
      z-index: 2;
    }

    .gantt-block.second-block {
      opacity: 0.85;
    }

    .gantt-block .block-label {
      font-size: 0.5rem;
      opacity: 0.7;
    }

    .gantt-block .course-code {
      font-weight: bold;
      font-size: 0.6rem;
    }

    .gantt-block .course-name {
      font-size: 0.55rem;
      font-weight: normal;
      opacity: 0.9;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gantt-block:active {
      cursor: grabbing;
    }

    .gantt-block.dragging {
      opacity: 0.5;
    }

    .gantt-block:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    /* Kurs saknar sin spärrkurs - röd varning */
    .gantt-block.missing-prerequisite {
      border: 3px solid #f44336 !important;
      animation: pulse-warning 1s infinite;
      box-shadow: 0 0 10px rgba(244, 67, 54, 0.6);
    }

    @keyframes pulse-warning {
      0%,
      100% {
        box-shadow: 0 0 10px rgba(244, 67, 54, 0.6);
      }
      50% {
        box-shadow: 0 0 20px rgba(244, 67, 54, 0.9);
      }
    }

    /* Kurser med spärrkurser (prerequisites) - lila nyans */
    .prerequisite-course {
      /* Color set via inline style based on number of prerequisites */
      color: #fff;
    }

    /* Behåll law-course klasser för bakåtkompatibilitet */
    .law-course {
      background: #9c88ff;
    }

    .law-course.law-order-1 {
      background: #2d1b4e;
    }

    .law-course.law-order-2 {
      background: #4a2c7a;
    }

    .law-course.law-order-3 {
      background: #6f42c1;
    }

    .law-course.law-order-rest {
      background: #9c88ff;
    }

    .normal-course {
      background: #007bff;
    }

    .two-block-course {
      border: 2px dashed rgba(255, 255, 255, 0.7);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
    }

    /* Summary footer */
    .gantt-table tfoot td {
      background: #e9ecef;
      vertical-align: top;
      padding: 4px;
      border-top: 2px solid #dee2e6;
    }

    .gantt-table tfoot td.summary-label {
      font-weight: bold;
      font-size: 0.75rem;
      text-align: right;
      padding-right: 8px;
    }

    .summary-course {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 0.6rem;
      color: white;
      margin-bottom: 4px;
    }

    .summary-course .course-header {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .summary-course .course-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: bold;
    }

    .summary-course .participant-count {
      font-weight: bold;
      background: rgba(255, 255, 255, 0.3);
      padding: 1px 4px;
      border-radius: 2px;
    }

    .summary-course .summary-teacher-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 3px;
      padding: 4px;
    }

    .summary-course .summary-teacher-row {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.55rem;
      color: #333;
      padding: 2px 4px;
      border-radius: 3px;
      cursor: pointer;
      transition: background 0.1s;
    }

    .summary-course .summary-teacher-row:hover {
      background: #e0e0e0;
    }

    .summary-course .summary-teacher-row input {
      width: 12px;
      height: 12px;
      margin: 0;
      accent-color: #4caf50;
      cursor: pointer;
    }

    .summary-course .summary-teacher-row label {
      cursor: pointer;
      flex: 1;
    }

    .summary-course .summary-teacher-row.assigned {
      background: #c8e6c9;
      font-weight: 600;
      color: #2e7d32;
    }

    .summary-course .summary-teacher-row.assigned:hover {
      background: #a5d6a7;
    }

    .cohort-depot-content {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      align-content: flex-start;
      min-height: 20px;
    }

    .depot-cell.drag-over {
      background: #fff3cd !important;
      box-shadow: inset 0 0 0 2px #ffc107;
    }

    .depot-empty {
      color: #28a745;
      font-size: 0.75rem;
      font-weight: bold;
      padding: 4px;
    }

    .depot-block {
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.6rem;
      color: white;
      cursor: grab;
      user-select: none;
      text-align: left;
      min-width: 80px;
      max-width: 170px;
    }

    .depot-block:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .depot-block:active {
      cursor: grabbing;
    }

    .depot-block.dragging {
      opacity: 0.5;
    }

    .depot-block .course-code {
      font-weight: bold;
      display: inline;
      margin-right: 4px;
    }

    .depot-block .course-name {
      font-size: 0.55rem;
      opacity: 0.85;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .filters {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #555;
      font-size: 0.9rem;
    }

    select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .legend {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .legend-box {
      width: 24px;
      height: 24px;
      border-radius: 2px;
    }

    /* Teacher timeline styles */
    .teacher-timeline-container {
      overflow-x: auto;
      overflow-y: auto;
      max-height: calc(100vh - 280px);
    }

    .teacher-timeline-table {
      border-collapse: collapse;
      min-width: 100%;
    }

    .teacher-timeline-table th,
    .teacher-timeline-table td {
      border: 1px solid #ddd;
      padding: 0;
      min-width: 90px;
      width: 90px;
      height: 40px;
      text-align: center;
      vertical-align: middle;
    }

    .teacher-timeline-table th {
      background: #f5f5f5;
      font-weight: bold;
      position: sticky;
      top: 0;
      z-index: 10;
      font-size: 0.75rem;
      padding: 4px;
    }

    .teacher-timeline-table th:first-child {
      position: sticky;
      left: 0;
      z-index: 20;
      background: #f5f5f5;
      min-width: 150px;
      width: 150px;
    }

    .teacher-timeline-table td:first-child {
      position: sticky;
      left: 0;
      z-index: 5;
      background: #fff;
      font-weight: 500;
      min-width: 150px;
      width: 150px;
      text-align: left;
      padding-left: 8px;
    }

    .teacher-cell {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.1s;
      font-size: 0.7rem;
      padding: 2px;
    }

    .teacher-cell:hover {
      opacity: 0.8;
    }

    .teacher-cell.unavailable {
      background-color: #ff6b6b;
    }

    .teacher-cell.has-course {
      background-color: #4dabf7;
      color: white;
      font-weight: 500;
    }

    .teacher-cell.assigned-course {
      background-color: #4caf50;
      color: white;
      font-weight: 600;
    }

    .teacher-cell.has-course.unavailable {
      background: repeating-linear-gradient(
        45deg,
        #ff6b6b,
        #ff6b6b 5px,
        #4dabf7 5px,
        #4dabf7 10px
      );
    }

    .painting-active {
      cursor: crosshair !important;
    }

    .paint-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .paint-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .paint-btn.active {
      border-color: #ff6b6b;
      background: #ff6b6b;
      color: white;
    }

    .paint-btn:hover:not(.active) {
      border-color: #999;
    }
  `;

  static properties = {
    activeTab: { type: String },
    filterYear: { type: String },
    filterTeacher: { type: String },
    filterCohort: { type: String },
    isPainting: { type: Boolean },
    paintMode: { type: String },
  };

  constructor() {
    super();
    this.activeTab = "department";
    this.filterYear = "";
    this.filterTeacher = "";
    this.filterCohort = "";
    this.isPainting = false;
    this.paintMode = null; // 'add' or 'remove'

    store.subscribe(() => this.requestUpdate());
  }

  render() {
    return html`
      <div class="tabs">
        <button
          class="tab-button ${this.activeTab === "department" ? "active" : ""}"
          @click="${() => (this.activeTab = "department")}"
        >
          Avdelningschef-vy
        </button>
        <button
          class="tab-button ${this.activeTab === "teacher" ? "active" : ""}"
          @click="${() => (this.activeTab = "teacher")}"
        >
          Lärar-vy
        </button>
        <button
          class="tab-button ${this.activeTab === "cohort" ? "active" : ""}"
          @click="${() => (this.activeTab = "cohort")}"
        >
          Kull-vy
        </button>
        <button
          class="tab-button ${this.activeTab === "gantt" ? "active" : ""}"
          @click="${() => (this.activeTab = "gantt")}"
        >
          Gantt (Planeringsöversikt)
        </button>
      </div>

      ${this.activeTab === "department" ? this.renderDepartmentView() : ""}
      ${this.activeTab === "teacher" ? this.renderTeacherView() : ""}
      ${this.activeTab === "cohort" ? this.renderCohortView() : ""}
      ${this.activeTab === "gantt" ? this.renderGanttView() : ""}
    `;
  }

  renderDepartmentView() {
    const runs = store.getCourseRuns().sort((a, b) => {
      const slotA = store.getSlot(a.slot_id);
      const slotB = store.getSlot(b.slot_id);
      return new Date(slotA.start_date) - new Date(slotB.start_date);
    });

    return html`
      <div class="panel">
        <h3>Bemanning per År/Termin</h3>
        <div class="filters">
          <div class="filter-row">
            <div>
              <label>År</label>
              <select @change="${(e) => (this.filterYear = e.target.value)}">
                <option value="">Alla år</option>
                ${this.getYears().map(
                  (year) => html` <option value="${year}">${year}</option> `
                )}
              </select>
            </div>
            <div>
              <label>Avdelning</label>
              <select>
                <option value="">Alla avdelningar</option>
                ${this.getDepartments().map(
                  (dept) => html` <option value="${dept}">${dept}</option> `
                )}
              </select>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Kod</th>
              <th>Namn</th>
              <th>Examinator</th>
              <th>Kursansvarig</th>
              <th>Start</th>
              <th>Slut</th>
              <th>Termin</th>
              <th>År</th>
              <th>Kullar</th>
              <th>Studenter</th>
            </tr>
          </thead>
          <tbody>
            ${runs.map((run) => this.renderDepartmentRow(run))}
          </tbody>
        </table>
      </div>
    `;
  }

  renderDepartmentRow(run) {
    const course = store.getCourse(run.course_id);
    const teacher = store.getTeacher(run.teacher_id);
    const slot = store.getSlot(run.slot_id);
    const cohortNames = run.cohorts
      .map((id) => store.getCohort(id)?.name)
      .filter(Boolean)
      .join(", ");

    const startDate = new Date(slot.start_date);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const term = month < 7 ? "VT" : "HT";

    if (this.filterYear && year.toString() !== this.filterYear) {
      return "";
    }

    return html`
      <tr>
        <td>${course?.code}</td>
        <td>${course?.name}</td>
        <td>${teacher?.name}</td>
        <td>${teacher?.name}</td>
        <td>${slot.start_date}</td>
        <td>${slot.end_date}</td>
        <td>${term} ${month}</td>
        <td>${year}</td>
        <td>${cohortNames}</td>
        <td>${run.planned_students}</td>
      </tr>
    `;
  }

  renderTeacherView() {
    const slots = store.getSlots();
    const teachers = store.getTeachers();

    if (slots.length === 0) {
      return html`<div class="panel">
        <h3>Lärartillgänglighet</h3>
        <p>Inga tidsluckor tillgängliga.</p>
      </div>`;
    }

    // Get unique slot start dates, sorted chronologically (same as Gantt view)
    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();

    return html`
      <div class="panel">
        <h3>Lärartillgänglighet</h3>
        <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
          Klicka på "Markera upptagen" och måla sedan i cellerna för att markera
          när en lärare är upptagen. Blå celler visar schemalagda kurser.
        </p>

        <div class="paint-controls">
          <button
            class="paint-btn ${this.isPainting ? "active" : ""}"
            @click="${this.togglePaintMode}"
          >
            ${this.isPainting ? "✓ Målningsläge aktivt" : "🖌️ Markera upptagen"}
          </button>
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
    // Check if teacher has a course scheduled on this slot
    const slot = store.getSlots().find((s) => s.start_date === slotDate);

    // Get courses the teacher is compatible with
    const compatibleCourseIds = teacher.compatible_courses || [];

    // Find course runs for this slot that the teacher is compatible with
    const compatibleRuns = slot
      ? store
          .getCourseRuns()
          .filter(
            (r) =>
              r.slot_id === slot.slot_id &&
              compatibleCourseIds.includes(r.course_id)
          )
      : [];

    // Check if teacher is actually assigned to any run in this slot
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

    // Check if teacher is marked as unavailable
    const isUnavailable = store.isTeacherUnavailable(
      teacher.teacher_id,
      slotDate
    );

    let cellClass = "teacher-cell";
    let content = "";
    let titleText = "";

    if (isAssigned) {
      // Teacher is assigned to a course - show green
      cellClass += " assigned-course";
      const courseCodes = assignedRuns
        .map((run) => {
          const course = store.getCourse(run.course_id);
          return course?.code;
        })
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
      // Show course codes for compatible courses
      const courseCodes = compatibleRuns
        .map((run) => {
          const course = store.getCourse(run.course_id);
          return course?.code;
        })
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
    // Find the slot
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return;

    // Remove teacher from all runs in this slot
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

    // Determine paint mode based on current state
    const isCurrentlyUnavailable = store.isTeacherUnavailable(
      teacherId,
      slotDate
    );
    this.paintMode = isCurrentlyUnavailable ? "remove" : "add";

    // If marking as unavailable, also remove from any assigned courses
    if (this.paintMode === "add") {
      this.removeTeacherFromRunsInSlot(teacherId, slotDate);
    }

    // Toggle this cell
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

    // Apply paint based on mode
    if (this.paintMode === "add" && !isCurrentlyUnavailable) {
      // Remove teacher from assigned courses before marking unavailable
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

  // Show available teachers for a course in all slot cells for a cohort
  showAvailableTeachersForDrag(cohortId, courseId) {
    // Find all compatible teachers for this course
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) => teacher.compatible_courses?.includes(courseId));

    // Get all slot cells for this cohort
    const cells = this.shadowRoot.querySelectorAll(
      `.slot-cell[data-cohort-id="${cohortId}"]`
    );

    cells.forEach((cell) => {
      const slotDate = cell.dataset.slotDate;
      if (!slotDate || cell.dataset.disabled === "true") return;

      // Check if this course already exists in this slot (for any cohort)
      // If so, teachers assigned to it are also available (co-teaching/samläsning)
      const slot = store.getSlots().find((s) => s.start_date === slotDate);
      const existingRunsForCourse = slot
        ? store
            .getCourseRuns()
            .filter(
              (r) => r.slot_id === slot.slot_id && r.course_id === courseId
            )
        : [];
      const teachersAlreadyTeachingThisCourse = new Set();
      existingRunsForCourse.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) =>
            teachersAlreadyTeachingThisCourse.add(tid)
          );
        }
      });

      // Filter teachers that are available on this date OR already teaching this course
      const availableTeachers = compatibleTeachers.filter((teacher) => {
        const isAlreadyTeachingThisCourse =
          teachersAlreadyTeachingThisCourse.has(teacher.teacher_id);
        const isUnavailable = store.isTeacherUnavailable(
          teacher.teacher_id,
          slotDate
        );
        return isAlreadyTeachingThisCourse || !isUnavailable;
      });

      if (availableTeachers.length === 0) {
        // No teachers available - mark cell as invalid
        cell.classList.add("no-teachers-available");
      } else {
        // Show available teacher names in vertical list
        const overlay = document.createElement("div");
        overlay.className = "available-teachers-overlay";
        // Show first name only, one per line
        availableTeachers.forEach((t) => {
          const span = document.createElement("span");
          span.textContent = t.name.split(" ")[0];
          overlay.appendChild(span);
        });
        overlay.title = availableTeachers.map((t) => t.name).join("\n");
        cell.appendChild(overlay);
      }
    });
  }

  // Show available teachers for all cohorts (used when dragging for co-teaching)
  showAvailableTeachersForDragAllCohorts(courseId) {
    // Find all compatible teachers for this course
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) => teacher.compatible_courses?.includes(courseId));

    // Get all slot cells (for all cohorts)
    const cells = this.shadowRoot.querySelectorAll(".slot-cell");

    cells.forEach((cell) => {
      const slotDate = cell.dataset.slotDate;
      if (!slotDate || cell.dataset.disabled === "true") return;

      // Check if this course already exists in this slot (for any cohort)
      const slot = store.getSlots().find((s) => s.start_date === slotDate);
      const existingRunsForCourse = slot
        ? store
            .getCourseRuns()
            .filter(
              (r) => r.slot_id === slot.slot_id && r.course_id === courseId
            )
        : [];
      const teachersAlreadyTeachingThisCourse = new Set();
      existingRunsForCourse.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) =>
            teachersAlreadyTeachingThisCourse.add(tid)
          );
        }
      });

      // Filter teachers that are available on this date OR already teaching this course
      const availableTeachers = compatibleTeachers.filter((teacher) => {
        const isAlreadyTeachingThisCourse =
          teachersAlreadyTeachingThisCourse.has(teacher.teacher_id);
        const isUnavailable = store.isTeacherUnavailable(
          teacher.teacher_id,
          slotDate
        );
        return isAlreadyTeachingThisCourse || !isUnavailable;
      });

      if (availableTeachers.length === 0) {
        cell.classList.add("no-teachers-available");
      } else {
        const overlay = document.createElement("div");
        overlay.className = "available-teachers-overlay";
        availableTeachers.forEach((t) => {
          const span = document.createElement("span");
          span.textContent = t.name.split(" ")[0];
          overlay.appendChild(span);
        });
        overlay.title = availableTeachers.map((t) => t.name).join("\n");
        cell.appendChild(overlay);
      }
    });
  }

  // Clear all teacher overlays and classes
  clearAvailableTeachersOverlays() {
    this.shadowRoot
      .querySelectorAll(".available-teachers-overlay")
      .forEach((el) => {
        el.remove();
      });
    this.shadowRoot.querySelectorAll(".no-teachers-available").forEach((el) => {
      el.classList.remove("no-teachers-available");
    });
  }

  renderCohortView() {
    return html`
      <div class="panel">
        <h3>Kull-vy: 14-kurser per kull</h3>
        <div class="filters">
          <div class="filter-row">
            <div>
              <label>Kull</label>
              <select @change="${(e) => (this.filterCohort = e.target.value)}">
                <option value="">Välj kull</option>
                ${store
                  .getCohorts()
                  .map(
                    (c) => html`
                      <option value="${c.cohort_id}">${c.name}</option>
                    `
                  )}
              </select>
            </div>
          </div>
        </div>

        ${this.filterCohort ? this.renderCohortDetail() : ""}
      </div>
    `;
  }

  renderCohortDetail() {
    const cohort = store.getCohort(parseInt(this.filterCohort));
    if (!cohort) return "";

    const runs = store
      .getCourseRuns()
      .filter((r) => r.cohorts.includes(cohort.cohort_id))
      .sort((a, b) => {
        const slotA = store.getSlot(a.slot_id);
        const slotB = store.getSlot(b.slot_id);
        return new Date(slotA.start_date) - new Date(slotB.start_date);
      });

    return html`
      <div style="margin-top: 1rem;">
        <h4>${cohort.name} (${cohort.planned_size} studenter)</h4>
        <p>Kurssekvens (${runs.length} av 14 kurser planerade):</p>
        <table>
          <thead>
            <tr>
              <th>Ordning</th>
              <th>Kurs</th>
              <th>Startdatum</th>
              <th>Slutdatum</th>
              <th>Lärare</th>
              <th>Spärrkurser</th>
            </tr>
          </thead>
          <tbody>
            ${runs.map(
              (run, index) => html`
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    ${store.getCourse(run.course_id)?.code} -
                    ${store.getCourse(run.course_id)?.name}
                  </td>
                  <td>${store.getSlot(run.slot_id).start_date}</td>
                  <td>${store.getSlot(run.slot_id).end_date}</td>
                  <td>${store.getTeacher(run.teacher_id)?.name}</td>
                  <td>${this.getPrerequisiteNames(run.course_id)}</td>
                </tr>
              `
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  renderWarningPills() {
    const problems = store.prerequisiteProblems || [];
    if (problems.length === 0) {
      return html``;
    }

    // Group problems by cohort
    const problemsByCohort = new Map();
    for (const p of problems) {
      if (!problemsByCohort.has(p.cohortId)) {
        problemsByCohort.set(p.cohortId, {
          cohortName: p.cohortName,
          count: 0,
          courses: new Set(),
        });
      }
      const cohortData = problemsByCohort.get(p.cohortId);
      cohortData.courses.add(p.courseCode);
      cohortData.count = cohortData.courses.size;
    }

    return html`
      <div class="warning-pills">
        ${Array.from(problemsByCohort.entries()).map(
          ([cohortId, data]) => html`
            <div
              class="warning-pill"
              title="${data.count} kurs(er) saknar spärrkurs: ${Array.from(
                data.courses
              ).join(", ")}"
            >
              <span>⚠️</span>
              <span class="cohort-name">${data.cohortName}</span>
              <span>(${data.count})</span>
            </div>
          `
        )}
      </div>
    `;
  }

  renderGanttView() {
    const cohorts = store.getCohorts();
    const slots = store.getSlots();

    if (slots.length === 0) {
      return html`<div class="panel">
        <h3>Gantt-vy</h3>
        <p>Inga slots tillgängliga.</p>
      </div>`;
    }

    // Get unique slot start dates, sorted chronologically
    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();

    return html`
      <div class="panel">
        <div class="panel-header">
          <h3>Gantt-vy: Planeringsöversikt</h3>
          ${this.renderWarningPills()}
        </div>
        <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
          Dra kurser från kullens depå till schemat. Kurser försvinner från
          depån när de schemaläggs.
        </p>

        <div class="legend">
          <div class="legend-item">
            <div class="legend-box law-course law-order-1"></div>
            <span>1. JÖK</span>
          </div>
          <div class="legend-item">
            <div class="legend-box law-course law-order-2"></div>
            <span>2. Allmän fast.rätt</span>
          </div>
          <div class="legend-item">
            <div class="legend-box law-course law-order-3"></div>
            <span>3. Speciell fast.rätt</span>
          </div>
          <div class="legend-item">
            <div class="legend-box law-course law-order-rest"></div>
            <span>Övrig juridik</span>
          </div>
          <div class="legend-item">
            <div class="legend-box normal-course"></div>
            <span>Vanlig kurs</span>
          </div>
          <div class="legend-item">
            <div class="legend-box normal-course two-block-course"></div>
            <span>2-block (streckad)</span>
          </div>
        </div>

        <div class="gantt-scroll-wrapper">
          <table class="gantt-table">
            <thead>
              <tr>
                <th class="cohort-header">Depå</th>
                <th class="cohort-header">Kull</th>
                ${slotDates.map((dateStr) => {
                  const date = new Date(dateStr);
                  const formatted = `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                  ).padStart(2, "0")}-${String(date.getDate()).padStart(
                    2,
                    "0"
                  )}`;
                  return html`<th>${formatted}</th>`;
                })}
              </tr>
            </thead>
            <tbody>
              ${cohorts.map((cohort) =>
                this.renderGanttTableRow(cohort, slotDates)
              )}
            </tbody>
            <tfoot>
              ${this.renderSummaryRow(slotDates)}
            </tfoot>
          </table>
        </div>
      </div>
    `;
  }

  renderSummaryRow(slotDates) {
    // For each slot date, calculate total participants per course
    return html`
      <tr>
        <td class="summary-label" colspan="2">Kurser & Lärare:</td>
        ${slotDates.map((dateStr) => {
          const courseSummary = this.getCourseSummaryForSlot(dateStr);
          return html`
            <td>
              ${courseSummary.map((item) => {
                const course = item.course;
                const bgColor = this.getCourseColor(course);
                const runs = item.runs;
                const assignedTeachers = item.assignedTeachers;
                const availableTeachers = item.availableTeachers;

                return html`
                  <div
                    class="summary-course"
                    style="background-color: ${bgColor};"
                  >
                    <div class="course-header">
                      <span class="course-name" title="${course.name}"
                        >${course.code}</span
                      >
                      <span class="participant-count"
                        >${item.totalParticipants} st</span
                      >
                    </div>
                    ${availableTeachers.length > 0
                      ? html`
                          <div class="summary-teacher-list">
                            ${availableTeachers.map(
                              (teacher) => html`
                                <div
                                  class="summary-teacher-row ${assignedTeachers.includes(
                                    teacher.teacher_id
                                  )
                                    ? "assigned"
                                    : ""}"
                                >
                                  <input
                                    type="checkbox"
                                    id="summary-${dateStr}-${course.course_id}-${teacher.teacher_id}"
                                    .checked="${assignedTeachers.includes(
                                      teacher.teacher_id
                                    )}"
                                    @change="${(e) =>
                                      this.handleSummaryTeacherToggle(
                                        runs,
                                        teacher.teacher_id,
                                        e.target.checked,
                                        dateStr
                                      )}"
                                  />
                                  <label
                                    for="summary-${dateStr}-${course.course_id}-${teacher.teacher_id}"
                                  >
                                    ${teacher.name}
                                  </label>
                                </div>
                              `
                            )}
                          </div>
                        `
                      : ""}
                  </div>
                `;
              })}
            </td>
          `;
        })}
      </tr>
    `;
  }

  getCourseSummaryForSlot(slotDate) {
    // Find all runs for this slot date
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return [];

    const runs = store
      .getCourseRuns()
      .filter((r) => r.slot_id === slot.slot_id);

    // Group by course and sum participants
    const courseMap = new Map();

    for (const run of runs) {
      const course = store.getCourse(run.course_id);
      if (!course) continue;

      // Calculate total participants from cohorts
      let totalParticipants = 0;
      if (run.cohorts && run.cohorts.length > 0) {
        for (const cohortId of run.cohorts) {
          const cohort = store
            .getCohorts()
            .find((c) => c.cohort_id === cohortId);
          if (cohort) {
            totalParticipants += cohort.planned_size || 0;
          }
        }
      }

      if (!courseMap.has(course.course_id)) {
        courseMap.set(course.course_id, {
          course,
          totalParticipants: 0,
          runs: [],
          assignedTeachers: new Set(),
        });
      }

      const entry = courseMap.get(course.course_id);
      entry.totalParticipants += totalParticipants;
      entry.runs.push(run);

      // Collect assigned teachers from this run
      if (run.teachers && run.teachers.length > 0) {
        run.teachers.forEach((tid) => entry.assignedTeachers.add(tid));
      }
    }

    // Convert to array, add available teachers, and sort
    return Array.from(courseMap.values())
      .map((entry) => {
        // Find teachers compatible with this course
        const teachers = store.getTeachers();
        const assignedTeacherIds = Array.from(entry.assignedTeachers);

        // Filter to compatible teachers who are either:
        // 1. Already assigned to THIS course, OR
        // 2. Not marked as unavailable for this slot
        const availableTeachers = teachers.filter((t) => {
          if (
            !t.compatible_courses ||
            !t.compatible_courses.includes(entry.course.course_id)
          ) {
            return false;
          }
          const isAssignedToThisCourse = assignedTeacherIds.includes(
            t.teacher_id
          );
          const isUnavailable = store.isTeacherUnavailable(
            t.teacher_id,
            slotDate
          );
          return isAssignedToThisCourse || !isUnavailable;
        });

        return {
          course: entry.course,
          totalParticipants: entry.totalParticipants,
          runs: entry.runs,
          assignedTeachers: assignedTeacherIds,
          availableTeachers,
        };
      })
      .sort((a, b) => {
        const aHasPrereqs = this.hasPrerequisites(a.course.course_id);
        const bHasPrereqs = this.hasPrerequisites(b.course.course_id);
        if (aHasPrereqs && !bHasPrereqs) return -1;
        if (!aHasPrereqs && bHasPrereqs) return 1;
        return a.course.name.localeCompare(b.course.name);
      });
  }

  renderCohortDepot(cohort, scheduledCourseIds) {
    const courses = store.getCourses();

    // Filter out already scheduled courses
    const availableCourses = courses.filter(
      (c) => !scheduledCourseIds.has(c.course_id)
    );

    // Sort courses: those with prerequisites first, then by number of prerequisites, then by name
    const sortedCourses = availableCourses.sort((a, b) => {
      const aPrereqs = this.getAllPrerequisites(a.course_id);
      const bPrereqs = this.getAllPrerequisites(b.course_id);
      const aHasPrereqs = aPrereqs.length > 0;
      const bHasPrereqs = bPrereqs.length > 0;

      // Courses with prerequisites come first
      if (aHasPrereqs && !bHasPrereqs) return -1;
      if (!aHasPrereqs && bHasPrereqs) return 1;

      // Among courses with prerequisites, sort by number of prereqs (fewer first = more "fundamental")
      if (aHasPrereqs && bHasPrereqs) {
        if (aPrereqs.length !== bPrereqs.length) {
          return aPrereqs.length - bPrereqs.length;
        }
      }

      return a.name.localeCompare(b.name);
    });

    if (availableCourses.length === 0) {
      return html`<div class="depot-empty">✓ Alla kurser schemalagda</div>`;
    }

    return html`
      <div class="cohort-depot-content">
        ${sortedCourses.map((course) => {
          const hasPrereqs = this.hasPrerequisites(course.course_id);
          const blockClass =
            course.default_block_length === 2
              ? hasPrereqs
                ? "prerequisite-course two-block-course"
                : "normal-course two-block-course"
              : hasPrereqs
              ? "prerequisite-course"
              : "normal-course";
          return this.renderDepotBlock(course, blockClass, cohort.cohort_id);
        })}
      </div>
    `;
  }

  renderDepotBlock(course, blockClass, cohortId) {
    const shortName = this.shortenCourseName(course.name);

    // Apply course color
    const bgColor = this.getCourseColor(course);
    const inlineStyle = `background-color: ${bgColor};`;

    return html`
      <div
        class="depot-block ${blockClass}"
        style="${inlineStyle}"
        draggable="true"
        data-course-id="${course.course_id}"
        data-cohort-id="${cohortId}"
        data-from-depot="true"
        title="${course.code}: ${course.name}${this.hasPrerequisites(
          course.course_id
        )
          ? "\nSpärrkurser: " + this.getPrerequisiteNames(course.course_id)
          : ""}"
        @dragstart="${this.handleDepotDragStart}"
        @dragend="${this.handleDepotDragEnd}"
      >
        <span class="course-code">${course.code}</span>
        <span class="course-name">${shortName}</span>
      </div>
    `;
  }

  handleDepotDragStart(e) {
    const courseId = e.target.dataset.courseId;
    const cohortId = e.target.dataset.cohortId;
    const course = store.getCourse(parseInt(courseId));
    const isTwoBlock = course?.default_block_length === 2;

    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        courseId,
        cohortId,
        fromDepot: true,
        isTwoBlock,
      })
    );
    e.dataTransfer.effectAllowed = "copyMove";
    e.target.classList.add("dragging");

    this._draggingTwoBlock = isTwoBlock;
    this._draggingFromDepot = true;
    this._draggingFromCohortId = parseInt(cohortId);
    this._draggingCourseId = parseInt(courseId);

    // Show available teachers in all cells for ALL cohorts (for co-teaching visibility)
    this.showAvailableTeachersForDragAllCohorts(parseInt(courseId));
  }

  handleDepotDragEnd(e) {
    e.target.classList.remove("dragging");
    this._draggingTwoBlock = false;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = null;
    this._draggingCourseId = null;

    // Clear available teachers overlays
    this.clearAvailableTeachersOverlays();

    this.shadowRoot
      .querySelectorAll(
        ".drag-over, .drag-over-invalid, .no-teachers-available"
      )
      .forEach((el) => {
        el.classList.remove(
          "drag-over",
          "drag-over-invalid",
          "no-teachers-available"
        );
      });
  }

  handleDepotDragOver(e) {
    // Only allow dropping scheduled courses (not from depot)
    e.preventDefault();
    if (!this._draggingFromDepot) {
      e.currentTarget.classList.add("drag-over");
    }
  }

  handleDepotDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  handleDepotDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }

    // Only handle drops from the schedule (not from depot)
    if (data.fromDepot) {
      return;
    }

    const runId = parseInt(data.runId);
    const targetCohortId = parseInt(e.currentTarget.dataset.cohortId);

    // Find the run
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (!run) return;

    const course = store.getCourse(run.course_id);

    // Validate: Can this course be removed?
    const validationResult = this.validateCourseRemoval(course, targetCohortId);
    if (!validationResult.valid) {
      alert(validationResult.message);
      return;
    }

    // Remove this cohort from the run
    run.cohorts = run.cohorts.filter((id) => id !== targetCohortId);

    // If no cohorts left, remove the run entirely
    if (run.cohorts.length === 0) {
      const index = store.courseRuns.indexOf(run);
      if (index > -1) {
        store.courseRuns.splice(index, 1);
      }
    }

    store.notify();
    this.requestUpdate();
  }

  isSecondBlockOfJok(targetSlotDate, cohortId) {
    // Find JÖK runs for this cohort
    const jokRuns = store
      .getCourseRuns()
      .filter((r) => r.cohorts && r.cohorts.includes(cohortId))
      .filter((r) => {
        const course = store.getCourse(r.course_id);
        return course?.code === "AI180U"; // JÖK
      });

    if (jokRuns.length === 0) return false;

    // Get all slot dates in order
    const slots = store
      .getSlots()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    for (const run of jokRuns) {
      const jokSlot = store.getSlot(run.slot_id);
      if (!jokSlot) continue;

      const jokCourse = store.getCourse(run.course_id);
      if (jokCourse?.default_block_length !== 2) continue;

      // Find the slot index for JÖK
      const jokSlotIndex = slots.findIndex(
        (s) => s.slot_id === jokSlot.slot_id
      );
      if (jokSlotIndex < 0 || jokSlotIndex >= slots.length - 1) continue;

      // The next slot is the "second block" of JÖK
      const nextSlot = slots[jokSlotIndex + 1];
      if (nextSlot.start_date === targetSlotDate) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if target slot is the second block of a specific 2-block course run
   */
  isSecondBlockOfCourse(targetSlotDate, courseRun, cohortId) {
    const course = store.getCourse(courseRun.course_id);
    if (!course || course.default_block_length !== 2) return false;

    const courseSlot = store.getSlot(courseRun.slot_id);
    if (!courseSlot) return false;

    // Get all slot dates in order
    const slots = store
      .getSlots()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    // Find the slot index for this course
    const courseSlotIndex = slots.findIndex(
      (s) => s.slot_id === courseSlot.slot_id
    );
    if (courseSlotIndex < 0 || courseSlotIndex >= slots.length - 1)
      return false;

    // The next slot is the "second block"
    const nextSlot = slots[courseSlotIndex + 1];
    return nextSlot.start_date === targetSlotDate;
  }

  validateCourseRemoval(course, cohortId) {
    // No validation needed - courses can always be removed from the schedule
    // Dependent courses will show visual warnings (red border) instead
    return { valid: true };
  }

  /**
   * Get all prerequisites for a course, including transitive ones
   */
  getAllPrerequisites(courseId) {
    const course = store.getCourse(courseId);
    if (!course || !course.prerequisites || course.prerequisites.length === 0) {
      return [];
    }

    const allPrereqs = new Set();
    const stack = [...course.prerequisites];

    while (stack.length > 0) {
      const prereqId = stack.pop();
      if (allPrereqs.has(prereqId)) continue;

      allPrereqs.add(prereqId);
      const prereqCourse = store.getCourse(prereqId);
      if (prereqCourse?.prerequisites) {
        prereqCourse.prerequisites.forEach((p) => stack.push(p));
      }
    }

    return Array.from(allPrereqs);
  }

  /**
   * Check if a course has prerequisites
   */
  hasPrerequisites(courseId) {
    const course = store.getCourse(courseId);
    return course?.prerequisites && course.prerequisites.length > 0;
  }

  renderGanttTableRow(cohort, slotDates) {
    // Get course runs for this cohort, indexed by slot start_date
    const runsByDate = {};
    const twoBlockDates = new Set(); // Track which dates are "continuation" of a 2-block course
    const scheduledCourseIds = new Set(); // Track which courses are already scheduled for this cohort

    store
      .getCourseRuns()
      .filter((r) => r.cohorts && r.cohorts.includes(cohort.cohort_id))
      .forEach((run) => {
        const slot = store.getSlot(run.slot_id);
        const course = store.getCourse(run.course_id);

        scheduledCourseIds.add(run.course_id);

        if (slot) {
          if (!runsByDate[slot.start_date]) {
            runsByDate[slot.start_date] = [];
          }
          runsByDate[slot.start_date].push(run);

          // If this is a 2-block course, mark the next slot as continuation
          if (course?.default_block_length === 2) {
            const slotIndex = slotDates.indexOf(slot.start_date);
            if (slotIndex >= 0 && slotIndex < slotDates.length - 1) {
              twoBlockDates.add(slotDates[slotIndex + 1]);
            }
          }
        }
      });

    return html`
      <tr>
        <td
          class="depot-cell"
          data-cohort-id="${cohort.cohort_id}"
          @dragover="${this.handleDepotDragOver}"
          @dragleave="${this.handleDepotDragLeave}"
          @drop="${this.handleDepotDrop}"
        >
          ${this.renderCohortDepot(cohort, scheduledCourseIds)}
        </td>
        <td class="cohort-cell">${cohort.name}</td>
        ${slotDates.map((dateStr, index) => {
          const runs = runsByDate[dateStr] || [];
          const isContinuation = twoBlockDates.has(dateStr);

          // Check if this slot is before the cohort's start date
          const slotDate = new Date(dateStr);
          const cohortStartDate = new Date(cohort.start_date);
          const isBeforeCohortStart = slotDate < cohortStartDate;

          // Check if cohort start date falls within this slot's period
          const nextSlotDate =
            index < slotDates.length - 1
              ? new Date(slotDates[index + 1])
              : null;
          const isCohortStartSlot =
            cohortStartDate >= slotDate &&
            (nextSlotDate === null || cohortStartDate < nextSlotDate);

          // Find 2-block courses that continue into this cell
          let continuationRuns = [];
          if (isContinuation && index > 0) {
            const prevDate = slotDates[index - 1];
            const prevRuns = runsByDate[prevDate] || [];
            continuationRuns = prevRuns.filter((run) => {
              const course = store.getCourse(run.course_id);
              return course?.default_block_length === 2;
            });
          }

          return html`
            <td
              class="slot-cell ${isBeforeCohortStart
                ? "disabled-slot"
                : ""} ${isCohortStartSlot ? "cohort-start-slot" : ""}"
              data-slot-date="${dateStr}"
              data-cohort-id="${cohort.cohort_id}"
              data-disabled="${isBeforeCohortStart}"
              @dragover="${isBeforeCohortStart ? null : this.handleDragOver}"
              @dragleave="${isBeforeCohortStart ? null : this.handleDragLeave}"
              @drop="${isBeforeCohortStart ? null : this.handleDrop}"
            >
              ${isCohortStartSlot
                ? html`<span class="cohort-start-marker"
                    >Start ${cohort.start_date}</span
                  >`
                : ""}
              ${runs.map((run) =>
                this.renderGanttBlockForTable(run, cohort.cohort_id, false)
              )}
              ${continuationRuns.map((run) =>
                this.renderGanttBlockForTable(run, cohort.cohort_id, true)
              )}
            </td>
          `;
        })}
      </tr>
    `;
  }

  renderGanttBlockForTable(run, cohortId, isSecondBlock = false) {
    const course = store.getCourse(run.course_id);
    const isTwoBlock = course?.default_block_length === 2;
    const hasPrereqs = this.hasPrerequisites(course?.course_id);

    let blockClasses = [];
    let inlineStyle = "";

    // Check if this course is missing a prerequisite
    const prerequisiteProblems = store.prerequisiteProblems || [];
    const hasMissingPrereq = prerequisiteProblems.some(
      (p) => p.runId === run.run_id && p.cohortId === cohortId
    );

    // Use course color based on prerequisites
    const bgColor = this.getCourseColor(course);
    inlineStyle = `background-color: ${bgColor};`;

    if (hasMissingPrereq) {
      blockClasses.push("missing-prerequisite");
    } else if (hasPrereqs) {
      blockClasses.push("prerequisite-course");
    } else {
      blockClasses.push("normal-course");
    }
    if (isTwoBlock) blockClasses.push("two-block-course");

    // Shorten course name for display
    const shortName = this.shortenCourseName(course?.name || "");

    // For 2-block courses, show block number
    const blockLabel = isTwoBlock ? (isSecondBlock ? "2/2" : "1/2") : "";

    // Build tooltip with prerequisite info
    let prereqInfo = hasPrereqs
      ? `\nSpärrkurser: ${this.getPrerequisiteNames(course?.course_id)}`
      : "";

    // Add warning about missing prerequisites
    if (hasMissingPrereq) {
      const missingPrereqs = prerequisiteProblems
        .filter((p) => p.runId === run.run_id && p.cohortId === cohortId)
        .map((p) => p.missingPrereqCode);
      prereqInfo += `\n⚠️ SAKNAR SPÄRRKURS: ${missingPrereqs.join(", ")}`;
    }

    return html`
      <div
        class="gantt-block ${blockClasses.join(" ")} ${isSecondBlock
          ? "second-block"
          : ""}"
        style="${inlineStyle}"
        draggable="true"
        data-run-id="${run.run_id}"
        data-cohort-id="${cohortId}"
        data-is-second-block="${isSecondBlock}"
        title="${course?.code}: ${course?.name} ${isTwoBlock
          ? `(15 hp - Block ${isSecondBlock ? "2" : "1"}/2)`
          : ""}${prereqInfo}"
        @dragstart="${this.handleDragStart}"
        @dragend="${this.handleDragEnd}"
      >
        ${hasMissingPrereq ? html`<span class="warning-icon">⚠️</span>` : ""}
        <span class="course-code"
          >${course?.code}${blockLabel ? ` ${blockLabel}` : ""}</span
        >
        <span class="course-name">${shortName}</span>
      </div>
    `;
  }

  getLawOrderClass(course) {
    // Ordning: 1. JÖK (AI180U), 2. Allmän fastighetsrätt (AI192U), 3. Speciell fastighetsrätt (AI182U), resten är valfri
    if (course.code === "AI180U") return "law-order-1"; // Juridisk översiktskurs
    if (course.code === "AI192U") return "law-order-2"; // Allmän fastighetsrätt
    if (course.code === "AI182U") return "law-order-3"; // Speciell fastighetsrätt
    return "law-order-rest"; // Övriga juridikkurser
  }

  getNormalCourseColor(course) {
    // Distinct colors for non-law courses, using course_id to pick color
    // No purple/violet tones - those are reserved for courses with prerequisites
    const colors = [
      "#2ecc71", // Green
      "#3498db", // Blue
      "#e67e22", // Orange
      "#1abc9c", // Teal
      "#e74c3c", // Red
      "#f39c12", // Yellow/Gold
      "#16a085", // Dark teal
      "#d35400", // Dark orange
      "#27ae60", // Dark green
      "#2980b9", // Dark blue
      "#c0392b", // Dark red
      "#f1c40f", // Bright yellow
      "#00cec9", // Cyan
      "#0984e3", // Bright blue
      "#00b894", // Mint green
      "#fdcb6e", // Light gold
    ];

    // Use course_id to consistently pick a color
    const colorIndex = (course.course_id || 0) % colors.length;
    return colors[colorIndex];
  }

  getCourseColor(course) {
    if (!course) return "#666";

    // Courses with prerequisites get a purple gradient based on number of prereqs
    const prereqCount = this.getAllPrerequisites(course.course_id).length;
    if (prereqCount > 0) {
      // More prerequisites = lighter purple
      if (prereqCount === 1) return "#2d1b4e"; // Darkest purple
      if (prereqCount === 2) return "#4a2c7a"; // Medium dark
      if (prereqCount === 3) return "#6f42c1"; // Medium
      return "#9c88ff"; // Lightest purple for 4+
    }

    // Courses without prerequisites get distinct colors
    return this.getNormalCourseColor(course);
  }

  getPrerequisiteNames(courseId) {
    const course = store.getCourse(courseId);
    if (!course?.prerequisites || course.prerequisites.length === 0) {
      return "-";
    }

    return course.prerequisites
      .map((prereqId) => {
        const prereqCourse = store.getCourse(prereqId);
        return prereqCourse ? prereqCourse.code : null;
      })
      .filter(Boolean)
      .join(", ");
  }

  handleDragStart(e) {
    const runId = e.target.dataset.runId;
    const cohortId = e.target.dataset.cohortId;

    // Check if this is a 2-block course
    const run = store.courseRuns.find((r) => r.run_id === parseInt(runId));
    const course = run ? store.getCourse(run.course_id) : null;
    const isTwoBlock = course?.default_block_length === 2;

    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ runId, cohortId, isTwoBlock })
    );
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");

    // Store isTwoBlock on the element for dragover to access
    this._draggingTwoBlock = isTwoBlock;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = parseInt(cohortId);
    this._draggingCourseId = course?.course_id;

    // Show available teachers in all cells for this cohort
    if (course) {
      this.showAvailableTeachersForDrag(parseInt(cohortId), course.course_id);
    }
  }

  handleDragEnd(e) {
    e.target.classList.remove("dragging");
    this._draggingTwoBlock = false;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = null;
    this._draggingCourseId = null;

    // Clear available teachers overlays
    this.clearAvailableTeachersOverlays();

    // Clean up any remaining drag-over classes
    this.shadowRoot
      .querySelectorAll(
        ".drag-over, .drag-over-invalid, .no-teachers-available"
      )
      .forEach((el) => {
        el.classList.remove(
          "drag-over",
          "drag-over-invalid",
          "no-teachers-available"
        );
      });
  }

  handleDragOver(e) {
    e.preventDefault();

    const currentCell = e.currentTarget;
    const targetCohortId = parseInt(currentCell.dataset.cohortId);
    const targetSlotDate = currentCell.dataset.slotDate;

    // Check if cell is disabled (before cohort start date)
    const isDisabled = currentCell.dataset.disabled === "true";

    // Check if dragging to a different cohort
    let isInvalidCohort =
      this._draggingFromCohortId &&
      this._draggingFromCohortId !== targetCohortId;

    // Allow drop if the same course already exists in this slot (co-teaching/samläsning)
    if (isInvalidCohort && this._draggingCourseId && targetSlotDate) {
      const slot = store
        .getSlots()
        .find((s) => s.start_date === targetSlotDate);
      if (slot) {
        const existingRunForCourse = store
          .getCourseRuns()
          .find(
            (r) =>
              r.slot_id === slot.slot_id &&
              r.course_id === this._draggingCourseId
          );
        if (existingRunForCourse) {
          isInvalidCohort = false; // Allow drop - same course exists for another cohort
        }
      }
    }

    // Set drop effect based on validity
    if (isInvalidCohort || isDisabled) {
      e.dataTransfer.dropEffect = "none";
      currentCell.classList.remove("drag-over");
      currentCell.classList.add("drag-over-invalid");
    } else {
      e.dataTransfer.dropEffect = this._draggingFromDepot ? "copy" : "move";
      currentCell.classList.remove("drag-over-invalid");
      currentCell.classList.add("drag-over");
    }

    // If dragging a 2-block course, also highlight the next cell
    if (this._draggingTwoBlock) {
      const nextCell = currentCell.nextElementSibling;
      if (nextCell && nextCell.classList.contains("slot-cell")) {
        if (isInvalidCohort) {
          nextCell.classList.remove("drag-over");
          nextCell.classList.add("drag-over-invalid");
        } else {
          nextCell.classList.remove("drag-over-invalid");
          nextCell.classList.add("drag-over");
        }
      }
    }
  }

  handleDragLeave(e) {
    const currentCell = e.currentTarget;
    currentCell.classList.remove("drag-over", "drag-over-invalid");

    // If dragging a 2-block course, also remove highlight from next cell
    if (this._draggingTwoBlock) {
      const nextCell = currentCell.nextElementSibling;
      if (nextCell && nextCell.classList.contains("slot-cell")) {
        nextCell.classList.remove("drag-over", "drag-over-invalid");
      }
    }
  }

  handleDrop(e) {
    console.log("handleDrop called!", e.currentTarget);
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over", "drag-over-invalid");

    // Also remove drag-over from next cell if it was a 2-block course
    const nextCell = e.currentTarget.nextElementSibling;
    if (nextCell && nextCell.classList.contains("slot-cell")) {
      nextCell.classList.remove("drag-over", "drag-over-invalid");
    }

    // Block drop on disabled cells (before cohort start date)
    if (e.currentTarget.dataset.disabled === "true") {
      return;
    }

    // Block drop if no compatible teachers are available
    if (e.currentTarget.classList.contains("no-teachers-available")) {
      return;
    }

    let data;
    try {
      const rawData = e.dataTransfer.getData("text/plain");
      console.log("Raw data from transfer:", rawData);
      data = JSON.parse(rawData);
      console.log("Parsed data:", data);
    } catch (err) {
      console.error("Error parsing drag data:", err);
      return;
    }

    const targetSlotDate = e.currentTarget.dataset.slotDate;
    const targetCohortId = parseInt(e.currentTarget.dataset.cohortId);

    console.log("Target:", { targetSlotDate, targetCohortId });

    // Check if this is from the depot (new course) or an existing run
    if (data.fromDepot) {
      console.log("Calling handleDropFromDepot");
      this.handleDropFromDepot(data, targetSlotDate, targetCohortId);
    } else {
      console.log("Calling handleDropExistingRun");
      this.handleDropExistingRun(data, targetSlotDate, targetCohortId);
    }
  }

  handleDropFromDepot(data, targetSlotDate, targetCohortId) {
    console.log("handleDropFromDepot called", {
      data,
      targetSlotDate,
      targetCohortId,
    });

    const courseId = parseInt(data.courseId);
    const fromCohortId = parseInt(data.cohortId);
    const course = store.getCourse(courseId);

    console.log("Course found:", course);

    if (!course) {
      console.log("No course found, returning");
      return;
    }

    // Check if dropping to a different cohort
    if (fromCohortId !== targetCohortId) {
      // Allow if the same course already exists in this slot (co-teaching/samläsning)
      const slot = store
        .getSlots()
        .find((s) => s.start_date === targetSlotDate);
      const existingRunForCourse = slot
        ? store
            .getCourseRuns()
            .find((r) => r.slot_id === slot.slot_id && r.course_id === courseId)
        : null;

      if (!existingRunForCourse) {
        return; // Silently ignore - can only drop to same cohort or where course exists
      }
    }

    // Validate prerequisites for new course
    const validationResult = this.validatePrerequisitesForNew(
      course,
      targetSlotDate,
      targetCohortId
    );
    console.log("Validation result:", validationResult);

    if (!validationResult.valid) {
      alert(validationResult.message);
      return;
    }

    // Find or create slot with target date
    let targetSlot = store
      .getSlots()
      .find((s) => s.start_date === targetSlotDate);

    console.log("Target slot:", targetSlot);

    if (!targetSlot) {
      const startDate = new Date(targetSlotDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 28);
      targetSlot = store.addSlot({
        start_date: targetSlotDate,
        end_date: endDate.toISOString().split("T")[0],
        evening_pattern: "tis/tor",
        is_placeholder: false,
      });
      console.log("Created new slot:", targetSlot);
    }

    // Check if this course already exists in this slot (for another cohort)
    // If so, copy the assigned teachers (since they co-teach/samläser)
    const existingRunsForCourse = store
      .getCourseRuns()
      .filter(
        (r) => r.slot_id === targetSlot.slot_id && r.course_id === courseId
      );

    let teachersToAssign = [];
    if (existingRunsForCourse.length > 0) {
      // Get teachers from existing runs of this course
      const existingTeachers = new Set();
      existingRunsForCourse.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) => existingTeachers.add(tid));
        }
      });
      teachersToAssign = Array.from(existingTeachers);
    }

    // Create the course run with teachers (copied from existing runs if any)
    const newRun = store.addCourseRun({
      course_id: courseId,
      slot_id: targetSlot.slot_id,
      cohorts: [targetCohortId],
      teachers: teachersToAssign,
    });

    console.log("Created new run:", newRun, "with teachers:", teachersToAssign);
    this.requestUpdate();
  }

  handleRunTeacherToggle(runId, teacherId, checked, slotDate) {
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (!run) return;

    if (!run.teachers) {
      run.teachers = [];
    }

    if (checked) {
      // Add teacher to run
      if (!run.teachers.includes(teacherId)) {
        run.teachers.push(teacherId);
      }
    } else {
      // Remove teacher from run
      run.teachers = run.teachers.filter((id) => id !== teacherId);
    }

    store.notify();
    this.requestUpdate();
  }

  handleSummaryTeacherToggle(runs, teacherId, checked, slotDate) {
    // If checking a teacher, first remove them from OTHER courses in the same slot
    if (checked) {
      const slot = store.getSlots().find((s) => s.start_date === slotDate);
      if (slot) {
        // Get all runs for this slot
        const allRunsInSlot = store
          .getCourseRuns()
          .filter((r) => r.slot_id === slot.slot_id);

        // Get the course_id for the runs we're adding the teacher to
        const targetCourseId = runs.length > 0 ? runs[0].course_id : null;

        // Remove teacher from runs of OTHER courses in this slot
        // and check if those courses now have no available teachers
        for (const otherRun of allRunsInSlot) {
          if (otherRun.course_id !== targetCourseId && otherRun.teachers) {
            const wasAssigned = otherRun.teachers.includes(teacherId);
            otherRun.teachers = otherRun.teachers.filter(
              (id) => id !== teacherId
            );

            // If teacher was removed, check if any compatible teachers remain available
            if (wasAssigned) {
              this.checkAndRemoveCourseIfNoTeachersAvailable(
                otherRun.course_id,
                slotDate
              );
            }
          }
        }
      }
    }

    // Toggle teacher for ALL runs of this course in this slot
    for (const run of runs) {
      if (!run.teachers) {
        run.teachers = [];
      }

      if (checked) {
        if (!run.teachers.includes(teacherId)) {
          run.teachers.push(teacherId);
        }
      } else {
        run.teachers = run.teachers.filter((id) => id !== teacherId);
      }
    }

    // If unchecking, check if the course now has no available teachers
    if (!checked && runs.length > 0) {
      this.checkAndRemoveCourseIfNoTeachersAvailable(
        runs[0].course_id,
        slotDate
      );
    }

    store.notify();
    this.requestUpdate();
  }

  checkAndRemoveCourseIfNoTeachersAvailable(courseId, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return;

    // Get all runs for this course in this slot
    const runsForCourse = store
      .getCourseRuns()
      .filter((r) => r.slot_id === slot.slot_id && r.course_id === courseId);

    if (runsForCourse.length === 0) return;

    // Check if any teacher is still assigned to this course
    const hasAssignedTeacher = runsForCourse.some(
      (r) => r.teachers && r.teachers.length > 0
    );
    if (hasAssignedTeacher) return;

    // Check if any compatible teacher is available
    // A teacher is available if:
    // 1. Not marked as unavailable (via teacher view), OR
    // 2. Already assigned to THIS SAME course in this slot (for another cohort - co-teaching)
    const teachers = store.getTeachers();

    // Get teachers already assigned to this course in this slot
    const teachersAssignedToThisCourse = new Set();
    runsForCourse.forEach((r) => {
      if (r.teachers) {
        r.teachers.forEach((tid) => teachersAssignedToThisCourse.add(tid));
      }
    });

    const availableCompatibleTeachers = teachers.filter((t) => {
      if (!t.compatible_courses || !t.compatible_courses.includes(courseId)) {
        return false;
      }
      // Teacher is available if not marked unavailable OR already teaching this course
      const isAssignedToThisCourse = teachersAssignedToThisCourse.has(
        t.teacher_id
      );
      const isUnavailable = store.isTeacherUnavailable(t.teacher_id, slotDate);
      return isAssignedToThisCourse || !isUnavailable;
    });

    // If there are still available teachers, don't remove the course
    if (availableCompatibleTeachers.length > 0) return;

    // No available teachers - remove all runs for this course in this slot
    const course = store.getCourse(courseId);
    const courseName = course ? course.name : "Kursen";

    // Collect cohort names for the message
    const affectedCohorts = runsForCourse
      .flatMap((r) => r.cohorts || [])
      .map((cohortId) => store.getCohort(cohortId)?.name)
      .filter(Boolean);

    // Remove the runs
    for (const run of runsForCourse) {
      const index = store.courseRuns.findIndex((r) => r.run_id === run.run_id);
      if (index !== -1) {
        store.courseRuns.splice(index, 1);
      }
    }

    // Show notification
    const cohortText =
      affectedCohorts.length > 0 ? ` för ${affectedCohorts.join(", ")}` : "";
    alert(
      `"${courseName}" har flyttats tillbaka till depån${cohortText} eftersom ingen lärare är tillgänglig.`
    );
  }

  validatePrerequisitesForNew(course, targetSlotDate, targetCohortId) {
    // No validation needed - courses can always be placed in the schedule
    // Missing prerequisites will show visual warnings (red border) instead
    return { valid: true };
  }

  handleDropExistingRun(data, targetSlotDate, targetCohortId) {
    const runId = parseInt(data.runId);
    const fromCohortId = parseInt(data.cohortId);

    // Prevent moving courses between different cohorts
    if (fromCohortId !== targetCohortId) {
      alert("Kurser kan inte flyttas mellan olika kullar.");
      return;
    }

    // Find the run
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (!run) return;

    const course = store.getCourse(run.course_id);

    // Validate prerequisite ordering rules
    const validationResult = this.validatePrerequisitesForMove(
      run,
      course,
      targetSlotDate,
      targetCohortId
    );
    if (!validationResult.valid) {
      alert(validationResult.message);
      return;
    }

    // Find or create slot with target date
    let targetSlot = store
      .getSlots()
      .find((s) => s.start_date === targetSlotDate);
    if (!targetSlot) {
      // Create a new slot if needed
      const startDate = new Date(targetSlotDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 28);
      targetSlot = store.addSlot({
        start_date: targetSlotDate,
        end_date: endDate.toISOString().split("T")[0],
        evening_pattern: "tis/tor",
        is_placeholder: false,
      });
    }

    // Update the run's slot
    run.slot_id = targetSlot.slot_id;

    store.notify();
    this.requestUpdate();
  }

  /**
   * Validate prerequisite ordering when moving an existing course
   */
  validatePrerequisitesForMove(run, course, targetSlotDate, targetCohortId) {
    if (!course) {
      return { valid: true };
    }

    const allPrereqs = this.getAllPrerequisites(course.course_id);

    // Get all course runs for the target cohort, excluding the moving run
    const cohortRuns = store
      .getCourseRuns()
      .filter((r) => r.cohorts && r.cohorts.includes(targetCohortId))
      .filter((r) => r.run_id !== run.run_id);

    const targetDate = new Date(targetSlotDate);

    // Check that all prerequisites come before target date
    for (const prereqId of allPrereqs) {
      const prereqCourse = store.getCourse(prereqId);
      if (!prereqCourse) continue;

      const prereqRun = cohortRuns.find((r) => r.course_id === prereqId);
      if (!prereqRun) continue; // If not scheduled, no constraint

      const prereqSlot = store.getSlot(prereqRun.slot_id);
      if (!prereqSlot) continue;

      const prereqDate = new Date(prereqSlot.start_date);

      // For 2-block courses, check if target is in either block of the prerequisite
      if (prereqCourse.default_block_length === 2) {
        // Check if target is the first block (same date as prereq start)
        if (targetDate.getTime() === prereqDate.getTime()) {
          return {
            valid: false,
            message: `Kan inte placera "${course.name}" i "${prereqCourse.name}" (spärrkurs).`,
          };
        }

        // Check if target is the second block
        const isSecondBlock = this.isSecondBlockOfCourse(
          targetSlotDate,
          prereqRun,
          targetCohortId
        );
        if (isSecondBlock) {
          return {
            valid: false,
            message: `Kan inte placera "${course.name}" i "${prereqCourse.name}" (spärrkurs).`,
          };
        }

        // For 2-block courses, target must be AFTER the second block
        let prereqEndDate = new Date(prereqDate);
        prereqEndDate.setDate(prereqEndDate.getDate() + 28);

        if (targetDate <= prereqEndDate) {
          return {
            valid: false,
            message: `"${course.name}" måste placeras efter "${prereqCourse.name}".`,
          };
        }
      } else {
        // For single-block courses, target must be after the prereq date
        if (targetDate <= prereqDate) {
          return {
            valid: false,
            message: `"${course.name}" måste placeras efter "${prereqCourse.name}".`,
          };
        }
      }
    }

    // Check that we're not moving AFTER any course that has this as prerequisite
    for (const r of cohortRuns) {
      const runCourse = store.getCourse(r.course_id);
      if (!runCourse) continue;

      const runPrereqs = this.getAllPrerequisites(r.course_id);
      if (runPrereqs.includes(course.course_id)) {
        const runSlot = store.getSlot(r.slot_id);
        if (!runSlot) continue;

        const runDate = new Date(runSlot.start_date);
        if (targetDate >= runDate) {
          return {
            valid: false,
            message: `"${course.name}" måste placeras före "${runCourse.name}".`,
          };
        }
      }
    }

    return { valid: true };
  }

  getYears() {
    const years = new Set();
    store.getSlots().forEach((slot) => {
      years.add(new Date(slot.start_date).getFullYear());
    });
    return Array.from(years).sort();
  }

  getDepartments() {
    const departments = new Set();
    store.getTeachers().forEach((t) => {
      if (t.home_department) departments.add(t.home_department);
    });
    return Array.from(departments).sort();
  }

  /**
   * Shorten course name for display in Gantt blocks
   */
  shortenCourseName(name) {
    if (!name) return "";

    // Remove common suffixes
    let short = name
      .replace(" för fastighetsmäklare", "")
      .replace(" för fastighetsförmedlare", "")
      .replace("Fastighetsförmedling - ", "")
      .replace("Fastighetsförmedling", "Förmedling");

    // Truncate if still too long
    if (short.length > 20) {
      short = short.substring(0, 18) + "...";
    }

    return short;
  }
}

customElements.define("report-viewer", ReportViewer);
