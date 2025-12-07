import { LitElement, html, css } from "lit";
import { store } from "../../utils/store.js";
import "../ui/index.js";
import "./gantt-depot.js";
import "./gantt-cell.js";
import "./gantt-summary-row.js";

/**
 * Scheduling Tab - Gantt view for course planning
 * Coordinates all Gantt sub-components and handles drag-drop logic
 */
export class SchedulingTab extends LitElement {
  static properties = {
    _draggingTwoBlock: { type: Boolean },
    _draggingFromDepot: { type: Boolean },
    _draggingFromCohortId: { type: Number },
    _draggingCourseId: { type: Number },
    _draggedCells: { type: Array },
  };

  static styles = css`
    @import url("/src/styles/tokens.css");

    :host {
      display: block;
    }

    .panel {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-border);
    }

    .warning-pills {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .warning-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      background: var(--color-danger);
      color: white;
      padding: var(--space-1) var(--space-3);
      border-radius: 16px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      animation: pulse-pill 1.5s infinite;
    }

    .warning-pill .cohort-name {
      font-weight: var(--font-weight-semibold);
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

    .legend {
      display: flex;
      gap: var(--space-8);
      margin-top: var(--space-4);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
    }

    .legend-box {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
    }

    .law-course.law-order-1 {
      background: var(--color-secondary-900);
    }

    .law-course.law-order-2 {
      background: var(--color-secondary-700);
    }

    .law-course.law-order-3 {
      background: var(--color-secondary-500);
    }

    .law-course.law-order-rest {
      background: var(--color-secondary-300);
    }

    .normal-course {
      background: var(--color-primary-500);
    }

    .two-block-course {
      border: 2px dashed rgba(255, 255, 255, 0.7);
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
      border: 1px solid var(--color-border);
      padding: 0;
      min-width: 100px;
      width: 100px;
      height: 44px;
      text-align: center;
      vertical-align: middle;
    }

    .gantt-table th {
      background: var(--color-gray-200);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      padding: var(--space-1) var(--space-1);
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: var(--shadow-sm);
    }

    .gantt-table th.cohort-header {
      min-width: 70px;
      width: 70px;
      text-align: left;
      padding-left: var(--space-2);
      position: sticky;
      background: var(--color-gray-200);
      z-index: 20;
      box-shadow: var(--shadow-sm);
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
      background: var(--color-surface);
      position: sticky;
      left: 0;
      z-index: 5;
      vertical-align: top;
      padding: var(--space-1);
    }

    .gantt-table td.depot-cell.drag-over {
      background: var(--color-warning-light) !important;
      box-shadow: inset 0 0 0 2px var(--color-warning);
    }

    .gantt-table td.cohort-cell {
      min-width: 70px;
      width: 70px;
      text-align: left;
      padding-left: var(--space-2);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs);
      background: var(--color-gray-50);
      position: sticky;
      left: 180px;
      z-index: 5;
    }

    .gantt-table td.slot-cell {
      background: var(--color-surface);
      position: relative;
      cursor: pointer;
      transition: var(--transition-fast);
      overflow: visible;
      min-width: 85px;
      width: 85px;
      vertical-align: top;
    }

    .gantt-table td.slot-cell:hover {
      background: var(--color-info-light);
    }

    .gantt-table td.slot-cell.drag-over {
      background: var(--color-info-light);
      box-shadow: inset 0 0 0 2px var(--color-info);
    }

    .gantt-table td.slot-cell.drag-over-invalid {
      background: var(--color-danger-light);
      box-shadow: inset 0 0 0 2px var(--color-danger);
    }

    .gantt-table td.slot-cell.no-teachers-available {
      background: var(--color-danger-light) !important;
      box-shadow: inset 0 0 0 2px var(--color-danger);
    }

    .gantt-table td.slot-cell.disabled-slot {
      background: var(--color-gray-300);
      cursor: not-allowed;
      opacity: 0.5;
    }

    .gantt-table td.slot-cell.disabled-slot:hover {
      background: var(--color-gray-300);
    }

    .gantt-table td.slot-cell.cohort-start-slot {
      position: relative;
    }

    .gantt-table tfoot td {
      background: var(--color-gray-200);
      vertical-align: top;
      padding: var(--space-1);
      border-top: 2px solid var(--color-gray-300);
    }
  `;

