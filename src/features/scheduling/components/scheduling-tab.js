import { LitElement, html } from "lit";
import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";
import "../../../components/ui/index.js";
import "./gantt-depot.js";
import "./gantt-cell.js";
import "./gantt-summary-row.js";
import { schedulingTabStyles } from "../styles/scheduling-tab.styles.js";

/**
 * Scheduling Tab - Gantt view for course planning
 * Coordinates all Gantt sub-components and handles drag-drop logic
 */
export class SchedulingTab extends LitElement {
  static properties = {
    _draggingFromDepot: { type: Boolean },
    _draggingFromCohortId: { type: Number },
    _draggingCourseId: { type: Number },
    _draggedCells: { type: Array },
  };

  static styles = schedulingTabStyles;

  constructor() {
    super();
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
      </div>
    `;
  }

  _renderGanttRow(cohort, slotDates) {
    const runsByDate = {};
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

  _handleDepotDragStart(e) {
    const { courseId, cohortId } = e.detail;
    this._draggingFromDepot = true;
    this._draggingFromCohortId = cohortId;
    this._draggingCourseId = courseId;

    this._showAvailableTeachersForDragAllCohorts(courseId);
  }

  _handleCourseDragStart(e) {
    const { courseId, cohortId } = e.detail;
    this._draggingFromDepot = false;
    this._draggingFromCohortId = cohortId;
    this._draggingCourseId = courseId;

    this._showAvailableTeachersForDrag(cohortId, courseId);
  }

  _handleDragEnd() {
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

    // Note: We don't block drops based on teacher availability
    // The "no-teachers-available" class is purely for visualization
    // Users should be able to schedule courses even if teachers are marked as unavailable

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

    let targetSlot = store
      .getSlots()
      .find((s) => s.start_date === targetSlotDate);

    if (!targetSlot) {
      const startDate = new Date(targetSlotDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
      try {
        targetSlot = store.addSlot({
          start_date: targetSlotDate,
          end_date: endDate.toISOString().split("T")[0],
          evening_pattern: "tis/tor",
          is_placeholder: false,
        });
      } catch (error) {
        console.warn("Kunde inte skapa slot:", error);
        return;
      }
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

    let targetSlot = store
      .getSlots()
      .find((s) => s.start_date === targetSlotDate);
    if (!targetSlot) {
      const startDate = new Date(targetSlotDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
      try {
        targetSlot = store.addSlot({
          start_date: targetSlotDate,
          end_date: endDate.toISOString().split("T")[0],
          evening_pattern: "tis/tor",
          is_placeholder: false,
        });
      } catch (error) {
        console.warn("Kunde inte skapa slot:", error);
        return;
      }
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
