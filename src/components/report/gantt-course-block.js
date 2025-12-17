import { LitElement, html, css } from "lit";
import { store } from "../../core/store/DataStore.js";

/**
 * Gantt Course Block Component - Displays a course in the Gantt chart
 * Handles drag-start for moving courses between slots
 */
export class GanttCourseBlock extends LitElement {
  static properties = {
    run: { type: Object },
    cohortId: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
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

    .gantt-block .course-code {
      font-weight: bold;
      font-size: 0.6rem;
      position: relative;
      z-index: 2;
    }

    .gantt-block .course-name {
      font-size: 0.55rem;
      font-weight: normal;
      opacity: 0.9;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      position: relative;
      z-index: 2;
    }

    .gantt-block .warning-icon {
      position: relative;
      z-index: 2;
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

    .gantt-block.missing-prerequisite {
      border: 4px solid #f44336 !important;
      animation: pulse-warning-red 1s infinite;
      box-shadow: 0 0 12px rgba(244, 67, 54, 0.7);
      outline: 3px solid rgba(244, 67, 54, 0.3);
      outline-offset: 2px;
    }

    @keyframes pulse-warning-red {
      0%,
      100% {
        box-shadow: 0 0 12px rgba(244, 67, 54, 0.7);
        border-color: #f44336;
      }
      50% {
        box-shadow: 0 0 24px rgba(244, 67, 54, 1);
        border-color: #d32f2f;
      }
    }

    .gantt-block.before-prerequisite {
      border: 4px dashed #ff9800 !important;
      animation: pulse-warning-orange 1.5s infinite;
      box-shadow: inset 0 0 0 2px rgba(255, 152, 0, 0.3);
      position: relative;
    }

    .gantt-block.before-prerequisite::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 8px,
        rgba(255, 152, 0, 0.15) 8px,
        rgba(255, 152, 0, 0.15) 16px
      );
      pointer-events: none;
      z-index: 1;
    }

    @keyframes pulse-warning-orange {
      0%,
      100% {
        border-color: #ff9800;
      }
      50% {
        border-color: #f57c00;
      }
    }

    .prerequisite-course {
      color: #fff;
    }

    .normal-course {
      background: #007bff;
    }

    .two-block-course {
      border: 2px dashed rgba(255, 255, 255, 0.7);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
    }
  `;

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

    const title = `${course.code}: ${course.name}${prereqInfo}`;

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
        <span class="course-code">${course.code}</span>
        <span class="course-name">${shortName}</span>
      </div>
    `;
  }

  _handleDragStart(e) {
    const runId = e.target.dataset.runId;
    const cohortId = e.target.dataset.cohortId;

    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ runId, cohortId })
    );
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");

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
    e.target.classList.remove("dragging");

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
