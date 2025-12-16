// Prerequisite Manager Service - Handles prerequisite validation business logic
export class PrerequisiteManager {
  constructor(store) {
    this.store = store;
  }

  // Find courses that are missing their prerequisites
  findCoursesWithMissingPrerequisites() {
    const problems = []; // { cohortId, cohortName, courseId, courseName, missingPrereqId, missingPrereqName }

    // Get all cohorts
    for (const cohort of this.store.cohorts) {
      // Get all runs for this cohort
      const cohortRuns = this.store.courseRuns.filter(
        (r) => r.cohorts && r.cohorts.includes(cohort.cohort_id)
      );

      // For each run, check if its prerequisites are scheduled before it
      for (const run of cohortRuns) {
        const course = this.store.getCourse(run.course_id);
        if (
          !course ||
          !course.prerequisites ||
          course.prerequisites.length === 0
        ) {
          continue;
        }

        const slot = this.store.getSlot(run.slot_id);
        if (!slot) continue;
        const runDate = new Date(slot.start_date);

        // Check each prerequisite
        for (const prereqId of course.prerequisites) {
          const prereqCourse = this.store.getCourse(prereqId);
          if (!prereqCourse) continue;

          // Find if prerequisite is scheduled for this cohort
          const prereqRun = cohortRuns.find((r) => r.course_id === prereqId);

          if (!prereqRun) {
            // Prerequisite not scheduled at all
            problems.push({
              type: "missing",
              cohortId: cohort.cohort_id,
              cohortName: cohort.name,
              courseId: course.course_id,
              courseName: course.name,
              courseCode: course.code,
              runId: run.run_id,
              missingPrereqId: prereqId,
              missingPrereqName: prereqCourse.name,
              missingPrereqCode: prereqCourse.code,
            });
          } else {
            // Check that prerequisite is completely finished before this course starts
            const prereqSlot = this.store.getSlot(prereqRun.slot_id);
            if (prereqSlot) {
              const prereqRange =
                this.store.normalizer.getSlotRange(prereqSlot);
              const prereqEndDate = prereqRange?.end;

              // The dependent course must start AFTER the prerequisite ends
              if (prereqEndDate && runDate <= prereqEndDate) {
                problems.push({
                  type: "before_prerequisite",
                  cohortId: cohort.cohort_id,
                  cohortName: cohort.name,
                  courseId: course.course_id,
                  courseName: course.name,
                  courseCode: course.code,
                  runId: run.run_id,
                  missingPrereqId: prereqId,
                  missingPrereqName: prereqCourse.name,
                  missingPrereqCode: prereqCourse.code,
                });
              }
            }
          }
        }
      }
    }

    return problems;
  }
}
