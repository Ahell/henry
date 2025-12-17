// src/utils/store/availability.js
export class AvailabilityManager {
  constructor(store) {
    this.store = store;
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
      slot_id: availability.slot_id || null,
      type: availability.type || "busy",
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
    const slotEntry = this.store.teacherAvailability.find(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.slot_id === slotId
    );

    if (slotEntry) {
      this.removeTeacherAvailability(slotEntry.id);
      return;
    }

    const days = this.store.slotsManager.getSlotDays(slotId);
    const dayEntries = days
      .map((day) =>
        this.store.teacherAvailability.find(
          (a) =>
            a.teacher_id === teacherId &&
            a.from_date === day &&
            a.type === "busy" &&
            !a.slot_id
        )
      )
      .filter(Boolean);

    if (dayEntries.length === days.length && days.length > 0) {
      dayEntries.forEach((entry) => this.removeTeacherAvailability(entry.id));
    } else {
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
    const existing = this.store.teacherAvailability.find(
      (a) => a.teacher_id === teacherId && a.from_date === dateStr
    );

    if (existing) {
      this.removeTeacherAvailability(existing.id);
    } else {
      this.addTeacherAvailability({
        teacher_id: teacherId,
        from_date: dateStr,
        to_date: dateStr,
        type: "busy",
      });
    }
  }

  isTeacherUnavailable(teacherId, slotDate, slotId = null) {
    const hasSlotEntry = this.store.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id &&
        (slotId === null || a.slot_id === slotId)
    );

    if (hasSlotEntry) return true;

    const days = this.store.slotsManager.getSlotDays(slotId || slotDate);
    if (days.length === 0) return false;

    const unavailableDays = days.filter((day) =>
      this.store.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacherId &&
          a.from_date === day &&
          a.type === "busy" &&
          !a.slot_id
      )
    );

    return unavailableDays.length > 0 && unavailableDays.length === days.length;
  }

  isTeacherUnavailableOnDay(teacherId, dateStr) {
    return this.store.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === dateStr &&
        a.type === "busy"
    );
  }

  getTeacherUnavailablePercentageForSlot(teacherId, slotDate, slotId = null) {
    const hasSlotEntry = this.store.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id &&
        (slotId === null || a.slot_id === slotId)
    );

    if (hasSlotEntry) return 1.0;

    const days = this.store.slotsManager.getSlotDays(slotId || slotDate);
    if (days.length === 0) return 0;

    const unavailableDays = days.filter((day) =>
      this.store.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacherId &&
          a.from_date === day &&
          a.type === "busy" &&
          !a.slot_id
      )
    );

    return unavailableDays.length / days.length;
  }
}
