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
  };

  static styles = ganttCourseBlockStyles;

  constructor() {
    super();
    this.run = null;
    this.cohortId = null;
  }

  render() {
    if (!this.run) return html``;

    const course = store.getCourse(this.run.course_id);
    if (!course) return html``;

    const hasPrereqs = this._hasPrerequisites(course.course_id);
    const slot = store.getSlot(this.run.slot_id);
    const slotDate = slot?.start_date;
    const teacherShortageStatus = slotDate
      ? getTeacherShortageStatusForCourseInSlot(course.course_id, slotDate)
      : TEACHER_SHORTAGE_STATUS.OK;
    const hasTeacherShortage =
      teacherShortageStatus !== TEACHER_SHORTAGE_STATUS.OK;

    // Check for prerequisite problems
    const prerequisiteProblems = store.prerequisiteProblems || [];
    const courseProblems = prerequisiteProblems.filter(
      (p) => p.runId === this.run.run_id && p.cohortId === this.cohortId
    );

    const hasMissingPrereq = courseProblems.some((p) => p.type === "missing");
    const hasBeforePrereqProblem = courseProblems.some(
      (p) => p.type === "before_prerequisite"
    );

    // Build CSS classes
    let blockClasses = [];
    if (hasMissingPrereq) {
      blockClasses.push("missing-prerequisite");
    } else if (hasBeforePrereqProblem) {
      blockClasses.push("before-prerequisite");
    } else if (hasPrereqs) {
      blockClasses.push("prerequisite-course");
    } else {
      blockClasses.push("normal-course");
    }
    if (hasTeacherShortage) {
      blockClasses.push("teacher-shortage", teacherShortageStatus);
    }
    const bgColor = this._getCourseColor(course);
    const inlineStyle = `background-color: ${bgColor};`;
    const shortName = this._shortenCourseName(course.name);

    // Build tooltip
    let prereqInfo = hasPrereqs
      ? `\nSpärrkurser: ${this._getPrerequisiteNames(course.course_id)}`
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
        class="gantt-block ${blockClasses.join(" ")}"
        style="${inlineStyle}"
        draggable="true"
        data-run-id="${this.run.run_id}"
        data-cohort-id="${this.cohortId}"
        title="${title}"
        @dragstart="${this._handleDragStart}"
        @dragend="${this._handleDragEnd}"
      >
        ${hasMissingPrereq || hasBeforePrereqProblem
          ? html`<span class="warning-icon">⚠️</span>`
          : ""}
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
    const runId = e.currentTarget?.dataset?.runId;
    const cohortId = e.currentTarget?.dataset?.cohortId;
    if (runId == null || cohortId == null) return;

    e.dataTransfer.setData("text/plain", JSON.stringify({ runId, cohortId }));
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");

    // Dispatch event to parent
    this.dispatchEvent(
      new CustomEvent("course-drag-start", {
        detail: {
          runId: parseInt(runId),
          cohortId: parseInt(cohortId),
          courseId: this.run?.course_id,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleDragEnd(e) {
    e.currentTarget.classList.remove("dragging");

    this.dispatchEvent(
      new CustomEvent("course-drag-end", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _hasPrerequisites(courseId) {
    const course = store.getCourse(courseId);
    return course?.prerequisites && course.prerequisites.length > 0;
  }

  _getAllPrerequisites(courseId) {
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

  _getPrerequisiteNames(courseId) {
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

  _getCourseColor(course) {
    if (!course) return "#666";

    const prereqCount = this._getAllPrerequisites(course.course_id).length;
    if (prereqCount > 0) {
      if (prereqCount === 1) return "#2d1b4e";
      if (prereqCount === 2) return "#4a2c7a";
      if (prereqCount === 3) return "#6f42c1";
      return "#9c88ff";
    }

    return this._getNormalCourseColor(course);
  }

  _getNormalCourseColor(course) {
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
