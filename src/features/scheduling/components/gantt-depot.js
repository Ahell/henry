import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { ganttDepotStyles } from "../styles/gantt-depot.styles.js";

/**
 * Gantt Depot Component - Shows available courses for a cohort
 * Handles drag-start for courses from depot
 */
export class GanttDepot extends LitElement {
  static properties = {
    cohortId: { type: Number },
    scheduledCourseIds: { type: Array },
  };

  static styles = ganttDepotStyles;

  constructor() {
    super();
    this.cohortId = null;
    this.scheduledCourseIds = [];
  }

  render() {
    const courses = store.getCourses();

    // Filter out already scheduled courses
    const scheduledSet = new Set(this.scheduledCourseIds);
    const availableCourses = courses.filter(
      (c) => !scheduledSet.has(c.course_id)
    );

    // Sort courses: those with prerequisites first
    const sortedCourses = availableCourses.sort((a, b) => {
      const aPrereqs = this._getAllPrerequisites(a.course_id);
      const bPrereqs = this._getAllPrerequisites(b.course_id);
      const aHasPrereqs = aPrereqs.length > 0;
      const bHasPrereqs = bPrereqs.length > 0;

      if (aHasPrereqs && !bHasPrereqs) return -1;
      if (!aHasPrereqs && bHasPrereqs) return 1;

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
        ${sortedCourses.map((course) => this._renderDepotBlock(course))}
      </div>
    `;
  }

  _renderDepotBlock(course) {
    const hasPrereqs = this._hasPrerequisites(course.course_id);
    const blockClass = hasPrereqs ? "prerequisite-course" : "normal-course";

    const shortName = this._shortenCourseName(course.name);
    const bgColor = this._getCourseColor(course);
    const inlineStyle = `background-color: ${bgColor};`;

    const prereqNames = hasPrereqs
      ? this._getPrerequisiteNames(course.course_id)
      : "";
    const title = `${course.code}: ${course.name}${
      hasPrereqs ? "\nSpärrkurser: " + prereqNames : ""
    }`;

    return html`
      <div
        class="depot-block ${blockClass}"
        style="${inlineStyle}"
        draggable="true"
        data-course-id="${course.course_id}"
        data-cohort-id="${this.cohortId}"
        data-from-depot="true"
        title="${title}"
        @dragstart="${this._handleDragStart}"
        @dragend="${this._handleDragEnd}"
      >
        <span class="course-code">${course.code}</span>
        <span class="course-name">${shortName}</span>
      </div>
    `;
  }

  _handleDragStart(e) {
    const courseId = e.target.dataset.courseId;
    const cohortId = e.target.dataset.cohortId;

    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        courseId,
        cohortId,
        fromDepot: true,
      })
    );
    e.dataTransfer.effectAllowed = "copyMove";
    e.target.classList.add("dragging");

    // Dispatch event to parent to show available teachers
    this.dispatchEvent(
      new CustomEvent("depot-drag-start", {
        detail: {
          courseId: parseInt(courseId),
          cohortId: parseInt(cohortId),
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleDragEnd(e) {
    e.target.classList.remove("dragging");

    // Dispatch event to parent to clear overlays
    this.dispatchEvent(
      new CustomEvent("depot-drag-end", {
        bubbles: true,
        composed: true,
      })
    );
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

  _hasPrerequisites(courseId) {
    const course = store.getCourse(courseId);
    return course?.prerequisites && course.prerequisites.length > 0;
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

customElements.define("gantt-depot", GanttDepot);
