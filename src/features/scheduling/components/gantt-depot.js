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
    renderContext: { type: Object },
    disabled: { type: Boolean },
  };

  static styles = ganttDepotStyles;

  constructor() {
    super();
    this.cohortId = null;
    this.scheduledCourseIds = [];
    this.renderContext = null;
    this.disabled = false;
  }

  render() {
    const context = this.renderContext;
    const courses = context?.courses || store.getCourses();

    // Filter out already scheduled courses
    const scheduledSet = new Set(
      (this.scheduledCourseIds || []).map((id) => String(id))
    );
    const availableCourses = courses.filter(
      (c) => !scheduledSet.has(String(c.course_id))
    );

    // Sort courses: those with prerequisites first (cache to avoid repeated scans)
    const prereqCache = new Map();
    const getPrereqs = (courseId) => {
      const key = String(courseId);
      if (!prereqCache.has(key)) {
        prereqCache.set(key, this._getAllPrerequisites(courseId));
      }
      return prereqCache.get(key) || [];
    };

    const sortedCourses = availableCourses.slice().sort((a, b) => {
      const aPrereqs = getPrereqs(a.course_id);
      const bPrereqs = getPrereqs(b.course_id);
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
    const colorToken = this._getCourseColorToken(course);
    const textToken = this._getCourseTextToken(course);
    const bgColor = `var(${colorToken})`;
    const inlineStyle = `background-color: ${bgColor}; --course-text-color: var(${textToken});`;

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
	        draggable="${this.disabled ? "false" : "true"}"
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
    if (this.disabled) return;
    const courseId = e.currentTarget?.dataset?.courseId;
    const cohortId = e.currentTarget?.dataset?.cohortId;
    if (courseId == null || cohortId == null) return;

    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        courseId,
        cohortId,
        fromDepot: true,
      })
    );
    e.dataTransfer.effectAllowed = "copyMove";
    e.currentTarget.classList.add("dragging");

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
    if (this.disabled) return;
    e.currentTarget.classList.remove("dragging");

    // Dispatch event to parent to clear overlays
    this.dispatchEvent(
      new CustomEvent("depot-drag-end", {
        bubbles: true,
        composed: true,
      })
    );
  }

  _getAllPrerequisites(courseId) {
    const context = this.renderContext;
    const course =
      context?.courseById?.get(String(courseId)) || store.getCourse(courseId);
    if (!course || !course.prerequisites || course.prerequisites.length === 0) {
      return [];
    }

    const allPrereqs = new Set();
    const stack = [...course.prerequisites];

    while (stack.length > 0) {
      const prereqId = stack.pop();
      if (allPrereqs.has(prereqId)) continue;

      allPrereqs.add(prereqId);
      const prereqCourse =
        context?.courseById?.get(String(prereqId)) ||
        store.getCourse(prereqId);
      if (prereqCourse?.prerequisites) {
        prereqCourse.prerequisites.forEach((p) => stack.push(p));
      }
    }

    return Array.from(allPrereqs);
  }

  _hasPrerequisites(courseId) {
    const context = this.renderContext;
    const course =
      context?.courseById?.get(String(courseId)) || store.getCourse(courseId);
    return course?.prerequisites && course.prerequisites.length > 0;
  }

  _getPrerequisiteNames(courseId) {
    const context = this.renderContext;
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

customElements.define("gantt-depot", GanttDepot);
