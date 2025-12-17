// Data Validator Service - Handles all data validation logic
export class DataValidator {
  constructor(store) {
    this.store = store;
  }

  assertAllSlotsNonOverlapping() {
    const ranges = [];
    for (const slot of this.store.slots || []) {
      const range = this.getSlotRange(slot);
      if (!range) {
        const message = "Alla slots måste ha giltiga start- och slutdatum.";
        this.showAlert(message);
        throw new Error(message);
      }
      ranges.push({ slot, range });
    }

    ranges.sort((a, b) => a.range.start.getTime() - b.range.start.getTime());

    for (let i = 1; i < ranges.length; i++) {
      const prev = ranges[i - 1];
      const current = ranges[i];
      if (current.range.start <= prev.range.end) {
        const message = `Slots ${prev.range.startStr}–${prev.range.endStr} och ${current.range.startStr}–${current.range.endStr} får inte överlappa.`;
        this.showAlert(message);
        throw new Error(message);
      }
    }
  }

  validateTeacherAssignments() {
    // Group runs by slot
    const runsBySlot = new Map();
    for (const run of this.store.courseRunsManager.courseRuns) {
      if (!runsBySlot.has(run.slot_id)) {
        runsBySlot.set(run.slot_id, []);
      }
      runsBySlot.get(run.slot_id).push(run);
    }

    // For each slot, ensure each teacher only appears in one course
    for (const [slotId, runsInSlot] of runsBySlot) {
      const teacherToCourse = new Map(); // teacherId -> courseId

      for (const run of runsInSlot) {
        if (!run.teachers) continue;

        const validTeachers = [];
        for (const teacherId of run.teachers) {
          if (!teacherToCourse.has(teacherId)) {
            // First time seeing this teacher in this slot - keep them
            teacherToCourse.set(teacherId, run.course_id);
            validTeachers.push(teacherId);
          } else if (teacherToCourse.get(teacherId) === run.course_id) {
            // Same course (different cohort run) - keep them
            validTeachers.push(teacherId);
          }
          // else: teacher already assigned to different course - skip
        }
        run.teachers = validTeachers;
      }
    }
  }

  validateCoursesHaveTeachers() {
    const removedCourses = [];

    // Group runs by slot and course
    const slotCourseRuns = new Map(); // "slotId-courseId" -> runs[]
    for (const run of this.store.courseRunsManager.courseRuns) {
      const key = `${run.slot_id}-${run.course_id}`;
      if (!slotCourseRuns.has(key)) {
        slotCourseRuns.set(key, []);
      }
      slotCourseRuns.get(key).push(run);
    }

    // Check each course in each slot
    for (const [key, runs] of slotCourseRuns) {
      if (runs.length === 0) continue;

      const courseId = runs[0].course_id;
      const slotId = runs[0].slot_id;
      const slot = this.store.getSlot(slotId);
      const slotDate = slot?.start_date;

      if (!slotDate) continue;

      // Check if any teacher is assigned to this course
      const hasAssignedTeacher = runs.some(
        (r) => r.teachers && r.teachers.length > 0
      );
      if (hasAssignedTeacher) continue;

      // Check if any compatible teacher is available
      const teachersAssignedToThisCourse = new Set();
      runs.forEach((r) => {
        if (r.teachers) {
          r.teachers.forEach((tid) => teachersAssignedToThisCourse.add(tid));
        }
      });

      const availableTeachers = this.store.teachersManager.getTeachers().filter((t) => {
        if (!t.compatible_courses || !t.compatible_courses.includes(courseId)) {
          return false;
        }
        const isAssignedToThisCourse = teachersAssignedToThisCourse.has(
          t.teacher_id
        );
        const isUnavailable = this.store.isTeacherUnavailable(
          t.teacher_id,
          slotDate
        );
        return isAssignedToThisCourse || !isUnavailable;
      });

      if (availableTeachers.length === 0) {
        // No available teachers - remove all runs for this course in this slot
        const course = this.store.getCourse(courseId);
        const affectedCohorts = runs
          .flatMap((r) => r.cohorts || [])
          .map((cohortId) => this.store.getCohort(cohortId)?.name)
          .filter(Boolean);

        removedCourses.push({
          courseName: course?.name || "Okänd kurs",
          courseCode: course?.code || "",
          courseId: courseId,
          cohorts: affectedCohorts,
          cohortIds: runs.flatMap((r) => r.cohorts || []),
        });

        // Remove the runs
        for (const run of runs) {
          const index = this.store.courseRunsManager.courseRuns.findIndex(
            (r) => r.run_id === run.run_id
          );
          if (index !== -1) {
            this.store.courseRunsManager.courseRuns.splice(index, 1);
          }
        }
      }
    }

    return removedCourses;
  }

  getSlotRange(slot) {
    const start = slot.start_date ? new Date(slot.start_date) : null;
    const end = slot.end_date ? new Date(slot.end_date) : null;

    if (!start || Number.isNaN(start.getTime())) return null;
    if (!end || Number.isNaN(end.getTime())) return null;

    return {
      start,
      end,
      startStr: start.toISOString().split("T")[0],
      endStr: end.toISOString().split("T")[0],
    };
  }

  showAlert(msg) {
    const isDev =
      typeof import.meta !== "undefined"
        ? Boolean(import.meta.env && import.meta.env.DEV)
        : typeof window !== "undefined" &&
          window.location &&
          (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1");
    if (isDev) {
      console.warn("ALERT suppressed in dev:", msg);
    } else {
      alert(msg);
    }
  }
}
