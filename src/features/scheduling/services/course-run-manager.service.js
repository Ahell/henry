import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";

/**
 * Course Run Manager Service
 * Manages course run creation, updates, and teacher assignments
 */
export class CourseRunManager {
  /**
   * Create a course run from depot drop
   * @param {Object} data - Drop data
   * @param {string} targetSlotDate - Target slot date
   * @param {number} targetCohortId - Target cohort ID
   */
  static createRunFromDepot(data, targetSlotDate, targetCohortId) {
    const courseId = parseInt(data.courseId);
    const fromCohortId = parseInt(data.cohortId);
    const course = store.getCourse(courseId);

    if (!course) return;

    // Prevent cross-cohort drops unless course already exists in slot
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
        return; // Block cross-cohort drop
      }
    }

    // Find or create target slot
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

    // Create the course run
    store.addCourseRun({
      course_id: courseId,
      slot_id: targetSlot.slot_id,
      cohorts: [targetCohortId],
      teachers: teachersToAssign,
    });
  }

  /**
   * Move an existing course run to a new slot
   * @param {Object} data - Drop data with runId
   * @param {string} targetSlotDate - Target slot date
   * @param {number} targetCohortId - Target cohort ID
   */
  static moveExistingRun(data, targetSlotDate, targetCohortId) {
    const runId = parseInt(data.runId);
    const fromCohortId = parseInt(data.cohortId);

    // Only allow moving within same cohort
    if (fromCohortId !== targetCohortId) {
      return;
    }

    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (!run) return;

    // Find or create target slot
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

    // Update run's slot
    run.slot_id = targetSlot.slot_id;

    store.notify();
  }

  /**
   * Toggle teacher assignment for course runs
   * @param {Array} runs - Course runs to update
   * @param {number} teacherId - Teacher ID
   * @param {boolean} checked - Whether to assign or unassign
   * @param {string} slotDate - Slot date
   */
  static toggleTeacherAssignment(runs, teacherId, checked, slotDate) {
    if (checked) {
      // When assigning a teacher, remove them from other courses in same slot
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
              this.checkAndRemoveCourseIfNoTeachersAvailable(
                otherRun.course_id,
                slotDate
              );
            }
          }
        }
      }
    }

    // Toggle teacher in target runs
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

    // Check if course should be removed when unchecking
    if (!checked && runs.length > 0) {
      this.checkAndRemoveCourseIfNoTeachersAvailable(
        runs[0].course_id,
        slotDate
      );
    }

    store.notify();
  }

  /**
   * Check if a course should be removed due to no available teachers
   * @param {number} courseId - Course ID
   * @param {string} slotDate - Slot date
   */
  static checkAndRemoveCourseIfNoTeachersAvailable(courseId, slotDate) {
    const slot = store.getSlots().find((s) => s.start_date === slotDate);
    if (!slot) return;

    const runsForCourse = store
      .getCourseRuns()
      .filter((r) => r.slot_id === slot.slot_id && r.course_id === courseId);

    if (runsForCourse.length === 0) return;

    // Check if any run has assigned teachers
    const hasAssignedTeacher = runsForCourse.some(
      (r) => r.teachers && r.teachers.length > 0
    );
    if (hasAssignedTeacher) return;

    // Get teachers assigned to this course
    const teachers = store.getTeachers();
    const teachersAssignedToThisCourse = new Set();
    runsForCourse.forEach((r) => {
      if (r.teachers) {
        r.teachers.forEach((tid) => teachersAssignedToThisCourse.add(tid));
      }
    });

    // Check for available compatible teachers
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

    // Remove all runs for this course in this slot
    for (const run of runsForCourse) {
      const index = store.courseRuns.findIndex((r) => r.run_id === run.run_id);
      if (index !== -1) {
        store.courseRuns.splice(index, 1);
      }
    }
  }

  /**
   * Remove course run from depot (return to depot)
   * @param {number} runId - Run ID
   * @param {number} targetCohortId - Cohort ID to remove from
   */
  static removeCourseRunFromCohort(runId, targetCohortId) {
    const run = store.courseRuns.find((r) => r.run_id === runId);
    if (!run) return;

    // Remove cohort from run
    run.cohorts = run.cohorts.filter((id) => id !== targetCohortId);

    // If no cohorts left, remove the run entirely
    if (run.cohorts.length === 0) {
      const index = store.courseRuns.indexOf(run);
      if (index > -1) {
        store.courseRuns.splice(index, 1);
      }
    }

    store.notify();
  }
}
