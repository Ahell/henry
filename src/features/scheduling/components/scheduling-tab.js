import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { DragDropManager } from "../services/drag-drop-manager.service.js";
import { TeacherAvailabilityOverlay } from "../services/teacher-availability-overlay.service.js";
import { CourseRunManager } from "../services/course-run-manager.service.js";
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
  static styles = schedulingTabStyles;

  constructor() {
    super();
    this._dragDropManager = new DragDropManager(this);
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
        <div class="legend-item">
          <div class="legend-box teacher-shortage"></div>
          <span>Inga kompatibla/tillgängliga lärare</span>
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

  async _handleTeacherToggle(e) {
    const { runs, teacherId, checked, slotDate } = e.detail;
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
    TeacherAvailabilityOverlay.showOverlayForCohort(
      this.shadowRoot,
      cohortId,
      courseId
    );
  }

  _showAvailableTeachersForDragAllCohorts(courseId) {
    TeacherAvailabilityOverlay.showOverlayForAllCohorts(
      this.shadowRoot,
      courseId
    );
  }

  _clearAvailableTeachersOverlays() {
    TeacherAvailabilityOverlay.clearOverlays(this.shadowRoot);
  }
}

customElements.define("scheduling-tab", SchedulingTab);
