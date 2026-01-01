import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { ganttCourseBlockStyles } from "../styles/gantt-course-block.styles.js";
import {
  getTeacherShortageStatusForCourseInSlot,
  TEACHER_SHORTAGE_STATUS,
} from "../services/teacher-availability.service.js";

/**
 * Gantt Course Block Component - Displays a course in the Gantt chart
 * Handles drag-start for moving courses between slots
 */
export class GanttCourseBlock extends LitElement {
  static properties = {
    run: { type: Object },
    cohortId: { type: Number },
    prerequisiteProblems: { type: Array },
    isSecondBlock: { type: Boolean },
    renderContext: { type: Object },
    disabled: { type: Boolean },
  };

  static styles = ganttCourseBlockStyles;

  constructor() {
    super();
    this.run = null;
    this.cohortId = null;
    this.prerequisiteProblems = [];
    this.isSecondBlock = false;
    this.renderContext = null;
    this.disabled = false;
  }

  render() {
    if (!this.run) return html``;

    const context = this.renderContext;
    const course =
      context?.courseById?.get(String(this.run.course_id)) ||
      store.getCourse(this.run.course_id);
    if (!course) return html``;

    const hasPrereqs = this._hasPrerequisites(course.course_id, context);
    const slot =
      context?.slotById?.get(String(this.run.slot_id)) ||
      store.getSlot(this.run.slot_id);
    const slotDate = slot?.start_date;
    const teacherShortageStatus = slotDate
      ? this._getTeacherShortageStatus(
          course.course_id,
          slotDate,
          slot,
          context
        )
      : TEACHER_SHORTAGE_STATUS.OK;
    const hasTeacherShortage =
      teacherShortageStatus !== TEACHER_SHORTAGE_STATUS.OK;

    // Check for prerequisite problems
    const prerequisiteProblems = Array.isArray(this.prerequisiteProblems)
      ? this.prerequisiteProblems
      : store.prerequisiteProblems || [];
    const courseProblems = prerequisiteProblems.filter(
      (p) => p.runId === this.run.run_id && p.cohortId === this.cohortId
    );

    const hasMissingPrereq = courseProblems.some((p) => p.type === "missing");
    const hasBeforePrereqProblem = courseProblems.some(
      (p) => p.type === "before_prerequisite"
    );
    const hasChainBlockedProblem = courseProblems.some(
      (p) => p.type === "blocked_by_prerequisite_chain"
    );

    // Build CSS classes
    let blockClasses = [];
    if (hasMissingPrereq) {
      blockClasses.push("missing-prerequisite");
    } else if (hasBeforePrereqProblem || hasChainBlockedProblem) {
      blockClasses.push("before-prerequisite");
    } else if (hasPrereqs) {
      blockClasses.push("prerequisite-course");
    } else {
      blockClasses.push("normal-course");
    }
    if (hasTeacherShortage) {
      blockClasses.push("teacher-shortage", teacherShortageStatus);
    }
    const colorToken = this._getCourseColorToken(course);
    const textToken = this._getCourseTextToken(course);
    const bgColor = `var(${colorToken})`;
    const inlineStyle = `background-color: ${bgColor}; --course-text-color: var(${textToken});`;
    const shortName = this._shortenCourseName(course.name);

    // Build tooltip
    let prereqInfo = hasPrereqs
      ? `\nSpärrkurser: ${this._getPrerequisiteNames(
          course.course_id,
          context
        )}`
      : "";

    if (hasMissingPrereq) {
      const missingPrereqs = courseProblems
        .filter((p) => p.type === "missing")
        .map((p) => p.missingPrereqCode);
      prereqInfo += `\n⚠️ SAKNAR SPÄRRKURS: ${missingPrereqs.join(", ")}`;
    }

    if (hasBeforePrereqProblem) {
      const beforePrereqs = courseProblems
        .filter((p) => p.type === "before_prerequisite")
        .map((p) => p.missingPrereqCode);
      prereqInfo += `\n⚠️ FÖRE SPÄRRKURS: ${beforePrereqs.join(", ")}`;
    }

    if (hasChainBlockedProblem) {
      const blockedBy = courseProblems
        .filter((p) => p.type === "blocked_by_prerequisite_chain")
        .map((p) => p.missingPrereqCode)
        .filter(Boolean);

      prereqInfo += blockedBy.length
        ? `\n⚠️ SPÄRRKEDJA: spärrkursen "${blockedBy.join(
            ", "
          )}" har problem längre bak i kedjan`
        : "\n⚠️ SPÄRRKEDJA: spärrkurskedjan har problem längre bak";
    }

    let teacherInfo = "";
    if (teacherShortageStatus === TEACHER_SHORTAGE_STATUS.NO_COMPATIBLE_TEACHERS) {
      teacherInfo = "\nLÄRARVARNING: Inga kompatibla lärare för kursen";
    } else if (
      teacherShortageStatus ===
      TEACHER_SHORTAGE_STATUS.NO_AVAILABLE_COMPATIBLE_TEACHERS
    ) {
      teacherInfo =
        "\nLÄRARVARNING: Inga tillgängliga kompatibla lärare i denna slot";
    }

    const title = `${course.code}: ${course.name}${prereqInfo}${teacherInfo}`;

    return html`
      <div
        class="gantt-block ${blockClasses.join(" ")} ${this.isSecondBlock
          ? "second-block"
          : ""}"
        style="${inlineStyle}"
        draggable="${this.disabled ? "false" : "true"}"
        aria-disabled="${this.disabled ? "true" : "false"}"
        data-run-id="${this.run.run_id}"
        data-cohort-id="${this.cohortId}"
        title="${title}"
        @dragstart="${this._handleDragStart}"
        @dragend="${this._handleDragEnd}"
      >
        ${hasTeacherShortage
          ? html`<span class="teacher-warning-badge" aria-label="Lärarvarning"
              >!</span
            >`
          : ""}
        <span class="course-code">${course.code}</span>
        <span class="course-name">${shortName}</span>
      </div>
    `;
  }

