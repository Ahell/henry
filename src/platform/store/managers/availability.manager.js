/**
 * Teacher Availability Manager
 * Manages teacher unavailability periods (busy times when teachers cannot teach)
 * Supports both slot-level and day-level granularity
 */
export class AvailabilityManager {
  constructor(events, slotsManager) {
    this.events = events;
    this.slotsManager = slotsManager;
    this.teacherAvailability = [];
  }

  _shouldNotify() {
    // During paint operations we suspend autosave; we also suppress global notify
    // so we don't run validations/re-renders for every single painted cell.
    return !(this.events?.store?.isAutoSaveSuspended);
  }

  /**
   * Load teacher availability data from backend
   * @param {Array} teacherAvailability - Array of availability records
   */
  load(teacherAvailability) {
    this.teacherAvailability = teacherAvailability || [];
  }

  /**
   * Add a teacher unavailability period
   * @param {Object} availability - Availability data
   * @param {number} availability.teacher_id - Teacher ID
   * @param {string} availability.from_date - Start date (ISO format)
   * @param {string} [availability.to_date] - End date (ISO format)
   * @param {number} [availability.slot_id] - Slot ID (null for day-level availability)
   * @param {string} [availability.type="busy"] - Type of unavailability
   * @returns {Object} Created availability record with generated ID
   */
  addTeacherAvailability(availability) {
    const id =
      Math.max(...this.teacherAvailability.map((a) => a.id), 0) + 1;
    const newAvailability = {
      id,
      teacher_id: availability.teacher_id,
      from_date: availability.from_date || "",
      to_date: availability.to_date || "",
      slot_id: availability.slot_id || null,
      type: availability.type || "busy",
    };
    this.teacherAvailability.push(newAvailability);
    if (this._shouldNotify()) this.events.notify();
    return newAvailability;
  }

  /**
   * Get all availability records for a specific teacher
   * @param {number} teacherId - Teacher ID
   * @returns {Array} Array of availability records for the teacher
   */
  getTeacherAvailability(teacherId) {
    return this.teacherAvailability.filter(
      (a) => a.teacher_id === teacherId
    );
  }

  /**
   * Get all teacher availability records
   * @returns {Array} All availability records
   */
  getAllTeacherAvailability() {
    return this.teacherAvailability;
  }

  /**
   * Remove a teacher availability record
   * @param {number} id - Availability record ID
   * @returns {boolean} True if removed, false if not found
   */
  removeTeacherAvailability(id) {
    const index = this.teacherAvailability.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.teacherAvailability.splice(index, 1);
      if (this._shouldNotify()) this.events.notify();
      return true;
    }
    return false;
  }

  /**
   * Toggle teacher availability for an entire slot
   * If all days in the slot are marked unavailable individually, converts to slot-level entry
   * If slot-level entry exists, removes it
   * @param {number} teacherId - Teacher ID
   * @param {string} slotDate - Slot start date
   * @param {number} slotId - Slot ID
   */
  toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId) {
    const slotEntry = this.teacherAvailability.find(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.slot_id === slotId
    );

    if (slotEntry) {
      // When toggling a slot back to "available", we also clear any day-level
      // unavailability inside that slot so the teacher becomes fully available
      // for the whole slot.
      const daysInSlot = this.slotsManager.getSlotDays(slotId);
      const daySet = new Set(daysInSlot);
      this.teacherAvailability = this.teacherAvailability.filter((a) => {
        if (a.teacher_id !== teacherId) return true;
        if (a.type !== "busy") return true;
        if (a.slot_id && a.slot_id === slotId && a.from_date === slotDate) {
          return false;
        }
        if (!a.slot_id && daySet.has(a.from_date)) {
          return false;
        }
        return true;
      });
      if (this._shouldNotify()) this.events.notify();
      return;
    }

    const days = this.slotsManager.getSlotDays(slotId);
    const dayEntries = days
      .map((day) =>
        this.teacherAvailability.find(
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

  /**
   * Toggle teacher availability for a single day
   * @param {number} teacherId - Teacher ID
   * @param {string} dateStr - Date (ISO format)
   */
  toggleTeacherAvailabilityForDay(teacherId, dateStr) {
    const existing = this.teacherAvailability.find(
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

  /**
   * Check if a teacher is unavailable for a specific slot
   * Returns true if either slot-level entry exists OR all days in slot are marked unavailable
   * @param {number} teacherId - Teacher ID
   * @param {string} slotDate - Slot start date
   * @param {number|null} [slotId=null] - Slot ID (if null, uses slotDate to find slot)
   * @returns {boolean} True if teacher is unavailable
   */
  isTeacherUnavailable(teacherId, slotDate, slotId = null) {
    const hasSlotEntry = this.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id &&
        (slotId === null || a.slot_id === slotId)
    );

    if (hasSlotEntry) return true;

    const days = this.slotsManager.getSlotDays(slotId || slotDate);
    if (days.length === 0) return false;

    const unavailableDays = days.filter((day) =>
      this.teacherAvailability.some(
        (a) =>
          a.teacher_id === teacherId &&
          a.from_date === day &&
          a.type === "busy" &&
          !a.slot_id
      )
    );

    return unavailableDays.length > 0 && unavailableDays.length === days.length;
  }

  /**
   * Check if a teacher is unavailable on a specific day
   * @param {number} teacherId - Teacher ID
   * @param {string} dateStr - Date (ISO format)
   * @returns {boolean} True if teacher is unavailable on this day
   */
  isTeacherUnavailableOnDay(teacherId, dateStr) {
    return this.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === dateStr &&
        a.type === "busy"
    );
  }

  /**
   * Get the percentage of unavailable days in a slot for a teacher
   * Useful for partial availability visualization
   * @param {number} teacherId - Teacher ID
   * @param {string} slotDate - Slot start date
   * @param {number|null} [slotId=null] - Slot ID (if null, uses slotDate to find slot)
   * @returns {number} Percentage from 0.0 (fully available) to 1.0 (fully unavailable)
   */
  getTeacherUnavailablePercentageForSlot(teacherId, slotDate, slotId = null) {
    const hasSlotEntry = this.teacherAvailability.some(
      (a) =>
        a.teacher_id === teacherId &&
        a.from_date === slotDate &&
        a.type === "busy" &&
        a.slot_id &&
        (slotId === null || a.slot_id === slotId)
    );

    if (hasSlotEntry) return 1.0;

    const days = this.slotsManager.getSlotDays(slotId || slotDate);
    if (days.length === 0) return 0;

    const unavailableDays = days.filter((day) =>
      this.teacherAvailability.some(
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
