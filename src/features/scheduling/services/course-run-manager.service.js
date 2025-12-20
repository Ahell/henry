import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";

/**
 * Course Run Manager Service
 * Manages course run creation, updates, and teacher assignments
 */
export class CourseRunManager {
  static _runs() {
    return store.getCourseRuns();
  }

  static _runById(runId) {
    return CourseRunManager._runs().find((r) => String(r.run_id) === String(runId));
  }

  /**
   * Create a course run from depot drop
   * @param {Object} data - Drop data
   * @param {string} targetSlotDate - Target slot date
   * @param {number} targetCohortId - Target cohort ID
   */
  static async createRunFromDepot(data, targetSlotDate, targetCohortId) {
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

    let createdSlot = null;
    let createdRun = null;

    const mutationId = store.applyOptimistic({
      label: "create-course-run",
      rollback: () => {
        if (createdRun) {
          const runs = CourseRunManager._runs();
          const index = runs.findIndex(
            (r) => String(r.run_id) === String(createdRun.run_id)
          );
          if (index !== -1) {
            runs.splice(index, 1);
          }
        }
        if (createdSlot) {
          store.deleteSlot(createdSlot.slot_id);
        }
      },
    });

    try {
      if (!targetSlot) {
        const startDate = new Date(targetSlotDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
        targetSlot = store.addSlot({
          start_date: targetSlotDate,
          end_date: endDate.toISOString().split("T")[0],
          evening_pattern: "tis/tor",
          is_placeholder: false,
        });
        createdSlot = targetSlot;
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
      createdRun = store.addCourseRun({
        course_id: courseId,
        slot_id: targetSlot.slot_id,
        cohorts: [targetCohortId],
        teachers: teachersToAssign,
      });

      await store.saveData({ mutationId });
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    }
  }

  /**
   * Move an existing course run to a new slot
   * @param {Object} data - Drop data with runId
   * @param {string} targetSlotDate - Target slot date
   * @param {number} targetCohortId - Target cohort ID
   */
  static async moveExistingRun(data, targetSlotDate, targetCohortId) {
    const runId = parseInt(data.runId);
    const fromCohortId = parseInt(data.cohortId);

    // Only allow moving within same cohort
    if (fromCohortId !== targetCohortId) {
      return;
    }

    const run = CourseRunManager._runById(runId);
    if (!run) return;

    const previousSlotId = run.slot_id;
    let createdSlot = null;

    const mutationId = store.applyOptimistic({
      label: "move-course-run",
      rollback: () => {
        run.slot_id = previousSlotId;
        if (createdSlot) {
          store.deleteSlot(createdSlot.slot_id);
        }
      },
    });

    try {
      // Find or create target slot
      let targetSlot = store
        .getSlots()
        .find((s) => s.start_date === targetSlotDate);

      if (!targetSlot) {
        const startDate = new Date(targetSlotDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
        targetSlot = store.addSlot({
          start_date: targetSlotDate,
          end_date: endDate.toISOString().split("T")[0],
          evening_pattern: "tis/tor",
          is_placeholder: false,
        });
        createdSlot = targetSlot;
      }

      // Update run's slot
      run.slot_id = targetSlot.slot_id;

      store.notify();
      await store.saveData({ mutationId });
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    }
  }

  /**
   * Toggle teacher assignment for course runs
   * @param {Array} runs - Course runs to update
   * @param {number} teacherId - Teacher ID
   * @param {boolean} checked - Whether to assign or unassign
   * @param {string} slotDate - Slot date
   */
  static async toggleTeacherAssignment(runs, teacherId, checked, slotDate) {
    // Capture state for rollback
    const previousState = new Map();
    const slot = store.getSlots().find((s) => s.start_date === slotDate);

    const runCoversSlotId = (run, slotId) => {
      if (!run || slotId == null) return false;
      if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
        return run.slot_ids.some((id) => String(id) === String(slotId));
      }
      return String(run.slot_id) === String(slotId);
    };

    const coveredSlotIds = new Set();
    if (slot?.slot_id != null) coveredSlotIds.add(slot.slot_id);
    (runs || []).forEach((r) => {
      if (!r) return;
      if (Array.isArray(r.slot_ids) && r.slot_ids.length > 0) {
        r.slot_ids.forEach((sid) => coveredSlotIds.add(sid));
      } else if (r.slot_id != null) {
        coveredSlotIds.add(r.slot_id);
      }
    });

    for (const slotId of coveredSlotIds) {
      const allRunsCoveringSlot = store
        .getCourseRuns()
        .filter((r) => runCoversSlotId(r, slotId));
      allRunsCoveringSlot.forEach((run) => {
        if (!previousState.has(run.run_id)) {
          previousState.set(run.run_id, {
            teachers: run.teachers ? [...run.teachers] : [],
          });
        }
      });
    }

    runs.forEach((run) => {
      if (!previousState.has(run.run_id)) {
        previousState.set(run.run_id, {
          teachers: run.teachers ? [...run.teachers] : [],
        });
      }
    });

    const mutationId = store.applyOptimistic({
      label: "toggle-teacher-assignment",
      rollback: () => {
        previousState.forEach((state, runId) => {
          const run = CourseRunManager._runById(runId);
          if (run) {
            run.teachers = [...state.teachers];
          }
        });
      },
    });

    try {
      if (checked) {
        // When assigning a teacher, remove them from other courses in the same
        // slot period(s). For spanning runs (e.g. 15hp), this applies to all
        // covered slot_ids so a teacher can't be double-booked in the tail slot.
        const targetCourseId = runs.length > 0 ? runs[0].course_id : null;
        for (const slotId of coveredSlotIds) {
          const allRunsCoveringSlot = store
            .getCourseRuns()
            .filter((r) => runCoversSlotId(r, slotId));

          for (const otherRun of allRunsCoveringSlot) {
            if (otherRun.course_id !== targetCourseId && otherRun.teachers) {
              otherRun.teachers = otherRun.teachers.filter((id) => id !== teacherId);
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

      store.notify();

      await store.saveData({ mutationId });
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    }
  }

  /**
   * Remove course run from depot (return to depot)
   * @param {number} runId - Run ID
   * @param {number} targetCohortId - Cohort ID to remove from
   */
  static async removeCourseRunFromCohort(runId, targetCohortId) {
    const run = CourseRunManager._runById(runId);
    if (!run) return { mutationId: null };

    const previousCohorts = [...run.cohorts];
    let wasRemoved = false;

    const mutationId = store.applyOptimistic({
      label: "remove-course-run",
      rollback: () => {
        if (wasRemoved) {
          // Restore the run if it was removed
          CourseRunManager._runs().push({
            ...run,
            cohorts: previousCohorts,
          });
        } else {
          // Restore cohorts if run still exists
          const currentRun = CourseRunManager._runById(runId);
          if (currentRun) {
            currentRun.cohorts = previousCohorts;
          }
        }
      },
    });

    try {
      // Remove cohort from run
      run.cohorts = run.cohorts.filter((id) => id !== targetCohortId);

      // If no cohorts left, remove the run entirely
      if (run.cohorts.length === 0) {
        const runs = CourseRunManager._runs();
        const index = runs.indexOf(run);
        if (index > -1) {
          runs.splice(index, 1);
          wasRemoved = true;
        }
      }

      store.notify();
      await store.saveData({ mutationId });
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    }
  }

  /**
   * Remove all scheduled course runs from a cohort (send everything back to depot).
   * Keeps runs that are shared with other cohorts, but removes this cohort_id from them.
   */
  static async resetCohortSchedule(targetCohortId) {
    const cohortId = Number(targetCohortId);
    if (!Number.isFinite(cohortId)) return { mutationId: null };

    const runs = CourseRunManager._runs();
    const previousRuns = (runs || []).map((r) => ({
      ...r,
      teachers: Array.isArray(r.teachers) ? [...r.teachers] : [],
      cohorts: Array.isArray(r.cohorts) ? [...r.cohorts] : [],
      slot_ids: Array.isArray(r.slot_ids) ? [...r.slot_ids] : r.slot_ids,
    }));
    const previousCourseSlots = (store.courseRunsManager.courseSlots || []).map(
      (cs) => ({ ...cs })
    );
    const previousCourseSlotDays = (store.courseSlotDays || []).map((csd) => ({
      ...csd,
    }));

    const mutationId = store.applyOptimistic({
      label: "reset-cohort-schedule",
      rollback: () => {
        store.courseRunsManager.courseRuns = previousRuns;
        store.courseRunsManager.courseSlots = previousCourseSlots;
        store.courseSlotDays = previousCourseSlotDays;
        store.notify();
      },
    });

    try {
      let didChange = false;

      // Remove cohort from runs (and delete empty runs)
      for (let idx = runs.length - 1; idx >= 0; idx -= 1) {
        const run = runs[idx];
        const cohorts = Array.isArray(run?.cohorts) ? run.cohorts : [];
        if (!cohorts.some((id) => String(id) === String(cohortId))) continue;

        const nextCohorts = cohorts.filter(
          (id) => String(id) !== String(cohortId)
        );
        run.cohorts = nextCohorts;
        didChange = true;

        if (nextCohorts.length === 0) {
          runs.splice(idx, 1);
        }
      }

      // Clean up courseSlots + courseSlotDays for removed (course_id, slot_id) keys
      if (didChange) {
        const remainingKeys = new Set(
          (runs || [])
            .filter((r) => r?.course_id != null && r?.slot_id != null)
            .map((r) => `${r.course_id}-${r.slot_id}`)
        );

        const currentCourseSlots = store.courseRunsManager.courseSlots || [];
        const removedCourseSlotIds = new Set();
        const keptCourseSlots = currentCourseSlots.filter((cs) => {
          const keep = remainingKeys.has(`${cs.course_id}-${cs.slot_id}`);
          if (!keep && cs?.course_slot_id != null) {
            removedCourseSlotIds.add(cs.course_slot_id);
          }
          return keep;
        });

        store.courseRunsManager.courseSlots = keptCourseSlots;
        if (removedCourseSlotIds.size > 0) {
          store.courseSlotDays = (store.courseSlotDays || []).filter(
            (csd) => !removedCourseSlotIds.has(csd.course_slot_id)
          );
        }

        store.notify();
      }

      await store.saveData({ mutationId });
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    }
  }
}
