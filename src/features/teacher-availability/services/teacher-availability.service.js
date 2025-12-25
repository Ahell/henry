import { store } from "../../../platform/store/DataStore.js";

/**
 * Teacher Availability Service
 * Handles business logic for teacher availability, including slot coverage and availability toggling.
 */
export class TeacherAvailabilityService {
  /**
   * Return true if a course run covers the given slot_id.
   * Backend provides `slot_ids` for runs that span multiple slots.
   */
  static runCoversSlotId(run, slotId) {
    if (!run || slotId == null) return false;

    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      return run.slot_ids.some((id) => String(id) === String(slotId));
    }

    return String(run.slot_id) === String(slotId);
  }

  /**
   * Get all course runs that cover a specific slot.
   */
  static getRunsCoveringSlotId(courseRuns, slotId) {
    if (!Array.isArray(courseRuns)) return [];
    return courseRuns.filter((run) => this.runCoversSlotId(run, slotId));
  }

  /**
   * Toggle availability for an entire slot.
   */
  static toggleSlotAvailability(teacherId, slotDate, slotId) {
    return store.toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId);
  }

  /**
   * Toggle availability for a specific day.
   */
  static toggleDayAvailability(teacherId, dateStr) {
    return store.toggleTeacherAvailabilityForDay(teacherId, dateStr);
  }

  /**
   * Check if a day is unavailable for a teacher, considering both day-level and slot-level entries.
   */
  static isDayUnavailableConsideringSlot(
    teacherId,
    dateStr,
    detailSlotId,
    detailSlotDate
  ) {
    if (store.isTeacherUnavailableOnDay(teacherId, dateStr)) return true;
    if (detailSlotId && detailSlotDate) {
      return this.hasBusySlotEntry(teacherId, detailSlotId, detailSlotDate);
    }
    return false;
  }

  /**
   * Check if there is a slot-level "busy" entry for a teacher.
   */
  static hasBusySlotEntry(teacherId, slotId, fromDate) {
    return store.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.slot_id === slotId &&
        a.type === "busy" &&
        (fromDate ? a.from_date === fromDate : true)
    );
  }

  /**
   * Find a slot-level "busy" entry for a teacher.
   */
  static findBusySlotEntry(teacherId, slotId, fromDate) {
    return store.teacherAvailability.find(
      (a) =>
        a.teacher_id === teacherId &&
        a.slot_id === slotId &&
        a.type === "busy" &&
        (fromDate ? a.from_date === fromDate : true)
    );
  }

  /**
   * Remove a slot-level busy entry (if present) and return it.
   */
  static removeBusySlotEntry(teacherId, slotId, fromDate) {
    const entry = this.findBusySlotEntry(teacherId, slotId, fromDate);
    if (entry) store.removeTeacherAvailability(entry.id);
    return entry;
  }

  /**
   * Convert a slot-level busy entry into day-level busy entries.
   * Used when a user clicks a specific day in a slot that was previously marked fully busy.
   */
  static convertSlotEntryToDayEntries(
    teacherId,
    slotId,
    slotFromDate,
    clickedDate
  ) {
    let days = store.getSlotDays(slotId);
    if ((!days || days.length === 0) && slotFromDate) {
      days = store.getSlotDays(slotFromDate);
    }
    
    if (!days || days.length === 0) {
        console.warn("Could not find slot days for conversion", { slotId, slotFromDate });
        return;
    }

    days.forEach((day) => {
      if (day !== clickedDate) {
        store.addTeacherAvailability({
          teacher_id: teacherId,
          from_date: day,
          to_date: day,
          type: "busy",
        });
      }
    });
  }

  /**
   * Helper to convert slot entry to day entries and remove the slot entry.
   */
  static convertSlotEntryToDayEntriesAndRemove(
    slotId,
    teacherId,
    clickedDate
  ) {
    const entry = this.findBusySlotEntry(teacherId, slotId);
    if (entry) {
      this.convertSlotEntryToDayEntries(
        teacherId,
        slotId,
        entry.from_date,
        clickedDate
      );
      this.removeBusySlotEntry(teacherId, slotId, entry.from_date);
      return entry;
    }
  }

  /**
   * Toggle teaching day status (for Detail View).
   */
  static toggleTeachingDay(slotId, dateStr, courseId = null, applyToAllCourses = false) {
    const normalizedCourseId =
      courseId == null || courseId === "all" ? null : Number(courseId);

    if (normalizedCourseId != null && !Number.isNaN(normalizedCourseId)) {
      store.toggleCourseSlotDay(slotId, normalizedCourseId, dateStr);
      return;
    }

    if (applyToAllCourses) {
      const courseIdsInSlot = Array.from(
        new Set(
          this.getRunsCoveringSlotId(store.getCourseRuns(), slotId)
            .map((run) => run.course_id)
            .filter((id) => id != null)
        )
      );

      if (courseIdsInSlot.length === 0) return;

      const perCourse = courseIdsInSlot.map((cid) => ({
        courseId: cid,
        active: store.getTeachingDayState(slotId, dateStr, cid)?.active === true,
      }));

      const allActive = perCourse.every((c) => c.active);
      const desiredActive = !allActive;

      for (const { courseId: cid, active } of perCourse) {
        if (active !== desiredActive) {
          store.toggleCourseSlotDay(slotId, cid, dateStr, { skipNotify: true });
        }
      }

      store.notify();
    }
  }
}
