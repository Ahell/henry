import { LitElement, html } from "lit";
import { store } from "../../../platform/store/DataStore.js";
import { ganttSummaryRowStyles } from "../styles/gantt-summary-row.styles.js";

/**
 * Gantt Summary Row - Shows course summary with teacher assignment per slot
 */
export class GanttSummaryRow extends LitElement {
  static properties = {
    slotDates: { type: Array },
  };

  static styles = ganttSummaryRowStyles;

  constructor() {
    super();
    this.slotDates = [];
  }

  render() {
    return html`
      <td class="summary-label" colspan="2">Kurser & Lärare:</td>
      ${this.slotDates.map((dateStr) => this._renderSummaryCell(dateStr))}
    `;
  }

  _renderSummaryCell(dateStr) {
    const courseSummary = this._getCourseSummaryForSlot(dateStr);

    return html`
      <td class="summary-cell">
        ${courseSummary.map((item) => {
          const course = item.course;
          const bgColor = this._getCourseColor(course);
          const runs = item.runs;
          const assignedTeachers = item.assignedTeachers;
          const availableTeachers = item.availableTeachers;

          return html`
            <div class="summary-course" style="background-color: ${bgColor};">
              <div class="course-header">
                <span class="course-name" title="${course.name}"
                  >${course.code}</span
                >
                <span class="participant-count"
                  >${item.totalParticipants} st</span
                >
              </div>
              ${availableTeachers.length > 0
                ? html`
                    <div class="summary-teacher-list">
                      ${availableTeachers.map(
                        (teacher) => html`
                          <div
                            class="summary-teacher-row ${assignedTeachers.includes(
                              teacher.teacher_id
                            )
                              ? "assigned"
                              : ""}"
                          >
                            <input
                              type="checkbox"
                              id="summary-${dateStr}-${course.course_id}-${teacher.teacher_id}"
                              .checked="${assignedTeachers.includes(
                                teacher.teacher_id
                              )}"
                              @change="${(e) =>
                                this._handleTeacherToggle(
                                  runs,
                                  teacher.teacher_id,
                                  e.target.checked,
                                  dateStr
                                )}"
                            />
                            <label
                              for="summary-${dateStr}-${course.course_id}-${teacher.teacher_id}"
                            >
                              ${teacher.name}
                            </label>
                          </div>
                        `
                      )}
                    </div>
                  `
                : ""}
            </div>
          `;
        })}
      </td>
    `;
  }

  _getCourseSummaryForSlot(slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return [];

    const runs = store
      .getCourseRuns()
      .filter((r) => r.slot_id === slot.slot_id);

    const courseMap = new Map();

    for (const run of runs) {
      const course = store.getCourse(run.course_id);
      if (!course) continue;

      let totalParticipants = 0;
      if (run.cohorts && run.cohorts.length > 0) {
        for (const cohortId of run.cohorts) {
          const cohort = store
            .getCohorts()
            .find((c) => c.cohort_id === cohortId);
          if (cohort) {
            totalParticipants += cohort.planned_size || 0;
          }
        }
      }

      if (!courseMap.has(course.course_id)) {
        courseMap.set(course.course_id, {
          course,
          totalParticipants: 0,
          runs: [],
          assignedTeachers: new Set(),
        });
      }

      const entry = courseMap.get(course.course_id);
      entry.totalParticipants += totalParticipants;
      entry.runs.push(run);

      if (run.teachers && run.teachers.length > 0) {
        run.teachers.forEach((tid) => entry.assignedTeachers.add(tid));
      }
    }

    return Array.from(courseMap.values())
      .map((entry) => {
        const teachers = store.getTeachers();
        const assignedTeacherIds = Array.from(entry.assignedTeachers);

        const availableTeachers = teachers.filter((t) => {
          if (
            !t.compatible_courses ||
            !t.compatible_courses.includes(entry.course.course_id)
          ) {
            return false;
          }
          const isAssignedToThisCourse = assignedTeacherIds.includes(
            t.teacher_id
          );
          const isUnavailable = store.isTeacherUnavailable(
            t.teacher_id,
            slotDate
          );
          return isAssignedToThisCourse || !isUnavailable;
        });

        return {
          course: entry.course,
          totalParticipants: entry.totalParticipants,
          runs: entry.runs,
          assignedTeachers: assignedTeacherIds,
          availableTeachers,
        };
      })
      .sort((a, b) => {
        const aHasPrereqs = this._hasPrerequisites(a.course.course_id);
        const bHasPrereqs = this._hasPrerequisites(b.course.course_id);
        if (aHasPrereqs && !bHasPrereqs) return -1;
        if (!aHasPrereqs && bHasPrereqs) return 1;
        return a.course.name.localeCompare(b.course.name);
      });
  }

  _handleTeacherToggle(runs, teacherId, checked, slotDate) {
    this.dispatchEvent(
      new CustomEvent("teacher-toggle", {
        detail: { runs, teacherId, checked, slotDate },
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
}

customElements.define("gantt-summary-row", GanttSummaryRow);