  constructor() {
    super();
    this._draggingTwoBlock = false;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = null;
    this._draggingCourseId = null;
    this._draggedCells = [];
    store.subscribe(() => this.requestUpdate());
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("depot-drag-start", this._handleDepotDragStart);
    this.addEventListener("depot-drag-end", this._handleDragEnd);
    this.addEventListener("course-drag-start", this._handleCourseDragStart);
    this.addEventListener("course-drag-end", this._handleDragEnd);
    this.addEventListener("cell-drag-over", this._handleCellDragOver);
    this.addEventListener("cell-drag-leave", this._handleCellDragLeave);
    this.addEventListener("cell-drop", this._handleCellDrop);
    this.addEventListener("teacher-toggle", this._handleTeacherToggle);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("depot-drag-start", this._handleDepotDragStart);
    this.removeEventListener("depot-drag-end", this._handleDragEnd);
    this.removeEventListener("course-drag-start", this._handleCourseDragStart);
    this.removeEventListener("course-drag-end", this._handleDragEnd);
    this.removeEventListener("cell-drag-over", this._handleCellDragOver);
    this.removeEventListener("cell-drag-leave", this._handleCellDragLeave);
    this.removeEventListener("cell-drop", this._handleCellDrop);
    this.removeEventListener("teacher-toggle", this._handleTeacherToggle);
  }

