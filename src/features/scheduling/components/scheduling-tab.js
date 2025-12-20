import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { DragDropManager } from "../services/drag-drop-manager.service.js";
import { CourseRunManager } from "../services/course-run-manager.service.js";
import "../../../components/ui/index.js";
import "./gantt-depot.js";
import "./gantt-cell.js";
import { schedulingTabStyles } from "../styles/scheduling-tab.styles.js";
import { getSlotRange } from "../../../utils/date-utils.js";
import {
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
    this._teacherOverlayChipsBySlotDate = new Map();
    this._shouldShowTeacherAvailabilityOverlay = false;
    this._autoFillInProgressByCohort = new Set();
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
    const prerequisiteProblems = this._computeSchedulingPrerequisiteProblems();
    const overlapWarnings = this._computeCohortSlotOverlapWarnings();
    const headerWarnings = [...prerequisiteProblems, ...overlapWarnings];

    return html`
      <henry-panel>
        <div slot="header">
          <div class="header-wrapper">
            <henry-text variant="heading-3">
              Schemaläggning
            </henry-text>
            ${this._renderWarningPills(headerWarnings)}
          </div>
        </div>

        <div class="gantt-scroll-wrapper">
          <table
            class="gantt-table"
            style="--gantt-slot-count: ${slotDates.length};"
          >
            <colgroup>
              <col style="width: var(--gantt-depot-width);" />
              <col style="width: var(--gantt-cohort-width);" />
              ${slotDates.map(
                () => html`<col style="width: var(--gantt-slot-width);" />`
              )}
            </colgroup>
            <thead>
              <tr class="availability-row">
                <th class="cohort-header" rowspan="2">Depå</th>
                <th class="cohort-header" rowspan="2">Kull</th>
                ${slotDates.map(
                  (dateStr) =>
                    html`<th class="slot-col-header">
                      ${this._renderSlotAvailabilityHeader(dateStr)}
                    </th>`
                )}
              </tr>
              <tr class="date-row">
                ${slotDates.map(
                  (dateStr) =>
                    html`<th class="slot-col-header">
                      <div class="slot-date">${dateStr}</div>
                    </th>`
                )}
              </tr>
            </thead>
            <tbody>
              ${cohorts.map((cohort) =>
                this._renderGanttRow(cohort, slotDates, prerequisiteProblems)
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

  _renderWarningPills(prerequisiteProblems) {
    prerequisiteProblems = Array.isArray(prerequisiteProblems)
      ? prerequisiteProblems
      : [];
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
          const chainCount = problems.filter(
            (p) => p.type === "blocked_by_prerequisite_chain"
          ).length;
          const hasOverlap = problems.some(
            (p) => p.type === "multiple_courses_in_slot"
          );

          const warningParts = [];
          if (missingCount > 0) warningParts.push(`${missingCount} saknar spärrkurs`);
          if (beforeCount > 0) warningParts.push("Kurs före spärrkurs");
          if (chainCount > 0) warningParts.push(`${chainCount} kedjeblockering`);
          if (hasOverlap) warningParts.push("Flera kurser i samma period");

          return html`
            <div class="warning-pill">
              <span class="cohort-name">${cohort.name}</span>:
              ${warningParts.join(", ")}
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

  _renderSlotAvailabilityHeader(slotDate) {
    const chips = this._teacherOverlayChipsBySlotDate?.get(slotDate) || [];

    if (!this._dragCourseId || !this._shouldShowTeacherAvailabilityOverlay) {
      return html`<div class="slot-availability-row" aria-hidden="true"></div>`;
    }

    const course = store.getCourse(this._dragCourseId);
    const title = course ? `${course.code}: kompatibla lärare` : "Kompatibla lärare";

    return html`
      <div class="slot-availability-row" title="${title}">
        <div class="slot-availability">
          ${chips.map((chip) => {
            const className =
              chip?.status && chip.status !== "available"
                ? `availability-chip availability-chip--${chip.status}`
                : "availability-chip availability-chip--available";
            return html`
              <span class="${className}" title="${chip.title}">
                <span class="availability-chip-text">${chip.label}</span>
              </span>
            `;
          })}
        </div>
      </div>
    `;
  }

  _renderGanttRow(cohort, slotDates, prerequisiteProblems) {
    const runsByDate = {};
    const continuationRunsByDate = {};
    const scheduledCourseIds = new Set();
    const autoFillBusy =
      this._autoFillInProgressByCohort.has(String(cohort.cohort_id)) ||
      store.isReconciling;

    store
      .getCourseRuns()
      .filter((r) => this._runHasCohort(r, cohort.cohort_id))
      .forEach((run) => {
        const slot = store.getSlot(run.slot_id);
        const course = store.getCourse(run.course_id);

        scheduledCourseIds.add(run.course_id);

        if (!slot) return;

        const runSlotDates = this._getRunSlotDates(run, slotDates);
        if (runSlotDates.length === 0) return;

        runSlotDates.forEach((dateStr, idx) => {
          if (idx === 0) {
            if (!runsByDate[dateStr]) runsByDate[dateStr] = [];
            runsByDate[dateStr].push(run);
            return;
          }
          if (!continuationRunsByDate[dateStr]) {
            continuationRunsByDate[dateStr] = [];
          }
          continuationRunsByDate[dateStr].push(run);
        });
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
        <td class="cohort-cell">
          <div class="cohort-cell-content">
            <span class="cohort-cell-name">${cohort.name}</span>
            <div class="cohort-cell-actions">
              <button
                class="cohort-reset-button"
                type="button"
                title="Flytta alla kurser tillbaka till depån"
                @click=${(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this._handleResetCohortClick(cohort.cohort_id);
                }}
              >
                Återställ
              </button>
              <button
                class="cohort-autofill-button"
                type="button"
                ?disabled=${autoFillBusy}
                title="Auto-fyll schema för denna kull"
                @click=${(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  this._handleAutoFillCohortClick(cohort.cohort_id);
                }}
              >
                ${autoFillBusy ? "Auto-fyll…" : "Auto-fyll"}
              </button>
            </div>
          </div>
        </td>
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
              @dragover="${this._handleSlotCellDragOver}"
              @dragleave="${this._handleSlotCellDragLeave}"
              @drop="${this._handleSlotCellDrop}"
            >
              <gantt-cell
                .slotDate="${dateStr}"
                .cohortId="${cohort.cohort_id}"
                .runs="${runs}"
                .continuationRuns="${continuationRunsByDate[dateStr] || []}"
                .isBeforeCohortStart="${isBeforeCohortStart}"
                .isCohortStartSlot="${isCohortStartSlot}"
                .cohortStartDate="${cohort.start_date}"
                .prerequisiteProblems="${prerequisiteProblems}"
              ></gantt-cell>
            </td>
          `;
        })}
      </tr>
    `;
  }

  async _handleResetCohortClick(cohortId) {
    try {
      await CourseRunManager.resetCohortSchedule(cohortId);
      this.requestUpdate();
    } catch (error) {
      console.error("Kunde inte återställa kullens schema:", error);
    }
  }

  _handleAutoFillCohortClick(cohortId) {
    this._handleAutoFillCohortClickAsync(cohortId);
  }

  async _handleAutoFillCohortClickAsync(cohortId) {
    const key = String(cohortId);
    if (this._autoFillInProgressByCohort.has(key) || store.isReconciling) {
      return;
    }

    this._autoFillInProgressByCohort.add(key);
    this.requestUpdate();
    try {
      await CourseRunManager.autoFillCohortSchedule(cohortId);
      this.requestUpdate();
    } catch (error) {
      console.error("Kunde inte auto-fylla kullens schema:", error);
    } finally {
      this._autoFillInProgressByCohort.delete(key);
      this.requestUpdate();
    }
  }

  _getRunSpan(run) {
    const spanFromRun = Number(run?.slot_span);
    if (Number.isFinite(spanFromRun) && spanFromRun >= 2) return spanFromRun;

    const course = store.getCourse(run?.course_id);
    const credits = Number(course?.credits);
    return credits === 15 ? 2 : 1;
  }

  _getRunSlotDates(run, slotDates) {
    if (!run) return [];

    // Prefer explicit slot_ids when present (backend provides these).
    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      const fromIds = run.slot_ids
        .map((slotId) => store.getSlot(slotId)?.start_date)
        .filter(Boolean);
      if (fromIds.length > 0) return fromIds;
    }

    const startDate = store.getSlot(run.slot_id)?.start_date;
    if (!startDate) return [];

    const span = this._getRunSpan(run);
    const idx = slotDates.indexOf(startDate);
    if (idx === -1) return [startDate];
    return slotDates.slice(idx, idx + span);
  }

  _parseDragDataFromEvent(e) {
    try {
      const raw = e?.dataTransfer?.getData("text/plain");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  _adjustSlotDateForDrag(slotDate) {
    const offset = Number(this._dragDropManager?.state?.draggingSlotOffset || 0);
    if (!offset) return slotDate;

    const slotDates = [
      ...new Set((store.getSlots() || []).map((s) => s.start_date)),
    ].sort();
    const idx = slotDates.indexOf(slotDate);
    const adjustedIdx = idx - offset;
    if (idx === -1 || adjustedIdx < 0) return null;
    return slotDates[adjustedIdx] || null;
  }

  _handleSlotCellDragOver(e) {
    const td = e.currentTarget;
    if (!td || td.dataset.disabled === "true") {
      if (e?.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }

    // Allow dropping anywhere inside the td (not just over the inner content).
    e.preventDefault();

    const adjustedSlotDate = this._adjustSlotDateForDrag(td.dataset.slotDate);
    if (!adjustedSlotDate) {
      td.classList.remove("drag-over");
      td.classList.add("drag-over-invalid");
      if (e?.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }

    // If dragging the latter part of a 15hp span, validate against the *start* slot.
    const adjustedTd = this.shadowRoot?.querySelector(
      `.gantt-table td.slot-cell[data-cohort-id="${td.dataset.cohortId}"][data-slot-date="${adjustedSlotDate}"]`
    );
    if (adjustedTd?.dataset?.disabled === "true") {
      td.classList.remove("drag-over");
      td.classList.add("drag-over-invalid");
      if (e?.dataTransfer) e.dataTransfer.dropEffect = "none";
      return;
    }

    this._dragDropManager.handleCellDragOver({
      detail: {
        slotDate: adjustedSlotDate,
        cohortId: Number(td.dataset.cohortId),
        cell: td,
      },
    });
  }

  _handleSlotCellDragLeave(e) {
    const td = e.currentTarget;
    if (!td) return;
    this._dragDropManager.handleCellDragLeave({
      detail: { cell: td },
    });
  }

  async _handleSlotCellDrop(e) {
    const td = e.currentTarget;
    if (!td || td.dataset.disabled === "true") return;

    e.preventDefault();

    const data = this._parseDragDataFromEvent(e);
    if (!data) return;

    const adjustedSlotDate = this._adjustSlotDateForDrag(td.dataset.slotDate);
    if (!adjustedSlotDate) return;

    // Reuse the same drop logic & cleanup (including overlay clearing).
    await this._handleCellDrop({
      detail: {
        data,
        slotDate: adjustedSlotDate,
        cohortId: Number(td.dataset.cohortId),
        cell: td,
      },
    });
  }

  /**
   * Scheduling-only prerequisite evaluation:
   * Uses transitive prerequisites (A -> B -> C implies A is prerequisite for C).
   * This does NOT modify persisted course prerequisites; it only affects UI warnings in scheduling.
   */
  _computeSchedulingPrerequisiteProblems() {
    const problems = [];
    const slotDates = [...new Set((store.getSlots() || []).map((s) => s.start_date))].sort();

    const runsByCohort = new Map();
    for (const run of store.getCourseRuns() || []) {
      for (const cohortId of run.cohorts || []) {
        const list = runsByCohort.get(cohortId) || [];
        list.push(run);
        runsByCohort.set(cohortId, list);
      }
    }

    const courseById = new Map();
    for (const course of store.getCourses() || []) {
      courseById.set(course.course_id, course);
    }

    for (const cohort of store.getCohorts() || []) {
      const runsInCohort = runsByCohort.get(cohort.cohort_id) || [];

      // First pass: compute base problems using transitive prerequisites.
      const baseProblemCourseIds = new Set();

      for (const run of runsInCohort) {
        const course = courseById.get(run.course_id);
        if (!course) continue;

        const runSlot = store.getSlot(run.slot_id);
        if (!runSlot) continue;

        const allPrereqs = store.getAllPrerequisites(course.course_id) || [];
        const uniquePrereqs = new Set(allPrereqs);
        if (uniquePrereqs.size === 0) continue;

        const runDate = new Date(runSlot.start_date);

        for (const prereqId of uniquePrereqs) {
          const prereqCourse = courseById.get(prereqId);
          if (!prereqCourse) continue;

          const prereqRun =
            runsInCohort.find((r) => r.course_id === prereqId) || null;

          if (!prereqRun) {
            const problem = {
              type: "missing",
              cohortId: cohort.cohort_id,
              cohortName: cohort.name,
              courseId: course.course_id,
              courseName: course.name,
              courseCode: course.code,
              runId: run.run_id,
              missingPrereqId: prereqCourse.course_id,
              missingPrereqName: prereqCourse.name,
              missingPrereqCode: prereqCourse.code,
            };
            problems.push(problem);
            baseProblemCourseIds.add(course.course_id);
            continue;
          }

          const prereqSlot = store.getSlot(prereqRun.slot_id);
          if (!prereqSlot) continue;

          const prereqEndDate = this._getRunEndDate(prereqRun, slotDates);

          if (prereqEndDate && runDate <= prereqEndDate) {
            const problem = {
              type: "before_prerequisite",
              cohortId: cohort.cohort_id,
              cohortName: cohort.name,
              courseId: course.course_id,
              courseName: course.name,
              courseCode: course.code,
              runId: run.run_id,
              missingPrereqId: prereqCourse.course_id,
              missingPrereqName: prereqCourse.name,
              missingPrereqCode: prereqCourse.code,
            };
            problems.push(problem);
            baseProblemCourseIds.add(course.course_id);
          }
        }
      }

      // Second pass: propagate "blocked" status forward in the chain.
      // If any direct prerequisite has a problem, then the dependent course should
      // also be marked as problematic in scheduling (even if it's placed after all prereqs).
      const problemCourseIds = new Set(baseProblemCourseIds);
      let changed = true;
      while (changed) {
        changed = false;
        for (const run of runsInCohort) {
          const course = courseById.get(run.course_id);
          if (!course) continue;
          if (problemCourseIds.has(course.course_id)) continue;
          if (!Array.isArray(course.prerequisites) || course.prerequisites.length === 0) {
            continue;
          }

          const hasProblematicDirectPrereq = course.prerequisites.some((pid) =>
            problemCourseIds.has(pid)
          );
          if (hasProblematicDirectPrereq) {
            problemCourseIds.add(course.course_id);
            changed = true;
          }
        }
      }

      // Add a single "chain blocked" problem for each course that is only problematic
      // due to a prerequisite having its own issues.
      for (const run of runsInCohort) {
        const course = courseById.get(run.course_id);
        if (!course) continue;
        if (!problemCourseIds.has(course.course_id)) continue;
        if (baseProblemCourseIds.has(course.course_id)) continue;

        const directPrereqs = Array.isArray(course.prerequisites)
          ? course.prerequisites
          : [];
        const blocking = directPrereqs
          .map((pid) => courseById.get(pid))
          .filter(Boolean)
          .filter((c) => problemCourseIds.has(c.course_id))
          .sort((a, b) => (a.code || "").localeCompare(b.code || ""))[0];

        if (!blocking) continue;

        problems.push({
          type: "blocked_by_prerequisite_chain",
          cohortId: cohort.cohort_id,
          cohortName: cohort.name,
          courseId: course.course_id,
          courseName: course.name,
          courseCode: course.code,
          runId: run.run_id,
          missingPrereqId: blocking.course_id,
          missingPrereqName: blocking.name,
          missingPrereqCode: blocking.code,
        });
      }
    }

    return problems;
  }

  _getRunEndDate(run, slotDates) {
    const dates = this._getRunSlotDates(run, slotDates);
    const lastDate = dates.length ? dates[dates.length - 1] : null;

    const lastSlot =
      (lastDate
        ? (store.getSlots() || []).find((s) => s.start_date === lastDate)
        : null) || store.getSlot(run?.slot_id);

    const range = getSlotRange(lastSlot);
    return range?.end || null;
  }

  _computeCohortSlotOverlapWarnings() {
    const warnings = [];
    const slotDates = [...new Set((store.getSlots() || []).map((s) => s.start_date))].sort();

    for (const cohort of store.getCohorts() || []) {
      const runsInCohort = (store.getCourseRuns() || []).filter((r) =>
        this._runHasCohort(r, cohort.cohort_id)
      );

      const uniqueCoursesBySlotDate = new Map();
      for (const run of runsInCohort) {
        if (run?.course_id == null) continue;
        const dates = this._getRunSlotDates(run, slotDates);
        if (dates.length === 0) continue;

        for (const dateStr of dates) {
          const courseIds = uniqueCoursesBySlotDate.get(dateStr) || new Set();
          courseIds.add(run.course_id);
          uniqueCoursesBySlotDate.set(dateStr, courseIds);
        }
      }

      const hasOverlap = Array.from(uniqueCoursesBySlotDate.values()).some(
        (set) => set.size > 1
      );
      if (!hasOverlap) continue;

      warnings.push({
        type: "multiple_courses_in_slot",
        cohortId: cohort.cohort_id,
        cohortName: cohort.name,
      });
    }

    return warnings;
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

    const runsInSlot = (store.getCourseRuns() || [])
      .filter((run) => this._runCoversSlotId(run, slot.slot_id))
      // Ignore orphan runs with no cohort (they shouldn't count as "scheduled" in the grid)
      .filter(
        (run) =>
          Array.isArray(run.cohorts) && run.cohorts.some((id) => id != null)
      );

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
                  ? null
                  : compatibleTeachers.map((teacher) => {
                      const isAssigned = assignedTeacherIds.includes(
                        teacher.teacher_id
                      );
                      const availability = this._teacherAvailabilityForCourseInSlot(
                        {
                          teacherId: teacher.teacher_id,
                          slot,
                          slotDate,
                          courseId: course.course_id,
                        }
                      );
                      const baseClass = isAssigned
                        ? "assigned-course"
                        : "has-course";
                      const rowClassName = [
                        "summary-teacher-row",
                        baseClass,
                        availability.classNameSuffix,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return html`
                        <div
                          class="${rowClassName}"
                          title=${availability.titleText}
                        >
                          <button
                            class="summary-teacher-pill"
                            type="button"
                            aria-pressed=${isAssigned ? "true" : "false"}
                            @click=${() =>
                              this._toggleTeacherAssignment({
                                runs: item.runs,
                                teacherId: teacher.teacher_id,
                                checked: !isAssigned,
                                slotDate,
                              })}
                          >
                            <span class="summary-toggle-text"
                              >${teacher.name}</span
                            >
                          </button>
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

  _runCoversSlotId(run, slotId) {
    if (!run || slotId == null) return false;
    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      return run.slot_ids.some((id) => String(id) === String(slotId));
    }
    if (String(run.slot_id) === String(slotId)) return true;

    const span = this._getRunSpan(run);
    if (!Number.isFinite(span) || span <= 1) return false;

    const ordered = (store.getSlots() || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_date) - new Date(b.start_date) ||
          Number(a.slot_id) - Number(b.slot_id)
      );
    const indexById = new Map(ordered.map((s, idx) => [String(s.slot_id), idx]));
    const startIdx = indexById.get(String(run.slot_id));
    const targetIdx = indexById.get(String(slotId));
    if (!Number.isFinite(startIdx) || !Number.isFinite(targetIdx)) return false;
    return targetIdx >= startIdx && targetIdx < startIdx + span;
  }

  _teacherAvailabilityForCourseInSlot({ teacherId, slot, slotDate, courseId }) {
    const normalizeDate = (v) => (v || "").split("T")[0];
    const slotDays = (store.getSlotDays(slot.slot_id) || [])
      .map(normalizeDate)
      .filter(Boolean);

    const hasSlotBusyEntry = (store.teacherAvailability || []).some(
      (a) =>
        String(a.teacher_id) === String(teacherId) &&
        String(a.slot_id) === String(slot.slot_id) &&
        a.type === "busy"
    );

    const isUnavailableOnDay = (day) =>
      hasSlotBusyEntry || store.isTeacherUnavailableOnDay(teacherId, day);

    const unavailableDaysInSlot = hasSlotBusyEntry
      ? slotDays
      : slotDays.filter((d) => store.isTeacherUnavailableOnDay(teacherId, d));

    let classNameSuffix = "";
    if (unavailableDaysInSlot.length > 0) {
      const activeDays = (
        store.getActiveCourseDaysInSlot(slot.slot_id, courseId) || []
      )
        .map(normalizeDate)
        .filter(Boolean)
        .filter((d) => slotDays.includes(d));

      if (activeDays.length > 0) {
        const unavailableActiveDays = activeDays.filter((d) =>
          isUnavailableOnDay(d)
        );
        if (unavailableActiveDays.length === 0) {
          classNameSuffix = "partial-availability";
        } else if (unavailableActiveDays.length === activeDays.length) {
          classNameSuffix = "course-unavailable";
        } else {
          classNameSuffix = "partial-conflict";
        }
      }
    }

    const titleText =
      classNameSuffix === "course-unavailable"
        ? "Otillgänglig för kursens kursdagar"
        : classNameSuffix === "partial-conflict"
          ? "Delvis otillgänglig för kursens kursdagar"
          : classNameSuffix === "partial-availability"
            ? "Otillgänglig i perioden (men inte på kursens kursdagar)"
            : store.isTeacherUnavailable(teacherId, slotDate, slot.slot_id)
              ? "Otillgänglig i perioden"
              : "Tillgänglig";

    return { classNameSuffix, titleText };
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
    let dropResult = null;
    try {
      dropResult = this._dragDropManager.handleCellDrop(e);

      if (dropResult) {
        const { type, data, slotDate, cohortId } = dropResult;
        if (type === "depot") {
          await CourseRunManager.createRunFromDepot(data, slotDate, cohortId);
        } else if (type === "existing") {
          await CourseRunManager.moveExistingRun(data, slotDate, cohortId);
        }
        this.requestUpdate();
      }
    } catch (error) {
      console.error("Kunde inte spara förändringen i schemat:", error);
    } finally {
      // Some browsers/components can miss dragend when the dragged element is re-rendered.
      // Ensure we always clear the header "availability bubbles" after drop.
      this._dragDropManager.handleDragEnd();
    }
  }

  _handleDepotDragOver(e) {
    this._dragDropManager.handleDepotDragOver(e);
  }

  _handleDepotDragLeave(e) {
    this._dragDropManager.handleDepotDragLeave(e);
  }

  async _handleDepotDrop(e) {
    let dropResult = null;
    try {
      dropResult = this._dragDropManager.handleDepotDrop(e);

      if (dropResult) {
        const { runId, targetCohortId } = dropResult;
        await CourseRunManager.removeCourseRunFromCohort(runId, targetCohortId);
        this.requestUpdate();
      }
    } catch (error) {
      console.error("Kunde inte ta bort kurstillfälle:", error);
    } finally {
      // Ensure overlays never "stick" after a drop back to depot.
      this._dragDropManager.handleDragEnd();
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
    this._teacherOverlayChipsBySlotDate = new Map();
    this._shouldShowTeacherAvailabilityOverlay = false;
    this._applyColumnTeacherShortageClasses();
    this.requestUpdate();
  }

  _setTeacherOverlayForCourse(courseId) {
    this._dragCourseId = courseId;

    const slotDates = [
      ...new Set((store.getSlots() || []).map((s) => s.start_date)),
    ].sort();
    const map = new Map();

    slotDates.forEach((slotDate) => {
      map.set(slotDate, this._computeTeacherOverlayChips(courseId, slotDate));
    });

    const compatibleCount = getCompatibleTeachersForCourse(courseId).length;
    this._shouldShowTeacherAvailabilityOverlay = compatibleCount > 0;

    this._teacherOverlayChipsBySlotDate = map;
    this._applyColumnTeacherShortageClasses();
    this.requestUpdate();
  }

  _computeTeacherOverlayChips(courseId, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return [];

    return getCompatibleTeachersForCourse(courseId).map((teacher) => {
      const availability = this._teacherAvailabilityForCourseInSlot({
        teacherId: teacher.teacher_id,
        slot,
        slotDate,
        courseId,
      });
      const label = (teacher.name || "").split(" ")[0] || teacher.name || "";
      return {
        teacherId: teacher.teacher_id,
        label,
        status: availability.classNameSuffix || "available",
        title: availability.titleText,
      };
    });
  }

  _applyColumnTeacherShortageClasses() {
    if (!this.shadowRoot) return;

    // Clear all existing shortage marks first.
    this.shadowRoot
      .querySelectorAll(".gantt-table td.slot-cell.no-teachers-available")
      .forEach((td) => td.classList.remove("no-teachers-available"));
  }
}

customElements.define("scheduling-tab", SchedulingTab);