  _handleDragStart(e) {
    if (this.disabled) return;
    const runId = e.currentTarget?.dataset?.runId;
    const cohortId = e.currentTarget?.dataset?.cohortId;
    if (runId == null || cohortId == null) return;

    const slotOffset = this.isSecondBlock ? 1 : 0;
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ runId, cohortId, slotOffset })
    );
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");

    // Dispatch event to parent
    this.dispatchEvent(
      new CustomEvent("course-drag-start", {
        detail: {
          runId: parseInt(runId),
          cohortId: parseInt(cohortId),
          courseId: this.run?.course_id,
          slotOffset,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleDragEnd(e) {
    if (this.disabled) return;
    e.currentTarget.classList.remove("dragging");

    this.dispatchEvent(
      new CustomEvent("course-drag-end", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _hasPrerequisites(courseId, context) {
    const course =
      context?.courseById?.get(String(courseId)) || store.getCourse(courseId);
    return course?.prerequisites && course.prerequisites.length > 0;
  }

  _getPrerequisiteNames(courseId, context) {
    const course =
      context?.courseById?.get(String(courseId)) || store.getCourse(courseId);
    if (!course?.prerequisites || course.prerequisites.length === 0) {
      return "-";
    }

    return course.prerequisites
      .map((prereqId) => {
        const prereqCourse =
          context?.courseById?.get(String(prereqId)) ||
          store.getCourse(prereqId);
        return prereqCourse ? prereqCourse.code : null;
      })
      .filter(Boolean)
      .join(", ");
  }

  _getTeacherShortageStatus(courseId, slotDate, slot, context) {
    if (!context) {
      return getTeacherShortageStatusForCourseInSlot(courseId, slotDate);
    }

    const key = `${courseId}:${slotDate}`;
    if (context.teacherShortageStatusByCourseSlotDate?.has(key)) {
      return context.teacherShortageStatusByCourseSlotDate.get(key);
    }

    const compatibleTeachers =
      context.compatibleTeachersByCourseId?.get(String(courseId)) || [];
    if (compatibleTeachers.length === 0) {
      context.teacherShortageStatusByCourseSlotDate?.set(
        key,
        TEACHER_SHORTAGE_STATUS.NO_COMPATIBLE_TEACHERS
      );
      return TEACHER_SHORTAGE_STATUS.NO_COMPATIBLE_TEACHERS;
    }

    const resolvedSlot =
      slot || context.slotByStartDate?.get(String(slotDate));
    if (!resolvedSlot) {
      context.teacherShortageStatusByCourseSlotDate?.set(
        key,
        TEACHER_SHORTAGE_STATUS.OK
      );
      return TEACHER_SHORTAGE_STATUS.OK;
    }

    const runsForCourseInSlot = (context.runs || []).filter(
      (r) =>
        String(r.slot_id) === String(resolvedSlot.slot_id) &&
        String(r.course_id) === String(courseId)
    );

    const hasAssignedTeacher = runsForCourseInSlot.some(
      (r) => Array.isArray(r.teachers) && r.teachers.length > 0
    );
    if (hasAssignedTeacher) {
      context.teacherShortageStatusByCourseSlotDate?.set(
        key,
        TEACHER_SHORTAGE_STATUS.OK
      );
      return TEACHER_SHORTAGE_STATUS.OK;
    }

    const availableTeachers = compatibleTeachers.filter(
      (teacher) =>
        !this._isTeacherUnavailableInSlot(
          teacher.teacher_id,
          resolvedSlot,
          slotDate,
          context
        )
    );

    if (availableTeachers.length === 0) {
      context.teacherShortageStatusByCourseSlotDate?.set(
        key,
        TEACHER_SHORTAGE_STATUS.NO_AVAILABLE_COMPATIBLE_TEACHERS
      );
      return TEACHER_SHORTAGE_STATUS.NO_AVAILABLE_COMPATIBLE_TEACHERS;
    }

    context.teacherShortageStatusByCourseSlotDate?.set(
      key,
      TEACHER_SHORTAGE_STATUS.OK
    );
    return TEACHER_SHORTAGE_STATUS.OK;
  }

  _isTeacherUnavailableInSlot(teacherId, slot, slotDate, context) {
    if (!context) {
      return store.isTeacherUnavailable(teacherId, slotDate, slot?.slot_id);
    }
    const slotId = slot?.slot_id;
    if (slotId == null) {
      return store.isTeacherUnavailable(teacherId, slotDate, slotId);
    }
    const slotSet = context.slotBusyByTeacher?.get(String(teacherId));
    if (slotSet?.has(String(slotId))) return true;

    const slotDays = context.slotDaysBySlotId?.get(String(slotId)) || [];
    if (slotDays.length === 0) return false;
    const daySet = context.dayBusyByTeacher?.get(String(teacherId)) || new Set();
    let count = 0;
    for (const day of slotDays) {
      if (daySet.has(context.normalizeDate(day))) {
        count += 1;
      }
    }
    return count > 0 && count === slotDays.length;
  }

  _getCourseColorToken(course) {
    if (!course) return "--color-course-fallback";
    const tokens = [
      "--color-course-1",
      "--color-course-2",
      "--color-course-3",
      "--color-course-4",
      "--color-course-5",
      "--color-course-6",
      "--color-course-7",
      "--color-course-8",
      "--color-course-9",
      "--color-course-10",
      "--color-course-11",
      "--color-course-12",
    ];
    const colorIndex = (course.course_id || 0) % tokens.length;
    return tokens[colorIndex];
  }

  _getCourseTextToken(course) {
    if (!course) return "--color-course-text-fallback";
    const tokens = [
      "--color-course-text-1",
      "--color-course-text-2",
      "--color-course-text-3",
      "--color-course-text-4",
      "--color-course-text-5",
      "--color-course-text-6",
      "--color-course-text-7",
      "--color-course-text-8",
      "--color-course-text-9",
      "--color-course-text-10",
      "--color-course-text-11",
      "--color-course-text-12",
    ];
    const colorIndex = (course.course_id || 0) % tokens.length;
    return tokens[colorIndex];
  }

  _shortenCourseName(name) {
    if (!name) return "";

    let short = name
      .replace(" för fastighetsmäklare", "")
      .replace(" för fastighetsförmedlare", "")
      .replace("Fastighetsförmedling - ", "")
      .replace("Fastighetsförmedling", "Förmedling");

    if (short.length > 20) {
      short = short.substring(0, 18) + "...";
    }

    return short;
  }
}

customElements.define("gantt-course-block", GanttCourseBlock);
