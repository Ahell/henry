import { store } from "../../../platform/store/DataStore.js";

/**
 * Teacher Availability Overlay Service
 * Manages teacher availability visualization during drag operations
 */
export class TeacherAvailabilityOverlay {
  /**
   * Get available teachers for a specific slot
   * @param {number} courseId - Course ID
   * @param {string} slotDate - Slot date (YYYY-MM-DD)
   * @param {number} targetCohortId - Cohort ID
   * @returns {Array} Available teachers
   */
  static getAvailableTeachersForSlot(courseId, slotDate, targetCohortId) {
    const teachers = store.getTeachers();
    const compatibleTeachers = teachers.filter(
      (t) => t.compatible_courses && t.compatible_courses.includes(courseId)
    );

    return compatibleTeachers.filter((t) => {
      const isUnavailable = store.isTeacherUnavailable(t.teacher_id, slotDate);
      return !isUnavailable;
    });
  }

  /**
   * Show available teachers overlay for a specific cohort
   * Highlights cells where teachers are available/unavailable
   * @param {ShadowRoot} shadowRoot - Component shadow root
   * @param {number} cohortId - Cohort ID to show overlay for
   * @param {number} courseId - Course ID being dragged
   */
  static showOverlayForCohort(shadowRoot, cohortId, courseId) {
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) => teacher.compatible_courses?.includes(courseId));

    const cells = shadowRoot.querySelectorAll(
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

      // Get teachers already teaching this course in this slot
      const teachersAlreadyTeachingThisCourse = new Set();
      existingRunsForCourse.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) =>
            teachersAlreadyTeachingThisCourse.add(tid)
          );
        }
      });

      // Filter for available teachers
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

  /**
   * Show available teachers overlay for all cohorts
   * Used when dragging from depot (course can go to any cohort)
   * @param {ShadowRoot} shadowRoot - Component shadow root
   * @param {number} courseId - Course ID being dragged
   */
  static showOverlayForAllCohorts(shadowRoot, courseId) {
    const compatibleTeachers = store
      .getTeachers()
      .filter((teacher) => teacher.compatible_courses?.includes(courseId));

    const cells = shadowRoot.querySelectorAll("gantt-cell");

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

      // Get teachers already teaching this course in this slot
      const teachersAlreadyTeachingThisCourse = new Set();
      existingRunsForCourse.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) =>
            teachersAlreadyTeachingThisCourse.add(tid)
          );
        }
      });

      // Filter for available teachers
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

  /**
   * Clear all teacher availability overlays
   * Removes visual indicators from cells
   * @param {ShadowRoot} shadowRoot - Component shadow root
   */
  static clearOverlays(shadowRoot) {
    const cells = shadowRoot.querySelectorAll("gantt-cell");
    cells.forEach((cell) => {
      cell.availableTeachers = [];
      const td = cell.closest("td");
      if (td) td.classList.remove("no-teachers-available");
    });
  }
}
