/**
 * Teaching Days Manager
 * Manages which days within slots are active teaching days
 * Handles both slot-level defaults and course-specific overrides
 */
export class TeachingDaysManager {
  constructor(events, slotsManager, courseRunsManager) {
    this.events = events;
    this.slotsManager = slotsManager;
    this.courseRunsManager = courseRunsManager;
    this.teachingDays = [];
    this.slotDays = [];
    this.courseSlotDays = [];
  }

  /**
   * Load teaching days data from backend
   * @param {Array} teachingDays - Legacy teaching days records
   */
  loadTeachingDays(teachingDays) {
    this.teachingDays = teachingDays || [];
  }

  /**
   * Load slot days data from backend
   * @param {Array} slotDays - Slot day records
   */
  loadSlotDays(slotDays) {
    this.slotDays = slotDays || [];
  }

  /**
   * Load course-specific teaching days from backend
   * @param {Array} courseSlotDays - Course slot day records with active/inactive flags
   */
  loadCourseSlotDays(courseSlotDays) {
    this.courseSlotDays = courseSlotDays || [];
  }

  _ensureCourseSlotDayDefaults() {
    if (!Array.isArray(this.courseSlotDays)) {
      this.courseSlotDays = [];
    }
    const normalizeDate = (v) => (v || "").split("T")[0];
    let nextId =
      this.courseSlotDays.reduce(
        (max, csd) => Math.max(max, csd.course_slot_day_id || 0),
        0
      ) + 1;

    for (const cs of this.courseRunsManager.courseSlots || []) {
      const defaults = this.slotsManager.getDefaultTeachingDaysPattern(cs.slot_id);
      defaults.forEach((d) => {
        const exists = this.courseSlotDays.some(
          (csd) =>
            String(csd.course_slot_id) === String(cs.course_slot_id) &&
            normalizeDate(csd.date) === normalizeDate(d)
        );
        if (!exists) {
          this.courseSlotDays.push({
            course_slot_day_id: nextId++,
            course_slot_id: cs.course_slot_id,
            date: normalizeDate(d),
            is_default: 1,
            active: 1,
          });
        }
      });
    }
  }

  generateDefaultTeachingDays() {}
  initializeAllTeachingDays() {}

  /**
   * Toggle teaching day state for a slot
   * Can toggle for all courses in slot or a specific course
   * @param {number} slotId - Slot ID
   * @param {string} date - Date (ISO format)
   * @param {number|null} [courseId=null] - Course ID (null = toggle for all courses)
   */
  toggleTeachingDay(slotId, date, courseId = null) {
    const defaultDates = this.slotsManager.getDefaultTeachingDaysPattern(slotId);
    const isDefaultDate = defaultDates.includes(date);

    if (courseId != null) {
      const specificIndex = this.teachingDays.findIndex(
        (td) =>
          td.slot_id === slotId && td.date === date && td.course_id === courseId
      );
      const baseState = this.getTeachingDayState(slotId, date, courseId) || {
        isDefault: isDefaultDate,
        active: false,
      };
      const desiredActive = !(baseState.active ?? false);

      if (specificIndex !== -1) {
        this.teachingDays[specificIndex].active = desiredActive;
      } else {
        this.teachingDays.push({
          slot_id: slotId,
          date,
          course_id: courseId,
          isDefault: baseState.isDefault ?? isDefaultDate,
          active: desiredActive,
        });
      }
      this.events.notify();
      // Auto-save happens in notify() - no manual save needed
      return;
    }

    const courseSlotsInSlot = (this.courseRunsManager.courseSlots || []).filter(
      (cs) => String(cs.slot_id) === String(slotId)
    );
    courseSlotsInSlot.forEach((cs) => {
      this.toggleCourseSlotDay(slotId, cs.course_id, date, {
        skipSave: true,
        skipNotify: true,
      });
    });
    this.events.notify();
    // Auto-save happens in notify() - no manual save needed
  }

