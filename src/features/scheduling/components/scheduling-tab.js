import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { DragDropManager } from "../services/drag-drop-manager.service.js";
import { CourseRunManager } from "../services/course-run-manager.service.js";
import "../../../components/ui/index.js";
import "./gantt-depot.js";
import "./gantt-cell.js";
import { schedulingTabStyles } from "../styles/scheduling-tab.styles.js";
import {
  getAvailableCompatibleTeachersForCourseInSlot,
  getCompatibleTeachersForCourse,
} from "../services/teacher-availability.service.js";

/**
 * Scheduling Tab - Gantt view for course planning
 * Coordinates all Gantt sub-components and handles drag-drop logic
 */
export class SchedulingTab extends LitElement {
  static styles = schedulingTabStyles;

  constructor() {
    super();
    this._dragDropManager = new DragDropManager(this);
    this._dragCourseId = null;
    this._availableTeachersBySlotDate = new Map();
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
  }

  render() {
    const cohorts = store.getCohorts();
    const slots = store.getSlots();

    if (slots.length === 0) {
      return html`
        <henry-panel>
          <div slot="header">
            <henry-text variant="heading-3">Gantt-vy</henry-text>
          </div>
          <p>Inga slots tillgängliga.</p>
        </henry-panel>
      `;
    }

    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();

    return html`
      <henry-panel>
        <div slot="header">
          <div class="header-wrapper">
            <henry-text variant="heading-3">
              Gantt-vy: Planeringsöversikt
            </henry-text>
            ${this._renderWarningPills()}
          </div>
        </div>
        <p
          style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-4);"
        >
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
                ${slotDates.map(
                  (dateStr) => html`<th>${this._renderSlotHeader(dateStr)}</th>`
                )}
              </tr>
            </thead>
            <tbody>
              ${cohorts.map((cohort) =>
                this._renderGanttRow(cohort, slotDates)
              )}
            </tbody>
            <tfoot>
              ${this._renderSummaryRow(slotDates)}
            </tfoot>
          </table>
        </div>
      </henry-panel>
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
          <div class="legend-box normal-course"></div>
          <span>Kurs</span>
        </div>
        <div class="legend-item">
          <div class="legend-box teacher-shortage"></div>
          <span>Inga kompatibla/tillgängliga lärare</span>
        </div>
      </div>
    `;
  }

  _renderSlotHeader(slotDate) {
    const availableTeachers =
      this._availableTeachersBySlotDate?.get(slotDate) || [];

    if (!this._dragCourseId) {
      return html`<div class="slot-header">
        <div class="slot-date">${slotDate}</div>
      </div>`;
    }

    const compatibleTeachers = getCompatibleTeachersForCourse(this._dragCourseId);
    const compatibleCount = compatibleTeachers.length;

    const maxShown = 6;
    const shown = availableTeachers.slice(0, maxShown);
    const remaining = Math.max(0, availableTeachers.length - shown.length);

    const hasNoCompatible = compatibleCount === 0;
    const isEmpty = hasNoCompatible || availableTeachers.length === 0;

    const course = store.getCourse(this._dragCourseId);
    const title = course
      ? `${course.code}: ${availableTeachers.length}/${compatibleCount} tillgängliga`
      : `${availableTeachers.length}/${compatibleCount} tillgängliga`;

    return html`
      <div class="slot-header" title="${title}">
        <div class="slot-availability ${isEmpty ? "is-empty" : ""}">
          ${hasNoCompatible
            ? html`<span class="availability-chip is-empty">Inga kompatibla</span>`
            : availableTeachers.length === 0
              ? html`<span class="availability-chip is-empty"
                  >Inga tillgängliga</span
                >`
              : html`${shown.map((t) => {
                  const firstName = (t.name || "").split(" ")[0] || t.name;
                  return html`<span class="availability-chip">${firstName}</span>`;
                })}${remaining > 0
                  ? html`<span class="availability-chip is-more"
                      >+${remaining}</span
                    >`
                  : ""}`}
        </div>
        <div class="slot-date">${slotDate}</div>
      </div>
    `;
  }

