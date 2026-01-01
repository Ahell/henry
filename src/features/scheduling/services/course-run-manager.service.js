import { store, DEFAULT_SLOT_LENGTH_DAYS } from "../../../platform/store/DataStore.js";
import { getAvailableCompatibleTeachersForCourseInSlot } from "./teacher-availability.service.js";

/**
 * Course Run Manager Service
 * Manages course run creation, updates, and teacher assignments
 */
export class CourseRunManager {
  static async _persistMutation(mutationId) {
    store.beginEditLock();
    try {
      await store.saveData({ mutationId });
    } finally {
      store.endEditLock();
    }
  }
  static _runs() {
    return store.getCourseRuns();
  }

  static _sortedSlotDates() {
    return [...new Set((store.getSlots() || []).map((s) => s.start_date))].sort();
  }

  static _slotIdxByDate(slotDates) {
    return new Map((slotDates || []).map((d, idx) => [String(d), idx]));
  }

  static _runStartSlotIdx({ run, slotDates, slotIdxByDate, spanByCourseId }) {
    if (!run) return null;
    const span = spanByCourseId.get(Number(run.course_id)) || 1;

    // Prefer explicit slot_ids when present.
    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      const idxs = run.slot_ids
        .map((sid) => store.getSlot(sid)?.start_date)
        .map((d) => (d ? slotIdxByDate.get(String(d)) : null))
        .filter((v) => Number.isFinite(v));
      if (idxs.length > 0) return Math.min(...idxs);
    }

    const startDate = store.getSlot(run.slot_id)?.start_date;
    const startIdx = startDate ? slotIdxByDate.get(String(startDate)) : null;
    if (!Number.isFinite(startIdx)) return null;

