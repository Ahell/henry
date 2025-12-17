// src/utils/store/availability.js
export class AvailabilityManager {
  constructor(store) {
    this.store = store; // Reference to main DataStore for shared state/services
  }

  load(teacherAvailability) {
    this.store.teacherAvailability = teacherAvailability || [];
  }

  addTeacherAvailability(availability) {
    const id =
      Math.max(...this.store.teacherAvailability.map((a) => a.id), 0) + 1;
    const newAvailability = {
      id,
      teacher_id: availability.teacher_id,
      from_date: availability.from_date || "",
      to_date: availability.to_date || "",
      slot_id: availability.slot_id || null, // Optional: for slot-level entries
      type: availability.type || "busy", // 'busy' eller 'free'
    };
    this.store.teacherAvailability.push(newAvailability);
    this.store.notify();
    return newAvailability;
  }

  getTeacherAvailability(teacherId) {
    return this.store.teacherAvailability.filter(
      (a) => a.teacher_id === teacherId
    );
  }

  getAllTeacherAvailability() {
    return this.store.teacherAvailability;
  }

  removeTeacherAvailability(id) {
    const index = this.store.teacherAvailability.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.store.teacherAvailability.splice(index, 1);
      this.store.notify();
      return true;
    }
    return false;
  }

  toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId) {
    // Check if there's a slot-level unavailability entry for THIS specific slot
    const slotEntry = this.store.teacherAvailability.find(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.slot_id === slotId
    );

    if (slotEntry) {
      // Remove slot-level entry
      this.removeTeacherAvailability(slotEntry.id);
      return;
    }

    // Check if ALL days are individually marked (happens when painting in detail view)
    const days = this.store.slotsManager.getSlotDays(slotId);
    const dayEntries = days
      .map((day) =>
        this.store.teacherAvailability.find(
          (a) =>
            a.teacher_id === teacherId &&
            a.from_date === day &&
            a.type === "busy" &&
            !a.slot_id // Day-level entries don't have slot_id
        )
      )
      .filter(Boolean);

    if (dayEntries.length === days.length && days.length > 0) {
      // All days are marked - remove them all
      dayEntries.forEach((entry) => this.removeTeacherAvailability(entry.id));
    } else {
      // Add slot-level unavailability
      this.addTeacherAvailability({
        teacher_id: teacherId,
        from_date: slotDate,
        to_date: slotDate,
        slot_id: slotId,
        type: "busy",
      });
    }
  }

  toggleTeacherAvailabilityForDay(teacherId, dateStr) {
    // Check if there's already unavailability for this teacher on this day
    const existing = this.store.teacherAvailability.find(
      (a) => a.teacher_id === teacherId && a.from_date === dateStr
    );

    if (existing) {
      // Remove it
      this.removeTeacherAvailability(existing.id);
    } else {
      // Add unavailability
      this.addTeacherAvailability({
        teacher_id: teacherId,
        from_date: dateStr,
        to_date: dateStr,
        type: "busy",
      });
    }
  }

  isTeacherUnavailable(teacherId, slotDate, slotId = null) {
    // Check if there's a slot-level unavailability entry
    const hasSlotEntry = this.store.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id && // Is a slot-level entry
        (slotId === null || a.slot_id === slotId) // Match specific slot if provided
    );

    if (hasSlotEntry) return true;

    // Check if ALL days in the slot are individually marked as unavailable
    const days = this.store.slotsManager.getSlotDays(slotId || slotDate);
    if (days.length === 0) return false;

    // Must have at least one unavailable day AND all days must be unavailable
    const unavailableDays = days.filter((day) =>
      this.store.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacherId &&
          a.from_date === day &&
          a.type === "busy" &&
          !a.slot_id // Only count day-level entries
      )
    );

    return unavailableDays.length > 0 && unavailableDays.length === days.length;
  }

  // Check if teacher is unavailable on a specific day (for detail view)
  isTeacherUnavailableOnDay(teacherId, dateStr) {
    return this.store.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === dateStr &&
        a.type === "busy"
    );
  }

  // Get percentage of days in a slot where teacher is unavailable (0.0 to 1.0)
  getTeacherUnavailablePercentageForSlot(teacherId, slotDate, slotId = null) {
    // Check if there's a slot-level unavailability entry (100%)
    const hasSlotEntry = this.store.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id && // Is a slot-level entry
        (slotId === null || a.slot_id === slotId) // Match specific slot if provided
    );

    if (hasSlotEntry) return 1.0; // 100% unavailable

    // Check individual days
    const days = this.store.slotsManager.getSlotDays(slotId || slotDate);
    if (days.length === 0) return 0;

    const unavailableDays = days.filter((day) =>
      this.store.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacherId &&
          a.from_date === day &&
          a.type === "busy" &&
          !a.slot_id // Only count day-level entries
      )
    );

    return unavailableDays.length / days.length;
  }
}