  /**
   * Get the state of a teaching day (whether it's active/inactive and default/custom)
   * @param {number} slotId - Slot ID
   * @param {string} date - Date (ISO format)
   * @param {number|null} [courseId=null] - Course ID (null = get slot-level state)
   * @returns {Object|null} State object with {isDefault: boolean, active: boolean} or null
   */
  getTeachingDayState(slotId, date, courseId = null) {
    const normalizeDate = (v) => (v || "").split("T")[0];

    if (courseId != null) {
      const courseSlot = this.getCourseSlot(courseId, slotId);
      if (courseSlot) {
        const csd = (this.courseSlotDays || []).find(
          (csd) =>
            String(csd.course_slot_id) === String(courseSlot.course_slot_id) &&
            normalizeDate(csd.date) === normalizeDate(date)
        );
        if (csd) {
          return {
            isDefault: Boolean(csd.is_default),
            active: csd.active !== false,
          };
        }
        const defaultDates = this.slotsManager.getDefaultTeachingDaysPattern(slotId);
        if (defaultDates.includes(normalizeDate(date))) {
          return { isDefault: true, active: true };
        }
      }

      const td =
        this.teachingDays.find(
          (t) =>
            t.slot_id === slotId && t.date === date && t.course_id === courseId
        ) ||
        this.teachingDays.find(
          (t) =>
            t.slot_id === slotId &&
            t.date === date &&
            (t.course_id === null || t.course_id === undefined)
        );

      if (!td) return null;

      return {
        isDefault: td.isDefault || false,
        active: td.active !== false,
      };
    }

    const courseSlotsInSlot = (this.courseRunsManager.courseSlots || []).filter(
      (cs) => String(cs.slot_id) === String(slotId)
    );
    const matches = [];
    courseSlotsInSlot.forEach((cs) => {
      const hit = (this.courseSlotDays || []).find(
        (csd) =>
          String(csd.course_slot_id) === String(cs.course_slot_id) &&
          normalizeDate(csd.date) === normalizeDate(date)
      );
      if (hit) matches.push(hit);
    });

    if (matches.length > 0) {
      const anyActive = matches.some((m) => m.active !== false);
      const anyDefault = matches.some((m) => m.is_default);
      const anyDefaultInactive = matches.some(
        (m) => m.is_default && m.active === false
      );
      if (anyActive) {
        return { isDefault: anyDefault, active: true };
      }
      if (anyDefaultInactive) {
        return { isDefault: true, active: false };
      }
      return { isDefault: false, active: false };
    }

    const defaultDates = this.slotsManager.getDefaultTeachingDaysPattern(slotId);
    if (defaultDates.includes(normalizeDate(date))) {
      return { isDefault: true, active: true };
    }

    const generic = this.teachingDays.find(
      (t) =>
        t.slot_id === slotId &&
        t.date === date &&
        (t.course_id === null || t.course_id === undefined)
    );
    if (!generic) return null;
    return {
      isDefault: generic.isDefault || false,
      active: generic.active !== false,
    };
  }

  getTeachingDaysForSlot(slotId) {
    return this.teachingDays
      .filter((td) => td.slot_id === slotId)
      .map((td) => td.date);
  }

  isTeachingDay(slotId, date) {
    return this.teachingDays.some(
      (td) => td.slot_id === slotId && td.date === date
    );
  }

  /**
   * Get all course slots (courses scheduled in slots)
   * @returns {Array} Array of course slot objects
   */
  getCourseSlots() {
    return this.courseRunsManager.courseSlots || [];
  }

  /**
   * Get a specific course slot
   * @param {number} courseId - Course ID
   * @param {number} slotId - Slot ID
   * @returns {Object|undefined} Course slot object or undefined
   */
  getCourseSlot(courseId, slotId) {
    return (this.courseRunsManager.courseSlots || []).find(
      (cs) =>
        String(cs.course_id) === String(courseId) &&
        String(cs.slot_id) === String(slotId)
    );
  }

  /**
   * Get all active teaching days for a course slot
   * @param {number} courseSlotId - Course slot ID
   * @returns {string[]} Array of date strings (ISO format)
   */
  getCourseSlotDays(courseSlotId) {
    return (this.courseSlotDays || [])
      .filter((csd) => String(csd.course_slot_id) === String(courseSlotId))
      .filter((csd) => csd.active !== false)
      .map((csd) => (csd.date || csd.slot_day_id_date || "").split("T")[0]);
  }

  /**
   * Get active teaching days for a specific course in a specific slot
   * @param {number} slotId - Slot ID
   * @param {number} courseId - Course ID
   * @returns {string[]} Array of date strings (ISO format)
   */
  getCourseSlotDaysForCourse(slotId, courseId) {
    const courseSlot = this.getCourseSlot(courseId, slotId);
    if (!courseSlot) return [];
    return this.getCourseSlotDays(courseSlot.course_slot_id);
  }

  /**
   * Toggle a specific teaching day for a course in a slot
   * @param {number} slotId - Slot ID
   * @param {number} courseId - Course ID
   * @param {string} dateStr - Date (ISO format)
   * @param {Object} [options] - Options
   * @param {boolean} [options.skipSave=false] - Skip saving to backend
   * @param {boolean} [options.skipNotify=false] - Skip triggering notifications
   */
  toggleCourseSlotDay(
    slotId,
    courseId,
    dateStr,
    { skipSave = false, skipNotify = false } = {}
  ) {
    const courseSlot = this.getCourseSlot(courseId, slotId);
    if (!courseSlot) {
      return;
    }
    if (!Array.isArray(this.courseSlotDays)) {
      this.courseSlotDays = [];
    }
    const normalizeDate = (value) => (value || "").split("T")[0];
    const normalizedDate = normalizeDate(dateStr);
    const defaultDates = this.slotsManager.getDefaultTeachingDaysPattern(slotId);
    const isDefault = defaultDates.includes(normalizedDate);

    const existingIdx = this.courseSlotDays.findIndex(
      (csd) =>
        String(csd.course_slot_id) === String(courseSlot.course_slot_id) &&
        normalizeDate(csd.date) === normalizedDate
    );

    if (existingIdx >= 0) {
      const record = this.courseSlotDays[existingIdx];
      if (record.is_default) {
        record.active = record.active === false;
      } else {
        this.courseSlotDays.splice(existingIdx, 1);
      }
    } else {
      const nextId =
        this.courseSlotDays.reduce(
          (max, csd) => Math.max(max, csd.course_slot_day_id || 0),
          0
        ) + 1;
      this.courseSlotDays.push({
        course_slot_day_id: nextId,
        course_slot_id: courseSlot.course_slot_id,
        date: normalizedDate,
        is_default: isDefault ? 1 : 0,
        active: isDefault ? 0 : 1,
      });
    }
    if (!skipNotify) this.events.notify();
    // Auto-save happens in notify() - no manual save needed
  }
}