  _renderGanttRow(cohort, slotDates) {
    const runsByDate = {};
    const scheduledCourseIds = new Set();

    store
      .getCourseRuns()
      .filter((r) => this._runHasCohort(r, cohort.cohort_id))
      .forEach((run) => {
        const slot = store.getSlot(run.slot_id);
        const course = store.getCourse(run.course_id);

        scheduledCourseIds.add(run.course_id);

        if (slot) {
          if (!runsByDate[slot.start_date]) {
            runsByDate[slot.start_date] = [];
          }
          runsByDate[slot.start_date].push(run);
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

          const slotDate = this._parseDateOnly(dateStr);
          const cohortStartDate = this._parseDateOnly(cohort.start_date);
          const isBeforeCohortStart =
            slotDate && cohortStartDate ? slotDate < cohortStartDate : false;

          const nextSlotDate =
            index < slotDates.length - 1
              ? this._parseDateOnly(slotDates[index + 1])
              : null;
          const isCohortStartSlot =
            slotDate && cohortStartDate
              ? cohortStartDate >= slotDate &&
                (nextSlotDate === null || cohortStartDate < nextSlotDate)
              : false;

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
                .continuationRuns="${[]}"
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

  _parseDateOnly(dateStr) {
    if (typeof dateStr !== "string") return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  _runHasCohort(run, cohortId) {
    if (!run || cohortId == null) return false;
    if (!Array.isArray(run.cohorts)) return false;
    return run.cohorts.some((id) => String(id) === String(cohortId));
  }

  _renderSummaryRow(slotDates) {
    return html`
      <tr>
        <td class="summary-label" colspan="2">Kurser & Lärare:</td>
        ${slotDates.map((dateStr) => this._renderSummaryCell(dateStr))}
      </tr>
    `;
  }

  _renderSummaryCell(slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return html`<td class="summary-cell"></td>`;

    const runsInSlot = store
      .getCourseRuns()
      .filter((r) => String(r.slot_id) === String(slot.slot_id));

    const courseMap = new Map();
    for (const run of runsInSlot) {
      const course = store.getCourse(run.course_id);
      if (!course) continue;

      if (!courseMap.has(course.course_id)) {
        courseMap.set(course.course_id, {
          course,
          runs: [],
          assignedTeachers: new Set(),
          totalParticipants: 0,
        });
      }
      const entry = courseMap.get(course.course_id);
      entry.runs.push(run);

      // cohorts -> participants
      if (Array.isArray(run.cohorts)) {
        for (const cohortId of run.cohorts) {
          const cohort = store.getCohort(cohortId);
          if (cohort) entry.totalParticipants += cohort.planned_size || 0;
        }
      }

      if (Array.isArray(run.teachers)) {
        run.teachers.forEach((tid) => entry.assignedTeachers.add(tid));
      }
    }

    const items = Array.from(courseMap.values()).sort((a, b) =>
      (a.course?.name || "").localeCompare(b.course?.name || "")
    );

    return html`
      <td class="summary-cell">
        ${items.map((item) => {
          const course = item.course;
          const bgColor = this._getCourseColor(course);
          const assignedTeacherIds = Array.from(item.assignedTeachers);
          const compatibleTeachers = getCompatibleTeachersForCourse(
            course.course_id
          );

          return html`
            <div class="summary-course" style="background-color: ${bgColor};">
              <div class="course-header">
                <span class="course-name" title="${course.name}"
                  >${course.code}</span
                >
                <span class="participant-count">${item.totalParticipants} st</span>
              </div>

              <div class="summary-teacher-list">
                ${compatibleTeachers.length === 0
                  ? html`<div class="summary-teacher-row">
                      Inga kompatibla lärare
                    </div>`
                  : compatibleTeachers.map((teacher) => {
                      const isAssigned = assignedTeacherIds.includes(
                        teacher.teacher_id
                      );
                      const isUnavailable = store.isTeacherUnavailable(
                        teacher.teacher_id,
                        slotDate
                      );
                      const disabled = isUnavailable && !isAssigned;
                      const inputId = `summary-${slotDate}-${course.course_id}-${teacher.teacher_id}`;
                      return html`
                        <div
                          class="summary-teacher-row ${isAssigned ? "assigned" : ""}"
                          title=${isUnavailable
                            ? "Otillgänglig i perioden"
                            : "Tillgänglig"}
                        >
                          <input
                            type="checkbox"
                            id="${inputId}"
                            .checked=${isAssigned}
                            ?disabled=${disabled}
                            @change=${(e) =>
                              this._toggleTeacherAssignment({
                                runs: item.runs,
                                teacherId: teacher.teacher_id,
                                checked: !!e?.target?.checked,
                                slotDate,
                              })}
                          />
                          <label for="${inputId}">${teacher.name}</label>
                        </div>
                      `;
                    })}
              </div>
            </div>
          `;
        })}
      </td>
    `;
  }

  _getCourseColor(course) {
    if (!course) return "#666";
    // Keep consistent with gantt blocks (simple deterministic color list).
    const colors = [
      "#2ecc71",
      "#3498db",
      "#e67e22",
      "#1abc9c",
      "#e74c3c",
      "#f39c12",
      "#16a085",
      "#d35400",
      "#27ae60",
      "#2980b9",
      "#c0392b",
      "#f1c40f",
      "#00cec9",
      "#0984e3",
      "#00b894",
      "#fdcb6e",
    ];
    const colorIndex = (course.course_id || 0) % colors.length;
    return colors[colorIndex];
  }

  _handleDepotDragStart(e) {
    this._dragDropManager.handleDepotDragStart(e);
  }

  _handleCourseDragStart(e) {
    this._dragDropManager.handleCourseDragStart(e);
  }

  _handleDragEnd() {
    this._dragDropManager.handleDragEnd();
  }

  _handleCellDragOver(e) {
    this._dragDropManager.handleCellDragOver(e);
  }

  _handleCellDragLeave(e) {
    this._dragDropManager.handleCellDragLeave(e);
  }

  async _handleCellDrop(e) {
    const dropResult = this._dragDropManager.handleCellDrop(e);

    if (dropResult) {
      try {
        const { type, data, slotDate, cohortId } = dropResult;
        if (type === "depot") {
          await CourseRunManager.createRunFromDepot(
            data,
            slotDate,
            cohortId
          );
        } else if (type === "existing") {
          await CourseRunManager.moveExistingRun(data, slotDate, cohortId);
        }
        this.requestUpdate();
      } catch (error) {
        console.error("Kunde inte spara förändringen i schemat:", error);
      }
    }
  }

  _handleDepotDragOver(e) {
    this._dragDropManager.handleDepotDragOver(e);
  }

  _handleDepotDragLeave(e) {
    this._dragDropManager.handleDepotDragLeave(e);
  }

  async _handleDepotDrop(e) {
    const dropResult = this._dragDropManager.handleDepotDrop(e);

    if (dropResult) {
      try {
        const { runId, targetCohortId } = dropResult;
        await CourseRunManager.removeCourseRunFromCohort(
          runId,
          targetCohortId
        );
        this.requestUpdate();
      } catch (error) {
        console.error("Kunde inte ta bort kurstillfälle:", error);
      }
    }
  }

  async _toggleTeacherAssignment({ runs, teacherId, checked, slotDate }) {
    try {
      await CourseRunManager.toggleTeacherAssignment(
        runs,
        teacherId,
        checked,
        slotDate
      );
      this.requestUpdate();
    } catch (error) {
      console.error("Kunde inte uppdatera lärarplacering:", error);
    }
  }

  _showAvailableTeachersForDrag(cohortId, courseId) {
    this._setTeacherOverlayForCourse(courseId);
  }

  _showAvailableTeachersForDragAllCohorts(courseId) {
    this._setTeacherOverlayForCourse(courseId);
  }

  _clearAvailableTeachersOverlays() {
    this._dragCourseId = null;
    this._availableTeachersBySlotDate = new Map();
    this._applyColumnTeacherShortageClasses(new Map());
    this.requestUpdate();
  }

  _setTeacherOverlayForCourse(courseId) {
    this._dragCourseId = courseId;

    const slotDates = [
      ...new Set((store.getSlots() || []).map((s) => s.start_date)),
    ].sort();
    const map = new Map();

    slotDates.forEach((slotDate) => {
      map.set(slotDate, this._computeAvailableTeachers(courseId, slotDate));
    });

    this._availableTeachersBySlotDate = map;
    this._applyColumnTeacherShortageClasses(map);
    this.requestUpdate();
  }

  _computeAvailableTeachers(courseId, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return [];

    const existingRunsForCourse = store
      .getCourseRuns()
      .filter(
        (r) => String(r.slot_id) === String(slot.slot_id) && r.course_id === courseId
      );

    const teachersAlreadyTeachingThisCourse = new Set();
    existingRunsForCourse.forEach((r) => {
      if (Array.isArray(r.teachers)) {
        r.teachers.forEach((tid) => teachersAlreadyTeachingThisCourse.add(tid));
      }
    });

    return getAvailableCompatibleTeachersForCourseInSlot(courseId, slotDate, {
      includeTeacherIds: Array.from(teachersAlreadyTeachingThisCourse),
    });
  }

  _applyColumnTeacherShortageClasses(availableTeachersBySlotDate) {
    if (!this.shadowRoot) return;

    // Clear all existing shortage marks first.
    this.shadowRoot
      .querySelectorAll(".gantt-table td.slot-cell.no-teachers-available")
      .forEach((td) => td.classList.remove("no-teachers-available"));

    if (!this._dragCourseId) return;

    for (const [slotDate, teachers] of availableTeachersBySlotDate.entries()) {
      if (Array.isArray(teachers) && teachers.length > 0) continue;

      this.shadowRoot
        .querySelectorAll(`.gantt-table td.slot-cell[data-slot-date="${slotDate}"]`)
        .forEach((td) => {
          if (td.dataset.disabled === "true") return;
          td.classList.add("no-teachers-available");
        });
    }
  }
}

customElements.define("scheduling-tab", SchedulingTab);