    // Normalize weird cases: if slot_id points at something outside known slotDates, ignore.
    if (startIdx < 0 || startIdx >= slotDates.length) return null;
    return startIdx;
  }

  static _runCoveredSlotIdxs({ run, slotDates, slotIdxByDate, spanByCourseId }) {
    const startIdx = CourseRunManager._runStartSlotIdx({
      run,
      slotDates,
      slotIdxByDate,
      spanByCourseId,
    });
    if (!Number.isFinite(startIdx)) return [];

    const spanFromRun = Number(run?.slot_span);
    const span =
      Number.isFinite(spanFromRun) && spanFromRun >= 2
        ? spanFromRun
        : spanByCourseId.get(Number(run?.course_id)) || 1;

    const idxs = [];
    for (let i = 0; i < span; i += 1) idxs.push(startIdx + i);
    return idxs.filter((i) => i >= 0 && i < slotDates.length);
  }

  static _hasSkewedSpanOverlap({
    courseId,
    candidateStartIdx,
    candidateSpan,
    slotDates,
    slotIdxByDate,
    spanByCourseId,
    excludeRunId = null,
  }) {
    if (!Number.isFinite(candidateStartIdx) || candidateSpan <= 1) return false;

    const candidateEndExclusive = candidateStartIdx + candidateSpan;
    for (const run of CourseRunManager._runs() || []) {
      if (excludeRunId != null && String(run.run_id) === String(excludeRunId)) {
        continue;
      }
      if (Number(run.course_id) !== Number(courseId)) continue;

      const runStartIdx = CourseRunManager._runStartSlotIdx({
        run,
        slotDates,
        slotIdxByDate,
        spanByCourseId,
      });
      if (!Number.isFinite(runStartIdx)) continue;
      if (runStartIdx === candidateStartIdx) continue; // aligned start is ok

      const runSpanFromRun = Number(run?.slot_span);
      const runSpan =
        Number.isFinite(runSpanFromRun) && runSpanFromRun >= 2
          ? runSpanFromRun
          : spanByCourseId.get(Number(run?.course_id)) || 1;
      if (runSpan <= 1) continue;

      const runEndExclusive = runStartIdx + runSpan;
      const overlaps =
        candidateStartIdx < runEndExclusive && runStartIdx < candidateEndExclusive;
      if (overlaps) return true;
    }
    return false;
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

    const spanForCourse = Number(course?.credits) === 15 ? 2 : 1;

    if (spanForCourse > 1) {
      const slotDates = CourseRunManager._sortedSlotDates();
      const slotIdxByDate = CourseRunManager._slotIdxByDate(slotDates);
      const spanByCourseId = new Map(
        (store.getCourses() || []).map((c) => [
          Number(c.course_id),
          Number(c?.credits) === 15 ? 2 : 1,
        ])
      );
      const candidateStartIdx = slotIdxByDate.get(String(targetSlotDate));

      // Prevent *any* skewed overlap for 15hp courses (offset starts are forbidden).
      if (
        CourseRunManager._hasSkewedSpanOverlap({
          courseId,
          candidateStartIdx,
          candidateSpan: spanForCourse,
          slotDates,
          slotIdxByDate,
          spanByCourseId,
        })
      ) {
        return;
      }
    }

    // Business logic hard-rule: require at least one available compatible teacher (optional).
    const businessLogic = store.businessLogicManager?.getBusinessLogic?.();
    const schedulingLogic = businessLogic?.scheduling || {};
    const requireTeachersEnabled = Array.isArray(schedulingLogic.hardRules)
      ? schedulingLogic.hardRules.some(
          (r) => r?.id === "requireAvailableCompatibleTeachers" && r?.enabled !== false
        )
      : false;

    if (requireTeachersEnabled) {
      const slotDates = CourseRunManager._sortedSlotDates();
      const slotIdxByDate = CourseRunManager._slotIdxByDate(slotDates);
      const startIdx = slotIdxByDate.get(String(targetSlotDate));
      if (Number.isFinite(startIdx)) {
        const ids0 = new Set(
          getAvailableCompatibleTeachersForCourseInSlot(courseId, slotDates[startIdx]).map(
            (t) => t.teacher_id
          )
        );
        let intersection = ids0;
        for (let i = 1; i < spanForCourse; i += 1) {
          const date = slotDates[startIdx + i];
          const ids = new Set(
            getAvailableCompatibleTeachersForCourseInSlot(courseId, date).map(
              (t) => t.teacher_id
            )
          );
          intersection = new Set([...intersection].filter((id) => ids.has(id)));
        }
        if (intersection.size === 0) return;
      }
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

      await CourseRunManager._persistMutation(mutationId);
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
    const runCohorts = Array.isArray(run.cohorts) ? run.cohorts : [];
    const uniqueCohortIds = Array.from(
      new Set(runCohorts.filter((id) => id != null).map((id) => String(id)))
    );
    const hasMultipleCohorts = uniqueCohortIds.length > 1;

    if (hasMultipleCohorts) {
      // Move only the dragged cohort into its own joint run (or join existing).
      const previousRunCohorts = Array.isArray(run.cohorts)
        ? [...run.cohorts]
        : [];
      const previousCourseSlots = (store.courseRunsManager.courseSlots || []).map(
        (cs) => ({ ...cs })
      );
      const previousCourseSlotDays = (store.courseSlotDays || []).map((csd) => ({
        ...csd,
      }));
      let createdSlot = null;
      let createdRun = null;
      let targetRun = null;
      let previousTargetCohorts = null;

      const mutationId = store.applyOptimistic({
        label: "move-course-run",
        rollback: () => {
          run.cohorts = previousRunCohorts;
          if (targetRun && previousTargetCohorts) {
            targetRun.cohorts = previousTargetCohorts;
          }
          if (createdRun) {
            const runs = CourseRunManager._runs();
            const index = runs.findIndex(
              (r) => String(r.run_id) === String(createdRun.run_id)
            );
            if (index !== -1) runs.splice(index, 1);
          }
          if (createdSlot) {
            store.deleteSlot(createdSlot.slot_id);
          }
          store.courseRunsManager.courseSlots = previousCourseSlots;
          store.courseSlotDays = previousCourseSlotDays;
          store.notify();
        },
      });

      try {
        // Find or create target slot
        let targetSlot = store
          .getSlots()
          .find((s) => s.start_date === targetSlotDate);

        if (spanForCourse > 1) {
          const slotDates = CourseRunManager._sortedSlotDates();
          const slotIdxByDate = CourseRunManager._slotIdxByDate(slotDates);
          const spanByCourseId = new Map(
            (store.getCourses() || []).map((c) => [
              Number(c.course_id),
              Number(c?.credits) === 15 ? 2 : 1,
            ])
          );
          const candidateStartIdx = slotIdxByDate.get(String(targetSlotDate));

          // Prevent *any* skewed overlap for 15hp courses (offset starts are forbidden).
          if (
            CourseRunManager._hasSkewedSpanOverlap({
              courseId: run.course_id,
              candidateStartIdx,
              candidateSpan: spanForCourse,
              slotDates,
              slotIdxByDate,
              spanByCourseId,
            })
          ) {
            return;
          }
        }

        // Business logic hard-rule: require at least one available compatible teacher (optional).
        {
          const businessLogic = store.businessLogicManager?.getBusinessLogic?.();
          const schedulingLogic = businessLogic?.scheduling || {};
          const requireTeachersEnabled = Array.isArray(schedulingLogic.hardRules)
            ? schedulingLogic.hardRules.some(
                (r) => r?.id === "requireAvailableCompatibleTeachers" && r?.enabled !== false
              )
            : false;

          if (requireTeachersEnabled) {
            const slotDates = CourseRunManager._sortedSlotDates();
            const slotIdxByDate = CourseRunManager._slotIdxByDate(slotDates);
            const startIdx = slotIdxByDate.get(String(targetSlotDate));
            if (Number.isFinite(startIdx)) {
              const ids0 = new Set(
                getAvailableCompatibleTeachersForCourseInSlot(
                  run.course_id,
                  slotDates[startIdx]
                ).map((t) => t.teacher_id)
              );
              let intersection = ids0;
              for (let i = 1; i < spanForCourse; i += 1) {
                const date = slotDates[startIdx + i];
                const ids = new Set(
                  getAvailableCompatibleTeachersForCourseInSlot(
                    run.course_id,
                    date
                  ).map((t) => t.teacher_id)
                );
                intersection = new Set(
                  [...intersection].filter((id) => ids.has(id))
                );
              }
              if (intersection.size === 0) return;
            }
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

        if (String(targetSlot.slot_id) === String(run.slot_id)) {
          return;
        }

        const runCoversSlotId = (r, slotId) => {
          if (!r || slotId == null) return false;
          if (Array.isArray(r.slot_ids) && r.slot_ids.length > 0) {
            return r.slot_ids.some((id) => String(id) === String(slotId));
          }
          return String(r.slot_id) === String(slotId);
        };

        targetRun = (store.getCourseRuns() || []).find(
          (r) =>
            String(r?.course_id) === String(run.course_id) &&
            runCoversSlotId(r, targetSlot.slot_id)
        );
        if (targetRun && String(targetRun.run_id) !== String(run.run_id)) {
          previousTargetCohorts = Array.isArray(targetRun.cohorts)
            ? [...targetRun.cohorts]
            : [];
        }

        run.cohorts = (run.cohorts || []).filter(
          (id) => String(id) !== String(fromCohortId)
        );

        if (targetRun && String(targetRun.run_id) !== String(run.run_id)) {
          const nextCohorts = new Set(
            (Array.isArray(targetRun.cohorts) ? targetRun.cohorts : []).map(
              (id) => String(id)
            )
          );
          nextCohorts.add(String(targetCohortId));
          targetRun.cohorts = Array.from(nextCohorts).map((id) => Number(id));
        } else if (!targetRun) {
          const runs = CourseRunManager._runs();
          const nextId =
            runs.reduce((max, r) => Math.max(max, Number(r.run_id) || 0), 0) + 1;
          const spanFromRun = Number(run?.slot_span);
          const effectiveSpan =
            Number.isFinite(spanFromRun) && spanFromRun >= 1
              ? spanFromRun
              : spanForCourse;
          createdRun = {
            run_id: nextId,
            course_id: run.course_id,
            slot_id: targetSlot.slot_id,
            slot_span: effectiveSpan,
            slot_ids: null,
            teacher_id: run.teacher_id,
            teachers: [],
            cohorts: [targetCohortId],
            planned_students: run.planned_students || 0,
            status: run.status || "planerad",
            kursansvarig_id: null,
            created_at: run.created_at || new Date().toISOString(),
          };
          runs.push(createdRun);
        }

        store.courseRunsManager.ensureCourseSlotsFromRuns();
        store.teachingDaysManager._ensureCourseSlotDayDefaults();

        store.notify();
        await CourseRunManager._persistMutation(mutationId);
        return { mutationId };
      } catch (error) {
        await store.rollback(mutationId);
        throw error;
      }
    }

    const previousSlotId = run.slot_id;
    const previousSlotIds = run.slot_ids; // Capture previous slot_ids
    const previousTeachers = Array.isArray(run.teachers) ? [...run.teachers] : [];
    const previousKursansvarigId = run.kursansvarig_id ?? null;
    const previousCourseSlotDays = (store.courseSlotDays || []).map((csd) => ({
      ...csd,
    }));
    let createdSlot = null;

    const mutationId = store.applyOptimistic({
      label: "move-course-run",
      rollback: () => {
        run.slot_id = previousSlotId;
        run.slot_ids = previousSlotIds; // Restore previous slot_ids
        run.teachers = [...previousTeachers];
        run.kursansvarig_id = previousKursansvarigId;
        if (createdSlot) {
          store.deleteSlot(createdSlot.slot_id);
        }
        store.courseSlotDays = previousCourseSlotDays;
        store.notify();
      },
    });

    try {
      // Find or create target slot
      let targetSlot = store
        .getSlots()
        .find((s) => s.start_date === targetSlotDate);

      if (spanForCourse > 1) {
        const slotDates = CourseRunManager._sortedSlotDates();
        const slotIdxByDate = CourseRunManager._slotIdxByDate(slotDates);
        const spanByCourseId = new Map(
          (store.getCourses() || []).map((c) => [
            Number(c.course_id),
            Number(c?.credits) === 15 ? 2 : 1,
          ])
        );
        const candidateStartIdx = slotIdxByDate.get(String(targetSlotDate));

        // Prevent *any* skewed overlap for 15hp courses (offset starts are forbidden).
        if (
          CourseRunManager._hasSkewedSpanOverlap({
            courseId: run.course_id,
            candidateStartIdx,
            candidateSpan: spanForCourse,
            slotDates,
            slotIdxByDate,
            spanByCourseId,
            excludeRunId: runId,
          })
        ) {
          return;
        }
      }

      // Business logic hard-rule: require at least one available compatible teacher (optional).
      {
        const businessLogic = store.businessLogicManager?.getBusinessLogic?.();
        const schedulingLogic = businessLogic?.scheduling || {};
        const requireTeachersEnabled = Array.isArray(schedulingLogic.hardRules)
          ? schedulingLogic.hardRules.some(
              (r) => r?.id === "requireAvailableCompatibleTeachers" && r?.enabled !== false
            )
          : false;

        if (requireTeachersEnabled) {
          const slotDates = CourseRunManager._sortedSlotDates();
          const slotIdxByDate = CourseRunManager._slotIdxByDate(slotDates);
          const startIdx = slotIdxByDate.get(String(targetSlotDate));
          if (Number.isFinite(startIdx)) {
            const ids0 = new Set(
              getAvailableCompatibleTeachersForCourseInSlot(
                run.course_id,
                slotDates[startIdx]
              ).map((t) => t.teacher_id)
            );
            let intersection = ids0;
            for (let i = 1; i < spanForCourse; i += 1) {
              const date = slotDates[startIdx + i];
              const ids = new Set(
                getAvailableCompatibleTeachersForCourseInSlot(
                  run.course_id,
                  date
                ).map((t) => t.teacher_id)
              );
              intersection = new Set(
                [...intersection].filter((id) => ids.has(id))
              );
            }
            if (intersection.size === 0) return;
          }
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

      const runCoversSlotId = (r, slotId) => {
        if (!r || slotId == null) return false;
        if (Array.isArray(r.slot_ids) && r.slot_ids.length > 0) {
          return r.slot_ids.some((id) => String(id) === String(slotId));
        }
        return String(r.slot_id) === String(slotId);
      };

      const targetRun = (store.getCourseRuns() || []).find(
        (r) =>
          String(r?.course_id) === String(run.course_id) &&
          String(r?.run_id) !== String(run.run_id) &&
          runCoversSlotId(r, targetSlot.slot_id)
      );

      if (targetRun) {
        const previousRun = { ...run, cohorts: [...(run.cohorts || [])] };
        const previousTargetCohorts = Array.isArray(targetRun.cohorts)
          ? [...targetRun.cohorts]
          : [];
        const mutationId = store.applyOptimistic({
          label: "move-course-run-merge",
          rollback: () => {
            const runs = CourseRunManager._runs();
            const exists = runs.some(
              (r) => String(r.run_id) === String(previousRun.run_id)
            );
            if (!exists) {
              runs.push(previousRun);
            } else {
              const existing = CourseRunManager._runById(previousRun.run_id);
              if (existing) {
                Object.assign(existing, previousRun);
              }
            }
            targetRun.cohorts = previousTargetCohorts;
            if (createdSlot) {
              store.deleteSlot(createdSlot.slot_id);
            }
            store.courseSlotDays = previousCourseSlotDays;
            store.notify();
          },
        });

        try {
          run.cohorts = (run.cohorts || []).filter(
            (id) => String(id) !== String(fromCohortId)
          );
          if (run.cohorts.length === 0) {
            const runs = CourseRunManager._runs();
            const index = runs.findIndex(
              (r) => String(r.run_id) === String(run.run_id)
            );
            if (index !== -1) runs.splice(index, 1);
          }

          const nextCohorts = new Set(
            (Array.isArray(targetRun.cohorts) ? targetRun.cohorts : []).map(
              (id) => String(id)
            )
          );
          nextCohorts.add(String(targetCohortId));
          targetRun.cohorts = Array.from(nextCohorts).map((id) => Number(id));

          store.courseRunsManager.ensureCourseSlotsFromRuns();
          store.teachingDaysManager._ensureCourseSlotDayDefaults();

          store.notify();
          await CourseRunManager._persistMutation(mutationId);
          return { mutationId };
        } catch (error) {
          await store.rollback(mutationId);
          throw error;
        }
      }

      // Reset course days logic
      const clearDaysFor = (cId, sId) => {
        const cs = (store.courseRunsManager.courseSlots || []).find(
          (x) =>
            String(x.course_id) === String(cId) &&
            String(x.slot_id) === String(sId)
        );
        if (cs) {
          const id = cs.course_slot_id ?? cs.cohort_slot_course_id;
          if (id != null) {
            store.courseSlotDays = (store.courseSlotDays || []).filter(
              (d) => String(d.course_slot_id) !== String(id)
            );
          }
        }
      };

      // Clear source days (cleanup)
      clearDaysFor(run.course_id, previousSlotId);

      // Clear target days (force reset to defaults)
      clearDaysFor(run.course_id, targetSlot.slot_id);

      // Update run's slot
      run.slot_id = targetSlot.slot_id;
      // Clear explicit slot_ids to ensure days are generated for the new slot(s)
      run.slot_ids = null;
      // Reset teacher selections when moving to a new joint run
      run.teachers = [];
      run.kursansvarig_id = null;

      // Regenerate structures and defaults
      store.courseRunsManager.ensureCourseSlotsFromRuns();
      store.teachingDaysManager._ensureCourseSlotDayDefaults();

      store.notify();
      await CourseRunManager._persistMutation(mutationId);
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
            kursansvarig_id: run.kursansvarig_id ?? null,
          });
        }
      });
    }

    runs.forEach((run) => {
      if (!previousState.has(run.run_id)) {
        previousState.set(run.run_id, {
          teachers: run.teachers ? [...run.teachers] : [],
          kursansvarig_id: run.kursansvarig_id ?? null,
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
            run.kursansvarig_id = state.kursansvarig_id ?? null;
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
              if (String(otherRun.kursansvarig_id) === String(teacherId)) {
                otherRun.kursansvarig_id = null;
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
          if (String(run.kursansvarig_id) === String(teacherId)) {
            run.kursansvarig_id = null;
          }
        }
      }

      // Handle kursansvarig auto-selection
      const courseId = runs.length > 0 ? runs[0].course_id : null;
      if (courseId) {
        const currentKursansvarig =
          store.coursesManager.getKursansvarigForCourse(courseId);

        if (checked) {
          // Do not auto-assign kursansvarig on teacher assignment.
        } else {
          // Clear kursansvarig if this teacher was responsible
          if (currentKursansvarig === teacherId) {
            // Do not auto-assign another teacher; leave kursansvarig empty.
            store.coursesManager.clearKursansvarig(courseId);
          }
        }
      }

      store.notify();

      await CourseRunManager._persistMutation(mutationId);
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    }
  }

  /**
   * Set kursansvarig for course runs (jointly)
   * @param {Array} runs - Course runs to update
   * @param {number|null} teacherId - Teacher ID (or null to clear)
   */
  static async setCourseRunKursansvarig(runs, teacherId) {
    // Capture state for rollback
    const previousState = new Map();
    const runIds = new Set();
    const slotIds = new Set();
    
    // Normalize run list to cover all joint runs for the same (course, slot) tuple
    (runs || []).forEach(r => {
        if (!r) return;
        runIds.add(r.run_id);
        if (Array.isArray(r.slot_ids) && r.slot_ids.length > 0) {
            r.slot_ids.forEach(sid => slotIds.add(sid));
        } else if (r.slot_id != null) {
            slotIds.add(r.slot_id);
        }
    });

    // Find all runs that are part of the same joint occurrence
    const targetCourseId = runs[0]?.course_id;
    if (targetCourseId == null) return;

    const allAffectedRuns = store.getCourseRuns().filter(r => {
        if (Number(r.course_id) !== Number(targetCourseId)) return false;
        // Check overlap
        if (runIds.has(r.run_id)) return true;
        
        let covers = false;
        if (Array.isArray(r.slot_ids) && r.slot_ids.length > 0) {
            covers = r.slot_ids.some(sid => slotIds.has(sid));
        } else if (r.slot_id != null) {
            covers = slotIds.has(r.slot_id);
        }
        return covers;
    });

    allAffectedRuns.forEach(r => {
        previousState.set(r.run_id, r.kursansvarig_id);
    });

    const mutationId = store.applyOptimistic({
      label: "set-course-run-kursansvarig",
      rollback: () => {
        previousState.forEach((val, rId) => {
            const r = CourseRunManager._runById(rId);
            if (r) r.kursansvarig_id = val;
        });
      },
    });

    try {
        allAffectedRuns.forEach(r => {
            r.kursansvarig_id = teacherId;
        });

        store.notify();
        await CourseRunManager._persistMutation(mutationId);
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
      await CourseRunManager._persistMutation(mutationId);
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

      await CourseRunManager._persistMutation(mutationId);
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
    { maxStudentsHard, maxStudentsPreferred } = {}
  ) {
    const businessLogic = store.businessLogicManager?.getBusinessLogic?.();
    const schedulingLogic = businessLogic?.scheduling || {};
    const schedulingParams = schedulingLogic?.params || {};

    const rulesList = Array.isArray(schedulingLogic.rules)
      ? schedulingLogic.rules
      : null;

    const ruleMetaById = (() => {
      const m = new Map();
      if (rulesList) {
        rulesList.forEach((r, idx) => {
          const id = r?.id;
          if (!id) return;
          m.set(String(id), {
            enabled: r?.enabled !== false,
            kind: String(r?.kind || "soft").toLowerCase() === "hard" ? "hard" : "soft",
            index: idx,
          });
        });
      } else {
        // Backwards compat (older payload structure)
        (Array.isArray(schedulingLogic.hardRules) ? schedulingLogic.hardRules : []).forEach(
          (r, idx) => {
            const id = r?.id;
            if (!id) return;
            m.set(String(id), { enabled: r?.enabled !== false, kind: "hard", index: idx });
          }
        );
        (Array.isArray(schedulingLogic.softRules) ? schedulingLogic.softRules : []).forEach(
          (r, idx) => {
            const id = r?.id;
            if (!id || m.has(String(id))) return;
            m.set(String(id), { enabled: r?.enabled !== false, kind: "soft", index: 10_000 + idx });
          }
        );
      }
      return m;
    })();

    const isRuleEnabled = (ruleId) => {
      const meta = ruleMetaById.get(String(ruleId));
      return meta ? meta.enabled !== false : false;
    };

    const isRuleHard = (ruleId) => {
      const meta = ruleMetaById.get(String(ruleId));
      return meta ? meta.kind === "hard" && meta.enabled !== false : false;
    };

    const configuredMaxHard = Number(schedulingParams.maxStudentsHard);
    const configuredMaxPreferred = Number(schedulingParams.maxStudentsPreferred);

    const effectiveMaxStudentsHard =
      maxStudentsHard != null && Number.isFinite(Number(maxStudentsHard))
        ? Number(maxStudentsHard)
        : Number.isFinite(configuredMaxHard)
          ? configuredMaxHard
          : 130;
    const effectiveMaxStudentsPreferred =
      maxStudentsPreferred != null && Number.isFinite(Number(maxStudentsPreferred))
        ? Number(maxStudentsPreferred)
      : Number.isFinite(configuredMaxPreferred)
          ? configuredMaxPreferred
          : 100;

    const dontMovePlacedCoursesEnabled = (() => {
      // "Dont move placed courses" must be hard to act as a constraint.
      // If it's soft, it should not override any enabled hard constraints.
      return isRuleHard("dontMovePlacedCourses");
    })();

    // Rule precedence:
    // - Any enabled HARD rule must outrank any enabled SOFT rule (even if the
    //   user ordered the soft rule above in the UI).
    // - Within each kind, preserve the UI order.
    const defaultRuleOrder = [
      "requireAvailableCompatibleTeachers",
      "economyColocationPacking",
      "futureJoinCapacity",
      "avoidEmptySlots",
      "avoidOverPreferred",
    ];
    const metricSupported = new Set([
      "economyColocationPacking",
      "requireAvailableCompatibleTeachers",
      "futureJoinCapacity",
      "avoidEmptySlots",
      "avoidOverPreferred",
    ]);
    const ruleOrder = (() => {
      if (rulesList) {
        const enriched = rulesList
          .map((r, idx) => ({
            id: r?.id,
            enabled: r?.enabled !== false,
            kind:
              String(r?.kind || "soft").toLowerCase() === "hard" ? "hard" : "soft",
            index: idx,
          }))
          .filter((r) => r.id && r.enabled && metricSupported.has(String(r.id)));

        // Hard before soft, regardless of index. Preserve relative order within each group.
        enriched.sort((a, b) => {
          const aw = a.kind === "hard" ? 0 : 1;
          const bw = b.kind === "hard" ? 0 : 1;
          if (aw !== bw) return aw - bw;
          return a.index - b.index;
        });

        return enriched.map((r) => String(r.id));
      }

      // Legacy payload: keep original default order.
      return defaultRuleOrder.filter((id) => metricSupported.has(id));
    })();

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

    const planningStartIdx = startSlotIdx;

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

    const shouldRemoveFromTarget = (run) => {
      if (!cohortHasAnyScheduledCourse) return false;
      if (dontMovePlacedCoursesEnabled) return false;
      const cohortsInRun = Array.isArray(run?.cohorts) ? run.cohorts : [];
      if (!cohortsInRun.some((id) => String(id) === String(cohortId))) {
        return false;
      }
      const runStartIdx = runStartIdxFor(run);
      return Number.isFinite(runStartIdx) && runStartIdx >= planningStartIdx;
    };

    const totalsBySlotIdx = new Map(); // slotIdx -> Map(courseId -> totalStudents)
    const startsTotalsBySlotIdx = new Map(); // startSlotIdx -> Map(courseId -> totalStudents)
    const blockedStartSlotIdxByCourse = new Map(); // courseId -> Set(slotIdx)
    const existingStartIdxsByCourse = new Map(); // courseId -> Set(startSlotIdx) for span>1 courses
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
      // If this run would be removed (because we are replanning), it should not
      // affect totals/scoring/occupied slots.
      const cohortsInRunRaw = Array.isArray(run.cohorts) ? run.cohorts : [];
      const willRemoveTarget = shouldRemoveFromTarget(run);
      const cohortsInRun = willRemoveTarget
        ? cohortsInRunRaw.filter((id) => String(id) !== String(cohortId))
        : cohortsInRunRaw;
      if (cohortsInRun.length === 0) continue;

      const slotIdxs = coveredSlotIdxsForRun(run);
      if (slotIdxs.length === 0) continue;

      const runStartIdx = runStartIdxFor(run);
      if (Number.isFinite(runStartIdx)) {
        if ((spanById.get(courseId) || 1) > 1) {
          if (!existingStartIdxsByCourse.has(courseId)) {
            existingStartIdxsByCourse.set(courseId, new Set());
          }
          existingStartIdxsByCourse.get(courseId).add(runStartIdx);
        }

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

      if (isRuleHard("requireAvailableCompatibleTeachers")) {
        const base = getAvailableCompatibleTeachersForCourseInSlot(
          courseId,
          slotDates[slotIdx]
        ).map((t) => t.teacher_id);
        let intersection = new Set(base);
        for (let i = 1; i < span; i += 1) {
          const date = slotDates[slotIdx + i];
          const ids = new Set(
            getAvailableCompatibleTeachersForCourseInSlot(courseId, date).map(
              (t) => t.teacher_id
            )
          );
          intersection = new Set([...intersection].filter((id) => ids.has(id)));
        }
        if (intersection.size === 0) return false;
      }

      // For span>1 (15hp) courses: forbid any skewed overlap with existing runs.
      // If any other cohort has started this course at a different start slot that
      // overlaps the candidate span, we cannot start here.
      if (span > 1) {
        const starts = existingStartIdxsByCourse.get(courseId);
        if (starts && starts.size > 0) {
          const candidateEndExclusive = slotIdx + span;
          for (const otherStartIdx of starts) {
            if (!Number.isFinite(otherStartIdx)) continue;
            if (otherStartIdx === slotIdx) continue;
            const otherEndExclusive = otherStartIdx + span;
            const overlaps =
              slotIdx < otherEndExclusive && otherStartIdx < candidateEndExclusive;
            if (overlaps) return false;
          }
        }
      }

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
        if (cur + cohortSize > effectiveMaxStudentsHard) return false;
      }
      return true;
    };

    const fitsPreferredAt = (courseId, slotIdx) => {
      const cohortSize = Number(cohort.planned_size) || 0;
      const span = spanById.get(courseId) || 1;
      for (let i = 0; i < span; i += 1) {
        const idx = slotIdx + i;
        const cur = totalsBySlotIdx.get(idx)?.get(courseId) || 0;
        if (cur + cohortSize > effectiveMaxStudentsPreferred) return false;
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

    store.beginAutoSaveSuspension();
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
      // Step 0: Optional replanning. If enabled, remove this cohort's placements from the
      // planning window and refill. If disabled, keep already placed courses and only
      // fill empty slots.
      if (
        !dontMovePlacedCoursesEnabled &&
        cohortHasAnyScheduledCourse &&
        planningStartIdx < slotDates.length
      ) {
        const runs = CourseRunManager._runs();
        let didChange = false;

        for (let idx = runs.length - 1; idx >= 0; idx -= 1) {
          const run = runs[idx];
          if (!shouldRemoveFromTarget(run)) continue;

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

        const mustRespectPreferred = isRuleHard("avoidOverPreferred");
        const eligible = Array.from(remainingCourseIds).filter(
          (cid) =>
            canPlaceCourseAt(cid, slotIdx) &&
            fitsCapacityAt(cid, slotIdx) &&
            (!mustRespectPreferred || fitsPreferredAt(cid, slotIdx))
        );
        if (eligible.length === 0) continue;

        const packEconomyTowardPreferred = (() => {
          const economyIdx = ruleOrder.indexOf("economyColocationPacking");
          const avoidPreferredIdx = ruleOrder.indexOf("avoidOverPreferred");
          return (
            economyIdx !== -1 &&
            avoidPreferredIdx !== -1 &&
            avoidPreferredIdx < economyIdx
          );
        })();

        const metric = (ruleId, courseId) => {
          if (ruleId === "economyColocationPacking") {
            const colocation = startsTotalsBySlotIdx.get(slotIdx)?.get(courseId) || 0;
            const projected = projectedMaxTotal(courseId, slotIdx) || 0;
            const packingScore = packEconomyTowardPreferred
              ? -Math.abs(projected - effectiveMaxStudentsPreferred)
              : projected;
            // Keep samläsning as the primary signal, packing as a tie-breaker.
            return colocation * 1_000_000 + packingScore;
          }
          if (ruleId === "requireAvailableCompatibleTeachers") {
            const span = spanById.get(courseId) || 1;
            const base = getAvailableCompatibleTeachersForCourseInSlot(
              courseId,
              slotDates[slotIdx]
            ).map((t) => t.teacher_id);
            let intersection = new Set(base);
            for (let i = 1; i < span; i += 1) {
              const date = slotDates[slotIdx + i];
              const ids = new Set(
                getAvailableCompatibleTeachersForCourseInSlot(
                  courseId,
                  date
                ).map((t) => t.teacher_id)
              );
              intersection = new Set(
                [...intersection].filter((id) => ids.has(id))
              );
            }
            return intersection.size;
          }
          if (ruleId === "futureJoinCapacity") {
            const projected = projectedMaxTotal(courseId, slotIdx) || 0;
            const remainingCapacity = effectiveMaxStudentsHard - projected;
            return potentialFutureJoinStudents(slotIdx, remainingCapacity) || 0;
          }
          if (ruleId === "avoidEmptySlots") {
            const chosenSpan = spanById.get(courseId) || 1;
            const nextIdx = slotIdx + chosenSpan;
            if (nextIdx >= slotDates.length) return 0;

            const chosenEndIdx = slotIdx + chosenSpan - 1;
            const isOccupiedAt = (idx) =>
              occupiedSlotIdxForTarget.has(idx) ||
              (idx >= slotIdx && idx <= chosenEndIdx);

            const doneAtFor = (cid) => {
              if (String(cid) === String(courseId)) return chosenEndIdx;
              return completionEndIdxByCourse.get(Number(cid));
            };

            const prereqsMetAtNext = (candidateCourseId) => {
              const prereqs = prereqsById.get(candidateCourseId) || [];
              return prereqs.every((pid) => {
                const doneAt = doneAtFor(pid);
                return Number.isFinite(doneAt) && doneAt < nextIdx;
              });
            };

            let eligibleCount = 0;
            for (const candidateCourseId of remainingCourseIds) {
              if (String(candidateCourseId) === String(courseId)) continue;
              if (blockedStartSlotIdxByCourse.get(candidateCourseId)?.has(nextIdx)) {
                continue;
              }

              const candidateSpan = spanById.get(candidateCourseId) || 1;
              if (nextIdx + candidateSpan - 1 >= slotDates.length) continue;

              // Check skewed-overlap constraint for 15hp courses using existing start idxs.
              if (candidateSpan > 1) {
                const starts = existingStartIdxsByCourse.get(candidateCourseId);
                if (starts && starts.size > 0) {
                  const candidateEndExclusive = nextIdx + candidateSpan;
                  let overlaps = false;
                  for (const otherStartIdx of starts) {
                    if (!Number.isFinite(otherStartIdx)) continue;
                    if (otherStartIdx === nextIdx) continue;
                    const otherEndExclusive = otherStartIdx + candidateSpan;
                    if (nextIdx < otherEndExclusive && otherStartIdx < candidateEndExclusive) {
                      overlaps = true;
                      break;
                    }
                  }
                  if (overlaps) continue;
                }
              }

              let conflict = false;
              for (let i = 0; i < candidateSpan; i += 1) {
                if (isOccupiedAt(nextIdx + i)) {
                  conflict = true;
                  break;
                }
              }
              if (conflict) continue;
              if (!prereqsMetAtNext(candidateCourseId)) continue;
              if (!fitsCapacityAt(candidateCourseId, nextIdx)) continue;

              eligibleCount += 1;
            }
            return eligibleCount;
          }
          if (ruleId === "avoidOverPreferred") {
            return Math.max(
              0,
              projectedMaxTotal(courseId, slotIdx) -
                effectiveMaxStudentsPreferred
            );
          }
          return 0;
        };

        const compareCourseIds = (a, b) => {
          for (const ruleId of ruleOrder) {
            const va = metric(ruleId, a);
            const vb = metric(ruleId, b);
            if (va === vb) continue;

            // All but avoidOverPreferred are "maximize".
            if (ruleId === "avoidOverPreferred") {
              return va - vb;
            }
            return vb - va;
          }
          return Number(a) - Number(b);
        };

        eligible.sort(compareCourseIds);
        const chosen = eligible[0];
        placeCourse(chosen, slotIdx);
      }

      store.notify();
      await CourseRunManager._persistMutation(mutationId);
      return { mutationId };
    } catch (error) {
      await store.rollback(mutationId);
      throw error;
    } finally {
      store.endAutoSaveSuspension();
    }
  }
}
