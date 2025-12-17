// src/utils/store/courseRuns.js
export class CourseRunsManager {
  constructor(events) {
    this.events = events;
    this.courseRuns = [];
    this.courseSlots = []; // Normalized junction table: course_id + slot_id -> course_slot_id
  }

  load(courseRuns, courseSlots) {
    this.courseRuns = courseRuns || [];
    this.courseSlots = courseSlots || [];
  }

  addCourseRun(run) {
    const id = Math.max(...this.courseRuns.map((r) => r.run_id), 0) + 1;
    const newRun = {
      run_id: id,
      course_id: run.course_id,
      slot_id: run.slot_id,
      teacher_id: run.teacher_id,
      teachers: run.teachers || [],
      cohorts: run.cohorts || [],
      planned_students: run.planned_students || 0,
      status: run.status || "planerad",
    };
    this.courseRuns.push(newRun);
    // Ensure the normalized course-slot link exists
    this.ensureCourseSlotsFromRuns();
    this.events.notify();
    return newRun;
  }

  getCourseRuns() {
    return this.courseRuns;
  }

  getCourseRun(runId) {
    return this.courseRuns.find((r) => r.run_id === runId);
  }

  getCourseRunsBySlot(slotId) {
    return this.courseRuns.filter((r) => r.slot_id === slotId);
  }

  updateCourseRun(runId, updates) {
    const index = this.courseRuns.findIndex((r) => r.run_id === runId);
    if (index !== -1) {
      this.courseRuns[index] = { ...this.courseRuns[index], ...updates };
      this.ensureCourseSlotsFromRuns();
      this.events.notify();
      return this.courseRuns[index];
    }
    return null;
  }

  deleteCourseRun(runId) {
    const index = this.courseRuns.findIndex((r) => r.run_id === runId);
    if (index !== -1) {
      this.courseRuns.splice(index, 1);
      this.ensureCourseSlotsFromRuns();
      this.events.notify();
      return true;
    }
    return false;
  }

  // Generate normalized courseSlots from courseRuns
  // courseSlots is a junction table that maps (course_id, slot_id) -> course_slot_id
  ensureCourseSlotsFromRuns() {
    if (!Array.isArray(this.courseSlots)) {
      this.courseSlots = [];
    }

    const existingKeys = new Set(
      this.courseSlots.map((cs) => `${cs.course_id}-${cs.slot_id}`)
    );
    let nextId =
      this.courseSlots.reduce(
        (max, cs) => Math.max(max, cs.course_slot_id || 0),
        0
      ) + 1;

    for (const run of this.courseRuns || []) {
      if (run.course_id == null || run.slot_id == null) continue;
      const key = `${run.course_id}-${run.slot_id}`;
      if (existingKeys.has(key)) continue;

      this.courseSlots.push({
        course_slot_id: nextId++,
        course_id: run.course_id,
        slot_id: run.slot_id,
        created_at: run.created_at || new Date().toISOString(),
      });
      existingKeys.add(key);
    }
  }

  // Event handler: Clean up course runs and courseSlots when a course is deleted
  handleCourseDeleted(courseId) {
    // Remove any course runs that reference this course
    this.courseRuns = this.courseRuns.filter(
      (r) => r.course_id !== courseId
    );

    // Remove any courseSlots referencing this course
    this.courseSlots = (this.courseSlots || []).filter(
      (cs) => String(cs.course_id) !== String(courseId)
    );

    // Note: courseSlotDays cleanup is handled by TeachingDaysManager
    // It will receive the list of removed course_slot_ids via event data
  }

  // Event handler: Remove teacher from all course runs when a teacher is deleted
  handleTeacherDeleted(teacherId) {
    // Remove this teacher from all course runs
    this.courseRuns.forEach((run) => {
      if (run.teachers) {
        run.teachers = run.teachers.filter((id) => id !== teacherId);
      }
      if (run.teacher_id === teacherId) {
        run.teacher_id = null;
      }
    });

    // Remove this teacher from any courseSlot teacher lists
    (this.courseSlots || []).forEach((cs) => {
      try {
        if (Array.isArray(cs.teachers) && cs.teachers.length > 0) {
          cs.teachers = cs.teachers
            .map((x) => (typeof x === "string" ? Number(x) : x))
            .filter((id) => Number(id) !== Number(teacherId));
        }
      } catch (e) {
        // ignore malformed entries
      }
    });
  }

  // Helper: Delete all course runs for a specific cohort
  deleteRunsForCohort(cohortId) {
    this.courseRuns = this.courseRuns.filter(
      (run) => !run.cohorts || !run.cohorts.includes(cohortId)
    );
    this.ensureCourseSlotsFromRuns();
  }
}
