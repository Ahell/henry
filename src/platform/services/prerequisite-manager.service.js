// Prerequisite Manager Service - Handles prerequisite validation business logic
import { getSlotRange } from "../../utils/date-utils.js";
export class PrerequisiteManager {
  constructor(store) {
    this.store = store;
  }

  /**
   * Return an array of prerequisite problems across all cohorts and runs.
   * A problem is reported when a run's course either:
   *  - lacks a scheduled run for a prerequisite in the same cohort, or
   *  - starts before a prerequisite run has finished.
   * Throws if foundational data (course/slot) referenced by runs is missing.
   */
  findCoursesWithMissingPrerequisites() {
    const problems = [];
    const runsByCohort = this._groupRunsByCohort();
    const courseById = this._courseMap();

    for (const cohort of this.store.cohorts) {
      const runs = runsByCohort.get(cohort.cohort_id) || [];
      for (const run of runs) {
        const course = courseById.get(run.course_id);
        problems.push(
          ...this._problemsForRun({
            cohort,
            run,
            course,
            runsInCohort: runs,
            courseById,
          })
        );
      }
    }

    return problems;
  }

  /**
   * Build a map: cohort_id -> runs[] (note: a run can belong to multiple cohorts).
   */
  _groupRunsByCohort() {
    const map = new Map();
    for (const run of this.store.courseRunsManager.courseRuns || []) {
      for (const cohortId of run.cohorts || []) {
        const list = map.get(cohortId) || [];
        list.push(run);
        map.set(cohortId, list);
      }
    }
    return map;
  }

  /**
   * Build a quick lookup map of course_id -> course object.
   */
  _courseMap() {
    const map = new Map();
    for (const c of this.store.coursesManager.getCourses() || []) {
      map.set(c.course_id, c);
    }
    return map;
  }

  /**
   * Evaluate one run against its prerequisites for a single cohort.
   * Throws on data integrity errors (missing course/slot for the run).
   */
  _problemsForRun({ cohort, run, course, runsInCohort, courseById }) {
    if (!course) {
      throw new Error(
        `Data integrity error: Run ${run.run_id} references non-existent course ${run.course_id}`
      );
    }

    if (
      !Array.isArray(course.prerequisites) ||
      course.prerequisites.length === 0
    ) {
      return [];
    }

    const runSlot = this._getSlot(run.slot_id);
    if (!runSlot) {
      throw new Error(
        `Data integrity error: Run ${run.run_id} is not assigned to any slot (slot_id: ${run.slot_id})`
      );
    }
    const runDate = new Date(runSlot.start_date);

    return course.prerequisites.flatMap((prereqId) =>
      this._problemsForPrereq({
        prereqId,
        cohort,
        course,
        run,
        runDate,
        runsInCohort,
        courseById,
      })
    );
  }

  /**
   * Build a problem payload with consistent shape.
   */
  _buildProblem({ type, cohort, course, run, prereqCourse }) {
    return {
      type,
      cohortId: cohort.cohort_id,
      cohortName: cohort.name,
      courseId: course.course_id,
      courseName: course.name,
      courseCode: course.code,
      runId: run.run_id,
      missingPrereqId: prereqCourse.course_id,
      missingPrereqName: prereqCourse.name,
      missingPrereqCode: prereqCourse.code,
    };
  }

  /**
   * Evaluate a single prerequisite for a run:
   *  - missing scheduled run => "missing"
   *  - scheduled but overlaps => "before_prerequisite"
   */
  _problemsForPrereq({
    prereqId,
    cohort,
    course,
    run,
    runDate,
    runsInCohort,
    courseById,
  }) {
    const prereqCourse = courseById.get(prereqId);
    if (!prereqCourse) return [];

    const prereqRun =
      runsInCohort.find((r) => r.course_id === prereqId) || null;
    if (!prereqRun) {
      return [
        this._buildProblem({
          type: "missing",
          cohort,
          course,
          run,
          prereqCourse,
        }),
      ];
    }

    const prereqSlot = this._getSlot(prereqRun.slot_id);
    if (!prereqSlot) {
      throw new Error(
        `Data integrity error: Prerequisite run ${prereqRun.run_id} for course ${prereqCourse.course_id} is not assigned to any slot (slot_id: ${prereqRun.slot_id})`
      );
    }
    const prereqRange = getSlotRange(prereqSlot);
    const prereqEndDate = prereqRange?.end;

    if (prereqEndDate && runDate <= prereqEndDate) {
      return [
        this._buildProblem({
          type: "before_prerequisite",
          cohort,
          course,
          run,
          prereqCourse,
        }),
      ];
    }

    return [];
  }

  /**
   * Fetch slot by id; isolated for readability and future validation hooks.
   */
  _getSlot(slotId) {
    return this.store.getSlot(slotId);
  }
}
