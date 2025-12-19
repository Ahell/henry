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
    for (const run of this.store.getCourseRuns()) {
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