  render() {
    const cohorts = store.getCohorts();
    const slots = store.getSlots();

    if (slots.length === 0) {
      return html`
        <div class="panel">
          <henry-text variant="heading-3">Gantt-vy</henry-text>
          <p>Inga slots tillgängliga.</p>
        </div>
      `;
    }

    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();

    return html`
      <div class="panel">
        <div class="panel-header">
          <henry-text variant="heading-3">
            Gantt-vy: Planeringsöversikt
          </henry-text>
          ${this._renderWarningPills()}
        </div>
        <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4);">
          Dra kurser från kullens depå till schemat. Kurser försvinner från
          depån när de schemaläggs.
        </p>

        ${this._renderLegend()}

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
                this._renderGanttRow(cohort, slotDates)
              )}
            </tbody>
            <tfoot>
              <tr>
                <gantt-summary-row
                  .slotDates="${slotDates}"
                ></gantt-summary-row>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  }

  _renderWarningPills() {
    const prerequisiteProblems = store.prerequisiteProblems || [];
    if (prerequisiteProblems.length === 0) return "";

    const problemsByCohort = new Map();
    prerequisiteProblems.forEach((problem) => {
      if (!problemsByCohort.has(problem.cohortId)) {
        problemsByCohort.set(problem.cohortId, []);
      }
      problemsByCohort.get(problem.cohortId).push(problem);
    });

    return html`
      <div class="warning-pills">
        ${Array.from(problemsByCohort.entries()).map(([cohortId, problems]) => {
          const cohort = store.getCohort(cohortId);
          if (!cohort) return "";

          const missingCount = problems.filter(
            (p) => p.type === "missing"
          ).length;
          const beforeCount = problems.filter(
            (p) => p.type === "before_prerequisite"
          ).length;

          return html`
            <div class="warning-pill">
              <span class="cohort-name">${cohort.name}</span>:
              ${missingCount > 0 ? html`${missingCount} saknar spärrkurs` : ""}
              ${missingCount > 0 && beforeCount > 0 ? ", " : ""}
              ${beforeCount > 0 ? html`${beforeCount} före spärrkurs` : ""}
            </div>
          `;
        })}
      </div>
    `;
  }

  _renderLegend() {
    return html`
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
    `;
  }

  _renderGanttRow(cohort, slotDates) {
    const runsByDate = {};
    const twoBlockDates = new Set();
    const scheduledCourseIds = new Set();

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
          @dragover="${this._handleDepotDragOver}"
          @dragleave="${this._handleDepotDragLeave}"
          @drop="${this._handleDepotDrop}"
        >
          <gantt-depot
            .cohortId="${cohort.cohort_id}"
            .scheduledCourseIds="${Array.from(scheduledCourseIds)}"
          ></gantt-depot>
        </td>
        <td class="cohort-cell">${cohort.name}</td>
        ${slotDates.map((dateStr, index) => {
          const runs = runsByDate[dateStr] || [];
          const isContinuation = twoBlockDates.has(dateStr);

          const slotDate = new Date(dateStr);
          const cohortStartDate = new Date(cohort.start_date);
          const isBeforeCohortStart = slotDate < cohortStartDate;

          const nextSlotDate =
            index < slotDates.length - 1
              ? new Date(slotDates[index + 1])
              : null;
          const isCohortStartSlot =
            cohortStartDate >= slotDate &&
            (nextSlotDate === null || cohortStartDate < nextSlotDate);

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
            >
              <gantt-cell
                .slotDate="${dateStr}"
                .cohortId="${cohort.cohort_id}"
                .runs="${runs}"
                .continuationRuns="${continuationRuns}"
                .isBeforeCohortStart="${isBeforeCohortStart}"
                .isCohortStartSlot="${isCohortStartSlot}"
                .cohortStartDate="${cohort.start_date}"
              ></gantt-cell>
            </td>
          `;
        })}
      </tr>
    `;
  }

  _handleDepotDragStart(e) {
    const { courseId, cohortId, isTwoBlock } = e.detail;
    this._draggingTwoBlock = isTwoBlock;
    this._draggingFromDepot = true;
    this._draggingFromCohortId = cohortId;
    this._draggingCourseId = courseId;

    this._showAvailableTeachersForDragAllCohorts(courseId);
  }

  _handleCourseDragStart(e) {
    const { courseId, cohortId, isTwoBlock } = e.detail;
    this._draggingTwoBlock = isTwoBlock;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = cohortId;
    this._draggingCourseId = courseId;

    this._showAvailableTeachersForDrag(cohortId, courseId);
  }

  _handleDragEnd() {
    this._draggingTwoBlock = false;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = null;
    this._draggingCourseId = null;

    this._clearAvailableTeachersOverlays();
    this._draggedCells.forEach((cell) => {
      const td = cell.closest("td");
      if (td) {
        td.classList.remove(
          "drag-over",
          "drag-over-invalid",
          "no-teachers-available"
        );
      }
    });
    this._draggedCells = [];
  }

  _handleCellDragOver(e) {
    const { slotDate, cohortId, cell } = e.detail;
    const td = cell.closest("td");
    if (!td) return;

    const isDisabled = td.dataset.disabled === "true";
    const isInvalidCohort =
      this._draggingFromCohortId &&
      this._draggingFromCohortId !== cohortId &&
      !this._isSameCourseInSlot(slotDate, this._draggingCourseId);

    if (isInvalidCohort || isDisabled) {
      td.classList.remove("drag-over");
      td.classList.add("drag-over-invalid");
    } else {
      td.classList.remove("drag-over-invalid");
      td.classList.add("drag-over");
    }

    if (this._draggingTwoBlock) {
      const nextTd = td.nextElementSibling;
      if (nextTd && nextTd.classList.contains("slot-cell")) {
        if (isInvalidCohort) {
          nextTd.classList.remove("drag-over");
          nextTd.classList.add("drag-over-invalid");
        } else {
          nextTd.classList.remove("drag-over-invalid");
          nextTd.classList.add("drag-over");
        }
      }
    }

    if (!this._draggedCells.includes(cell)) {
      this._draggedCells.push(cell);
    }
  }

  _handleCellDragLeave(e) {
    const { cell } = e.detail;
    const td = cell.closest("td");
    if (td) {
      td.classList.remove("drag-over", "drag-over-invalid");
    }

    if (this._draggingTwoBlock) {
      const nextTd = td?.nextElementSibling;
      if (nextTd && nextTd.classList.contains("slot-cell")) {
        nextTd.classList.remove("drag-over", "drag-over-invalid");
      }
    }
  }

  _handleCellDrop(e) {
    const { data, slotDate, cohortId, cell } = e.detail;
    const td = cell.closest("td");
    if (td) {
      td.classList.remove("drag-over", "drag-over-invalid");
      const nextTd = td.nextElementSibling;
      if (nextTd && nextTd.classList.contains("slot-cell")) {
        nextTd.classList.remove("drag-over", "drag-over-invalid");
      }
    }

    if (td?.classList.contains("no-teachers-available")) {
      return;
    }

    if (data.fromDepot) {
      this._handleDropFromDepot(data, slotDate, cohortId);
    } else {
      this._handleDropExistingRun(data, slotDate, cohortId);
    }
  }

  _handleDropFromDepot(data, targetSlotDate, targetCohortId) {
    const courseId = parseInt(data.courseId);
    const fromCohortId = parseInt(data.cohortId);
    const course = store.getCourse(courseId);

    if (!course) return;

    if (fromCohortId !== targetCohortId) {
      const slot = store
        .getSlots()
        .find((s) => s.start_date === targetSlotDate);
      const existingRunForCourse = slot
        ? store
            .getCourseRuns()
            .find((r) => r.slot_id === slot.slot_id && r.course_id === courseId)
        : null;

      if (!existingRunForCourse) {
        return;
      }
    }

    // For 2-block courses, check teachers for both blocks
    if (course.default_block_length === 2) {
      if (
        !this._checkTwoBlockTeachers(courseId, targetSlotDate, targetCohortId)
      ) {
        return;
      }
    }

    let targetSlot = store
      .getSlots()
      .find((s) => s.start_date === targetSlotDate);

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
    }

    // Get teachers from existing runs if co-teaching
    const existingRunsForCourse = store
      .getCourseRuns()
      .filter(
        (r) => r.slot_id === targetSlot.slot_id && r.course_id === courseId
      );

    let teachersToAssign = [];
    if (existingRunsForCourse.length > 0) {
      const existingTeachers = new Set();
      existingRunsForCourse.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) => existingTeachers.add(tid));
        }
      });
      teachersToAssign = Array.from(existingTeachers);
    }

    store.addCourseRun({
      course_id: courseId,
      slot_id: targetSlot.slot_id,
      cohorts: [targetCohortId],
      teachers: teachersToAssign,
    });

    this.requestUpdate();
  }

  _handleDropExistingRun(data, targetSlotDate, targetCohortId) {
    const runId = parseInt(data.runId);
    const fromCohortId = parseInt(data.cohortId);

    if (fromCohortId !== targetCohortId) {
      return;
    }

    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (!run) return;

    const course = store.getCourse(run.course_id);

    // For 2-block courses, check teachers for both blocks
    if (course?.default_block_length === 2) {
      if (
        !this._checkTwoBlockTeachers(
          course.course_id,
          targetSlotDate,
          targetCohortId
        )
      ) {
        return;
      }
    }

    let targetSlot = store
      .getSlots()
      .find((s) => s.start_date === targetSlotDate);
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
    }

    run.slot_id = targetSlot.slot_id;

    store.notify();
    this.requestUpdate();
  }

  _handleDepotDragOver(e) {
    if (!this._draggingFromDepot) {
      e.preventDefault();
      e.currentTarget.classList.add("drag-over");
    }
  }

  _handleDepotDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  _handleDepotDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }

    if (data.fromDepot) {
      return;
    }

    const runId = parseInt(data.runId);
    const targetCohortId = parseInt(e.currentTarget.dataset.cohortId);

    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (!run) return;

    run.cohorts = run.cohorts.filter((id) => id !== targetCohortId);

    if (run.cohorts.length === 0) {
      const index = store.courseRuns.indexOf(run);
      if (index > -1) {
        store.courseRuns.splice(index, 1);
      }
    }

    store.notify();
    this.requestUpdate();
  }

  _handleTeacherToggle(e) {
    const { runs, teacherId, checked, slotDate } = e.detail;

    if (checked) {
      const slot = store.getSlots().find((s) => s.start_date === slotDate);
      if (slot) {
        const allRunsInSlot = store
          .getCourseRuns()
          .filter((r) => r.slot_id === slot.slot_id);

        const targetCourseId = runs.length > 0 ? runs[0].course_id : null;

        for (const otherRun of allRunsInSlot) {
          if (otherRun.course_id !== targetCourseId && otherRun.teachers) {
            const wasAssigned = otherRun.teachers.includes(teacherId);
            otherRun.teachers = otherRun.teachers.filter(
              (id) => id !== teacherId
            );

            if (wasAssigned) {
              this._checkAndRemoveCourseIfNoTeachersAvailable(
                otherRun.course_id,
                slotDate
              );
            }
          }
        }
      }
    }

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

    if (!checked && runs.length > 0) {
      this._checkAndRemoveCourseIfNoTeachersAvailable(
        runs[0].course_id,
        slotDate
      );
    }

    store.notify();
    this.requestUpdate();
  }

  _isSameCourseInSlot(slotDate, courseId) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return false;

    return store
      .getCourseRuns()
      .some((r) => r.slot_id === slot.slot_id && r.course_id === courseId);
  }

  _checkTwoBlockTeachers(courseId, targetSlotDate, targetCohortId) {
    const availableTeachersBlock1 = this._getAvailableTeachersForSlot(
      courseId,
      targetSlotDate,
      targetCohortId
    );

    if (availableTeachersBlock1.length === 0) {
      return false;
    }

    const slots = store.getSlots().sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateA.getTime() - dateB.getTime();
    });

    const currentSlotIndex = slots.findIndex(
      (s) => s.start_date === targetSlotDate
    );
    if (currentSlotIndex < 0 || currentSlotIndex >= slots.length - 1) {
      return false;
    }

    const nextSlot = slots[currentSlotIndex + 1];
    const availableTeachersBlock2 = this._getAvailableTeachersForSlot(
      courseId,
      nextSlot.start_date,
      targetCohortId
    );

    return availableTeachersBlock2.length > 0;
  }

  _getAvailableTeachersForSlot(courseId, slotDate, targetCohortId) {
    const teachers = store.getTeachers();
    const compatibleTeachers = teachers.filter(
      (t) => t.compatible_courses && t.compatible_courses.includes(courseId)
    );

    return compatibleTeachers.filter((t) => {
      const isUnavailable = store.isTeacherUnavailable(t.teacher_id, slotDate);
      return !isUnavailable;
    });
  }

  _checkAndRemoveCourseIfNoTeachersAvailable(courseId, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return;

    const runsForCourse = store
      .getCourseRuns()
      .filter((r) => r.slot_id === slot.slot_id && r.course_id === courseId);

    if (runsForCourse.length === 0) return;

    const hasAssignedTeacher = runsForCourse.some(
      (r) => r.teachers && r.teachers.length > 0
    );
    if (hasAssignedTeacher) return;

    const teachers = store.getTeachers();
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
      const isAssignedToThisCourse = teachersAssignedToThisCourse.has(
        t.teacher_id
      );
      const isUnavailable = store.isTeacherUnavailable(t.teacher_id, slotDate);
      return isAssignedToThisCourse || !isUnavailable;
    });

    if (availableCompatibleTeachers.length > 0) return;

    for (const run of runsForCourse) {
      const index = store.courseRuns.findIndex((r) => r.run_id === run.run_id);
      if (index !== -1) {
        store.courseRuns.splice(index, 1);
      }
    }
  }

  _showAvailableTeachersForDrag(cohortId, courseId) {
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) => teacher.compatible_courses?.includes(courseId));

    const cells = this.shadowRoot.querySelectorAll(
      `.slot-cell[data-cohort-id="${cohortId}"] gantt-cell`
    );

    cells.forEach((cell) => {
      const slotDate = cell.slotDate;
      if (!slotDate || cell.isBeforeCohortStart) return;

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
        const td = cell.closest("td");
        if (td) td.classList.add("no-teachers-available");
      } else {
        cell.availableTeachers = availableTeachers;
      }
    });
  }

  _showAvailableTeachersForDragAllCohorts(courseId) {
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) => teacher.compatible_courses?.includes(courseId));

    const cells = this.shadowRoot.querySelectorAll("gantt-cell");

    cells.forEach((cell) => {
      const slotDate = cell.slotDate;
      if (!slotDate || cell.isBeforeCohortStart) return;

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
        const td = cell.closest("td");
        if (td) td.classList.add("no-teachers-available");
      } else {
        cell.availableTeachers = availableTeachers;
      }
    });
  }

  _clearAvailableTeachersOverlays() {
    const cells = this.shadowRoot.querySelectorAll("gantt-cell");
    cells.forEach((cell) => {
      cell.availableTeachers = [];
      const td = cell.closest("td");
      if (td) td.classList.remove("no-teachers-available");
    });
  }
}

customElements.define("scheduling-tab", SchedulingTab);
