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

    const slotsOrdered = (store.getSlots() || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_date) - new Date(b.start_date) ||
          Number(a.slot_id) - Number(b.slot_id)
      );
    const slotIndexById = new Map(
      slotsOrdered.map((s, idx) => [String(s.slot_id), idx])
    );

    const targetSlotExisting = slotsOrdered.find(
      (s) => s.start_date === targetSlotDate
    );
    const targetSlotIdx = targetSlotExisting
      ? slotIndexById.get(String(targetSlotExisting.slot_id))
      : null;

    // 15hp (span>1) courses may only start on the first slot of the span.
    // If the same course is already running and this slot is a continuation
    // slot, we must block starting it here.
    const spanForCourse = Number(course?.credits) === 15 ? 2 : 1;
    if (spanForCourse > 1 && Number.isFinite(targetSlotIdx)) {
      const hasBlockingContinuation = (CourseRunManager._runs() || []).some(
        (r) => {
          if (Number(r.course_id) !== Number(courseId)) return false;

          const idxs = Array.isArray(r.slot_ids) && r.slot_ids.length > 0
            ? r.slot_ids
                .map((sid) => slotIndexById.get(String(sid)))
                .filter((v) => Number.isFinite(v))
            : (() => {
                const startIdx = slotIndexById.get(String(r.slot_id));
                const span = Number(r?.slot_span) >= 2
                  ? Number(r.slot_span)
                  : Number(store.getCourse(r.course_id)?.credits) === 15
                    ? 2
                    : 1;
                if (!Number.isFinite(startIdx)) return [];
                return Array.from({ length: span }, (_, i) => startIdx + i);
              })();

          if (idxs.length === 0) return false;
          const startIdx = Math.min(...idxs);
          return idxs.includes(targetSlotIdx) && startIdx < targetSlotIdx;
        }
      );

      if (hasBlockingContinuation) return;
    }

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
        slot_span: spanForCourse,
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

    const course = store.getCourse(run.course_id);
    const spanForCourse = Number(course?.credits) === 15 ? 2 : 1;

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

      // 15hp (span>1) courses may only start on the first slot of the span.
      // Block moving a course-run to a continuation slot of an already-running
      // course span in another cohort.
      if (spanForCourse > 1 && targetSlot) {
        const slotsOrdered = (store.getSlots() || [])
          .slice()
          .sort(
            (a, b) =>
              new Date(a.start_date) - new Date(b.start_date) ||
              Number(a.slot_id) - Number(b.slot_id)
          );
        const slotIndexById = new Map(
          slotsOrdered.map((s, idx) => [String(s.slot_id), idx])
        );
        const targetSlotIdx = slotIndexById.get(String(targetSlot.slot_id));

        if (Number.isFinite(targetSlotIdx)) {
          const hasBlockingContinuation = (CourseRunManager._runs() || []).some(
            (r) => {
              if (String(r.run_id) === String(runId)) return false;
              if (Number(r.course_id) !== Number(run.course_id)) return false;

              const idxs = Array.isArray(r.slot_ids) && r.slot_ids.length > 0
                ? r.slot_ids
                    .map((sid) => slotIndexById.get(String(sid)))
                    .filter((v) => Number.isFinite(v))
                : (() => {
                    const startIdx = slotIndexById.get(String(r.slot_id));
                    const span = Number(r?.slot_span) >= 2
                      ? Number(r.slot_span)
                      : Number(store.getCourse(r.course_id)?.credits) === 15
                        ? 2
                        : 1;
                    if (!Number.isFinite(startIdx)) return [];
                    return Array.from({ length: span }, (_, i) => startIdx + i);
                  })();

              if (idxs.length === 0) return false;
              const startIdx = Math.min(...idxs);
              return idxs.includes(targetSlotIdx) && startIdx < targetSlotIdx;
            }
          );
          if (hasBlockingContinuation) return;
        }
      }

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

  /**
   * Auto-fill a cohort's schedule across slots, respecting:
   * - max 1 course per slot per cohort
   * - prerequisites (including spans; 15hp occupies 2 slots)
   * - max students per course+slot across cohorts (hard cap 130)
   *
   * This schedules ONLY the selected cohort and adapts to already scheduled
   * cohorts (the order the user clicks "Auto-fyll" becomes the "master" signal).
   */
  static async autoFillCohortSchedule(
    targetCohortId,
    { maxStudentsHard = 130, maxStudentsPreferred = 100 } = {}
  ) {
    const cohortId = Number(targetCohortId);
    if (!Number.isFinite(cohortId)) return { mutationId: null };

    const cohort = store.getCohort(cohortId);
    if (!cohort) return { mutationId: null };

    const slots = store.getSlots() || [];
    const slotDates = [...new Set(slots.map((s) => s.start_date))].sort();
    if (slotDates.length === 0) return { mutationId: null };

    const slotByStartDate = new Map(slots.map((s) => [s.start_date, s]));
    const slotIndexById = new Map(
      slots
        .slice()
        .sort(
          (a, b) =>
            new Date(a.start_date) - new Date(b.start_date) ||
            Number(a.slot_id) - Number(b.slot_id)
        )
        .map((s, idx) => [String(s.slot_id), idx])
    );

    const parseDateOnly = (dateStr) => {
      if (typeof dateStr !== "string") return null;
      const parts = dateStr.split("-");
      if (parts.length !== 3) return null;
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
        return null;
      }
      return new Date(y, m - 1, d);
    };

    const cohortStart = parseDateOnly(cohort.start_date);
    // Courses for a cohort should start in the first slot whose start_date is
    // on/after the cohort start date (never before).
    const startSlotIdx = (() => {
      if (!cohortStart) return 0;
      const idx = slotDates.findIndex((d) => {
        const sd = parseDateOnly(d);
        return sd ? sd >= cohortStart : false;
      });
      return idx === -1 ? slotDates.length : idx;
    })();

    const cohortHasAnyScheduledCourse = (CourseRunManager._runs() || []).some(
      (r) =>
        Array.isArray(r?.cohorts) &&
        r.cohorts.some((id) => String(id) === String(cohortId))
    );

    // We are only allowed to change course placement in slots AFTER today's date.
    // Auto-fill will therefore keep any existing placements up to and including
    // today, and only (re)plan from the first slot whose start_date is > today.
    const today = (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    })();
    const firstSlotAfterTodayIdx = (() => {
      const idx = slotDates.findIndex((d) => {
        const sd = parseDateOnly(d);
        return sd ? sd > today : false;
      });
      return idx === -1 ? slotDates.length : idx;
    })();
    const planningStartIdx = cohortHasAnyScheduledCourse
      ? Math.max(startSlotIdx, firstSlotAfterTodayIdx)
      : startSlotIdx;

    const courses = store.getCourses() || [];
    const courseById = new Map(courses.map((c) => [Number(c.course_id), c]));
    const prereqsById = new Map(
      courses.map((c) => [Number(c.course_id), Array.isArray(c.prerequisites) ? c.prerequisites : []])
    );
    const spanById = new Map(
      courses.map((c) => [Number(c.course_id), Number(c?.credits) === 15 ? 2 : 1])
    );

    // Auto-fill rule order:
    // 1) Prerequisite order is ALWAYS a hard constraint (handled in canPlaceCourseAt/isPrereqsMet).
    // 2) Economy: maximize co-reading across cohorts (alignment), up to max students.

    // Build totals per (slotIdx, courseId) across all already scheduled cohorts.
    const cohorts = store.getCohorts() || [];
    const cohortSizeById = new Map(
      cohorts.map((c) => [String(c.cohort_id), Number(c.planned_size) || 0])
    );

    const runStartIdxFor = (run) => {
      if (!run) return null;
      if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
        const idxs = run.slot_ids
          .map((sid) => slotIndexById.get(String(sid)))
          .filter((v) => Number.isFinite(v));
        if (idxs.length > 0) return Math.min(...idxs);
      }
      const startIdx = slotIndexById.get(String(run.slot_id));
      return Number.isFinite(startIdx) ? startIdx : null;
    };

    const shouldRemoveFromTargetAfterToday = (run) => {
      if (!cohortHasAnyScheduledCourse) return false;
      const cohortsInRun = Array.isArray(run?.cohorts) ? run.cohorts : [];
      if (!cohortsInRun.some((id) => String(id) === String(cohortId))) return false;
      const runStartIdx = runStartIdxFor(run);
      return Number.isFinite(runStartIdx) && runStartIdx >= planningStartIdx;
    };

    const totalsBySlotIdx = new Map(); // slotIdx -> Map(courseId -> totalStudents)
    const startsTotalsBySlotIdx = new Map(); // startSlotIdx -> Map(courseId -> totalStudents)
    const blockedStartSlotIdxByCourse = new Map(); // courseId -> Set(slotIdx)
    const occupiedSlotIdxForTarget = new Set();
    const scheduledCoursesForTarget = new Set();
    const completionEndIdxByCourse = new Map(); // courseId -> end slotIdx

    const runSpanFor = (run) => {
      const spanFromRun = Number(run?.slot_span);
      if (Number.isFinite(spanFromRun) && spanFromRun >= 2) return spanFromRun;
      return spanById.get(Number(run?.course_id)) || 1;
    };

    const coveredSlotIdxsForRun = (run) => {
      if (!run) return [];
      if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
        const idxs = run.slot_ids
          .map((sid) => slotIndexById.get(String(sid)))
          .filter((v) => Number.isFinite(v));
        if (idxs.length > 0) return idxs.sort((a, b) => a - b);
      }
      const startIdx = slotIndexById.get(String(run.slot_id));
      if (!Number.isFinite(startIdx)) return [];
      const span = runSpanFor(run);
      const idxs = [];
      for (let i = 0; i < span; i += 1) idxs.push(startIdx + i);
      return idxs.filter((i) => i >= 0 && i < slotDates.length);
    };

    for (const run of CourseRunManager._runs() || []) {
      const courseId = Number(run.course_id);
      if (!courseById.has(courseId)) continue;

      // Simulate "future-only" replanning for this cohort:
      // If this run would be removed (because it starts after today), it should
      // not affect totals/scoring/occupied slots.
      const cohortsInRunRaw = Array.isArray(run.cohorts) ? run.cohorts : [];
      const willRemoveTarget = shouldRemoveFromTargetAfterToday(run);
      const cohortsInRun = willRemoveTarget
        ? cohortsInRunRaw.filter((id) => String(id) !== String(cohortId))
        : cohortsInRunRaw;
      if (cohortsInRun.length === 0) continue;

      const slotIdxs = coveredSlotIdxsForRun(run);
      if (slotIdxs.length === 0) continue;

      const runStartIdx = runStartIdxFor(run);
      if (Number.isFinite(runStartIdx)) {
        slotIdxs.forEach((idx) => {
          if (idx === runStartIdx) return;
          if (!blockedStartSlotIdxByCourse.has(courseId)) {
            blockedStartSlotIdxByCourse.set(courseId, new Set());
          }
          blockedStartSlotIdxByCourse.get(courseId).add(idx);
        });
      }

      for (const cid of cohortsInRun) {
        if (cid == null) continue;
        const size = cohortSizeById.get(String(cid)) || 0;

        if (Number.isFinite(runStartIdx)) {
          if (!startsTotalsBySlotIdx.has(runStartIdx)) {
            startsTotalsBySlotIdx.set(runStartIdx, new Map());
          }
          const m = startsTotalsBySlotIdx.get(runStartIdx);
          m.set(courseId, (m.get(courseId) || 0) + size);
        }

        for (const slotIdx of slotIdxs) {
          if (!totalsBySlotIdx.has(slotIdx)) totalsBySlotIdx.set(slotIdx, new Map());
          const m = totalsBySlotIdx.get(slotIdx);
          m.set(courseId, (m.get(courseId) || 0) + size);
        }

        if (String(cid) === String(cohortId)) {
          scheduledCoursesForTarget.add(courseId);
          slotIdxs.forEach((i) => occupiedSlotIdxForTarget.add(i));
          const endIdx = Math.max(...slotIdxs);
          completionEndIdxByCourse.set(
            courseId,
            Math.max(completionEndIdxByCourse.get(courseId) ?? -1, endIdx)
          );
        }
      }
    }

    const remainingCourseIds = new Set(
      courses
        .map((c) => Number(c.course_id))
        .filter((id) => id != null && !scheduledCoursesForTarget.has(id))
    );

    const isPrereqsMet = (courseId, slotIdx) => {
      const prereqs = prereqsById.get(courseId) || [];
      return prereqs.every((pid) => {
        const doneAt = completionEndIdxByCourse.get(Number(pid));
        return Number.isFinite(doneAt) && doneAt < slotIdx;
      });
    };

    const canPlaceCourseAt = (courseId, slotIdx) => {
      if (blockedStartSlotIdxByCourse.get(courseId)?.has(slotIdx)) return false;
      const span = spanById.get(courseId) || 1;
      if (slotIdx + span - 1 >= slotDates.length) return false;
      for (let i = 0; i < span; i += 1) {
        if (occupiedSlotIdxForTarget.has(slotIdx + i)) return false;
      }
      if (!isPrereqsMet(courseId, slotIdx)) return false;
      return true;
    };

    const fitsCapacityAt = (courseId, slotIdx) => {
      const cohortSize = Number(cohort.planned_size) || 0;
      const span = spanById.get(courseId) || 1;
      for (let i = 0; i < span; i += 1) {
        const idx = slotIdx + i;
        const cur = totalsBySlotIdx.get(idx)?.get(courseId) || 0;
        if (cur + cohortSize > maxStudentsHard) return false;
      }
      return true;
    };

    const projectedMaxTotal = (courseId, slotIdx) => {
      const cohortSize = Number(cohort.planned_size) || 0;
      const span = spanById.get(courseId) || 1;
      let max = 0;
      for (let i = 0; i < span; i += 1) {
        const idx = slotIdx + i;
        const cur = totalsBySlotIdx.get(idx)?.get(courseId) || 0;
        max = Math.max(max, cur + cohortSize);
      }
      return max;
    };

    // Forward-looking economy scoring:
    // Prefer choices that still leave capacity for upcoming cohorts to align
    // with the same (course, slot start) later.
    const futureCohortMeta = (cohorts || [])
      .filter((c) => Number(c?.cohort_id) > Number(cohortId))
      .map((c) => ({
        size: Number(c?.planned_size) || 0,
        start: parseDateOnly(c?.start_date),
      }))
      .filter((c) => Number.isFinite(c.size) && c.size > 0 && c.start);

    const futureSizesBySlotIdx = new Map();
    slotDates.forEach((d, idx) => {
      const sd = parseDateOnly(d);
      if (!sd) {
        futureSizesBySlotIdx.set(idx, []);
        return;
      }
      const sizes = futureCohortMeta
        .filter((c) => c.start <= sd)
        .map((c) => c.size)
        .sort((a, b) => a - b);
      futureSizesBySlotIdx.set(idx, sizes);
    });

    const potentialFutureJoinStudents = (slotIdx, remainingCapacity) => {
      if (!Number.isFinite(remainingCapacity) || remainingCapacity <= 0) return 0;
      const sizes = futureSizesBySlotIdx.get(slotIdx) || [];
      let sum = 0;
      for (const size of sizes) {
        if (sum + size > remainingCapacity) break;
        sum += size;
      }
      return sum;
    };

    const scoreCourse = (courseId, slotIdx) => {
      // Align to courses that *start* in this slot (not continuations of 15hp spans).
      const alignedStudents = startsTotalsBySlotIdx.get(slotIdx)?.get(courseId) || 0;
      const projected = projectedMaxTotal(courseId, slotIdx);
      const overPreferred = Math.max(0, projectedMaxTotal(courseId, slotIdx) - maxStudentsPreferred);

      let score = 0;
      // Economy first: strongly prefer aligning with courses already starting in this slot.
      score += alignedStudents > 0 ? 100000 + alignedStudents * 10 : 0;
      // Prefer packing runs closer to the hard cap (fewer separate runs overall).
      score += projected * 2;
      // Forward-looking: leave room for upcoming cohorts (that have started by this slot)
      // to also align in this same run later.
      const remainingCapacity = maxStudentsHard - projected;
      score += potentialFutureJoinStudents(slotIdx, remainingCapacity) * 5;
      // Soft: avoid exceeding preferred threshold when possible.
      score -= overPreferred * 5;
      return score;
    };

    const teachersToAssignForCourseInSlot = (courseId, slotId) => {
      const existingRuns = (CourseRunManager._runs() || []).filter(
        (r) => String(r.slot_id) === String(slotId) && Number(r.course_id) === Number(courseId)
      );
      if (existingRuns.length === 0) return [];
      const teachers = new Set();
      existingRuns.forEach((r) => {
        (r.teachers || []).forEach((tid) => teachers.add(tid));
      });
      return Array.from(teachers);
    };

    const placeCourse = (courseId, slotIdx) => {
      const slotDate = slotDates[slotIdx];
      const slot = slotByStartDate.get(slotDate);
      if (!slot) return false;

      const span = spanById.get(courseId) || 1;
      const teachers = teachersToAssignForCourseInSlot(courseId, slot.slot_id);

      store.addCourseRun({
        course_id: courseId,
        slot_id: slot.slot_id,
        cohorts: [cohortId],
        teachers,
        slot_span: span,
      });

      const cohortSize = Number(cohort.planned_size) || 0;
      for (let i = 0; i < span; i += 1) {
        const idx = slotIdx + i;
        occupiedSlotIdxForTarget.add(idx);
        if (!totalsBySlotIdx.has(idx)) totalsBySlotIdx.set(idx, new Map());
        const m = totalsBySlotIdx.get(idx);
        m.set(courseId, (m.get(courseId) || 0) + cohortSize);
      }
      completionEndIdxByCourse.set(courseId, slotIdx + span - 1);
      remainingCourseIds.delete(courseId);
      return true;
    };

    const previousRuns = (CourseRunManager._runs() || []).map((r) => ({
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
      label: "auto-fill-cohort",
      rollback: () => {
        store.courseRunsManager.courseRuns = previousRuns;
        store.courseRunsManager.courseSlots = previousCourseSlots;
        store.courseSlotDays = previousCourseSlotDays;
        store.notify();
      },
    });

    try {
      // Step 0: Remove this cohort's runs that start after today (future-only replanning).
      if (cohortHasAnyScheduledCourse && planningStartIdx < slotDates.length) {
        const runs = CourseRunManager._runs();
        let didChange = false;

        for (let idx = runs.length - 1; idx >= 0; idx -= 1) {
          const run = runs[idx];
          if (!shouldRemoveFromTargetAfterToday(run)) continue;

          const cohortsInRun = Array.isArray(run?.cohorts) ? run.cohorts : [];
          const nextCohorts = cohortsInRun.filter(
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
        }
      }

      // Fill earliest possible, leaving gaps only if no valid course can be placed.
      for (let slotIdx = planningStartIdx; slotIdx < slotDates.length; slotIdx += 1) {
        if (remainingCourseIds.size === 0) break;
        if (occupiedSlotIdxForTarget.has(slotIdx)) continue;

        const eligible = Array.from(remainingCourseIds).filter(
          (cid) => canPlaceCourseAt(cid, slotIdx) && fitsCapacityAt(cid, slotIdx)
        );
        if (eligible.length === 0) continue;

        eligible.sort((a, b) => scoreCourse(b, slotIdx) - scoreCourse(a, slotIdx));
        const chosen = eligible[0];
        placeCourse(chosen, slotIdx);
      }

      store.notify();
      await store.saveData({ mutationId });
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    }
  }
}
