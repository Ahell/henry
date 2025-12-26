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

  _runCoversSlotId(run, slotId) {
    if (!run || slotId == null) return false;
    if (Array.isArray(run.slot_ids) && run.slot_ids.length > 0) {
      return run.slot_ids.some((id) => String(id) === String(slotId));
    }
    return String(run.slot_id) === String(slotId);
  }

  _getCourseSlotsCoveringSlot(slotId) {
    const courseSlots = Array.isArray(this.courseRunsManager.courseSlots)
      ? this.courseRunsManager.courseSlots
      : [];

    const byId = new Map();

    // Direct (slot_id matches) course slots
    courseSlots
      .filter((cs) => String(cs.slot_id) === String(slotId))
      .forEach((cs) => {
        const key = String(cs.course_slot_id ?? cs.cohort_slot_course_id ?? "");
        if (!key) return;
        byId.set(key, cs);
      });

    // Also include course runs that span across slots (15hp etc),
    // by mapping to the course_slot_id of the run's start slot.
    const runs = Array.isArray(this.courseRunsManager.courseRuns)
      ? this.courseRunsManager.courseRuns
      : [];
    runs
      .filter((run) => this._runCoversSlotId(run, slotId))
      .forEach((run) => {
        const cs = courseSlots.find(
          (row) =>
            String(row.course_id) === String(run.course_id) &&
            String(row.slot_id) === String(run.slot_id)
        );
        if (!cs) return;
        const key = String(cs.course_slot_id ?? cs.cohort_slot_course_id ?? "");
        if (!key) return;
        byId.set(key, cs);
      });

    return Array.from(byId.values());
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
    const toBool = (value) => {
      if (value === false) return false;
      if (value === true) return true;
      if (value === 0 || value === "0") return false;
      if (value === 1 || value === "1") return true;
      if (value == null) return true;
      return Boolean(value);
    };
    const toInt01 = (value) => {
      if (value === 1 || value === true || value === "1") return 1;
      return 0;
    };
    this.courseSlotDays = (courseSlotDays || []).map((csd) => ({
      ...csd,
      active: toBool(csd.active),
      is_default: toInt01(csd?.is_default),
    }));
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
      const courseSlotId = cs.course_slot_id ?? cs.cohort_slot_course_id;
      if (courseSlotId == null) continue;
      const defaults = this.slotsManager.getDefaultTeachingDaysPattern(cs.slot_id);
      defaults.forEach((d) => {
        const exists = this.courseSlotDays.some(
          (csd) =>
            String(csd.course_slot_id) === String(courseSlotId) &&
            normalizeDate(csd.date) === normalizeDate(d)
        );
        if (!exists) {
          this.courseSlotDays.push({
            course_slot_day_id: nextId++,
            course_slot_id: courseSlotId,
            date: normalizeDate(d),
            is_default: 1,
            active: true,
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

    const courseSlotsInSlot = this._getCourseSlotsCoveringSlot(slotId);
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
        const courseSlotId =
          courseSlot.course_slot_id ?? courseSlot.cohort_slot_course_id;
        if (courseSlotId == null) return null;
        const csd = (this.courseSlotDays || []).find(
          (csd) =>
            String(csd.course_slot_id) === String(courseSlotId) &&
            normalizeDate(csd.date) === normalizeDate(date)
        );
        if (csd) {
          return {
            isDefault: Boolean(csd.is_default),
            active: csd.active === true,
          };
        }
        const defaultDates = this.slotsManager.getDefaultTeachingDaysPattern(slotId);
        if (defaultDates.includes(normalizeDate(date))) {
          return { isDefault: true, active: true };
        }
      }

      const td = this.teachingDays.find(
        (t) => t.slot_id === slotId && t.date === date && t.course_id === courseId
      );

      if (!td) return null;

      return {
        isDefault: td.isDefault || false,
        active: td.active === true,
      };
    }

    const courseSlotsInSlot = this._getCourseSlotsCoveringSlot(slotId);
    const matches = [];
    courseSlotsInSlot.forEach((cs) => {
      const courseSlotId = cs.course_slot_id ?? cs.cohort_slot_course_id;
      if (courseSlotId == null) return;
      const hit = (this.courseSlotDays || []).find(
        (csd) =>
          String(csd.course_slot_id) === String(courseSlotId) &&
          normalizeDate(csd.date) === normalizeDate(date)
      );
      if (hit) matches.push(hit);
    });

    if (matches.length > 0) {
      const anyActive = matches.some((m) => m.active === true);
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
      active: generic.active === true,
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
    const direct = (this.courseRunsManager.courseSlots || []).find(
      (cs) =>
        String(cs.course_id) === String(courseId) &&
        String(cs.slot_id) === String(slotId)
    );
    if (direct) return direct;

    // Fallback for course runs spanning multiple slots (15hp etc):
    // find the run covering this slot and reuse the course_slot_id from its start slot.
    const runs = Array.isArray(this.courseRunsManager.courseRuns)
      ? this.courseRunsManager.courseRuns
      : [];
    const run = runs.find(
      (r) =>
        String(r.course_id) === String(courseId) && this._runCoversSlotId(r, slotId)
    );
    if (!run || run.run_id == null) return undefined;
    return (this.courseRunsManager.courseSlots || []).find(
      (cs) =>
        String(cs.course_id) === String(run.course_id) &&
        String(cs.slot_id) === String(run.slot_id)
    );
  }

  /**
   * Get all active teaching days for a course slot
   * @param {number} courseSlotId - Course slot ID
   * @returns {string[]} Array of date strings (ISO format)
   */
  getCourseSlotDays(courseSlotId) {
    const normalizeDate = (v) => (v || "").split("T")[0];
    return (this.courseSlotDays || [])
      .filter((csd) => String(csd.course_slot_id) === String(courseSlotId))
      .filter((csd) => csd.active === true)
      .map((csd) => normalizeDate(csd.date || csd.slot_day_id_date || ""))
      .filter(Boolean)
      .sort();
  }

  /**
   * Get active teaching days for a specific course in a specific slot
   * @param {number} slotId - Slot ID
   * @param {number} courseId - Course ID
   * @returns {string[]} Array of date strings (ISO format)
   */
  getCourseSlotDaysForCourse(slotId, courseId) {
    const courseSlot = this.getCourseSlot(courseId, slotId);
    if (!courseSlot) {
      return (this.slotsManager.getDefaultTeachingDaysPattern(slotId) || [])
        .map((d) => (d || "").split("T")[0])
        .filter(Boolean)
        .sort();
    }
    const courseSlotId =
      courseSlot.course_slot_id ?? courseSlot.cohort_slot_course_id;
    if (courseSlotId == null) {
      return (this.slotsManager.getDefaultTeachingDaysPattern(slotId) || [])
        .map((d) => (d || "").split("T")[0])
        .filter(Boolean)
        .sort();
    }
    return this.getCourseSlotDays(courseSlotId);
  }

  /**
   * Get all active teaching days for a course in a slot.
   * This is the canonical source for "course days" in the UI.
   * @param {number} slotId
   * @param {number} courseId
   * @returns {string[]} Sorted ISO date strings
   */
  getActiveCourseDaysInSlot(slotId, courseId) {
    return this.getCourseSlotDaysForCourse(slotId, courseId);
  }

  /**
   * Derived exam day = latest active course day in this slot.
   * @param {number} slotId
   * @param {number} courseId
   * @returns {string|null} ISO date string or null
   */
  getExamDayForCourseInSlot(slotId, courseId) {
    const days = this.getActiveCourseDaysInSlot(slotId, courseId);
    return days.length > 0 ? days[days.length - 1] : null;
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

    const courseSlotId =
      courseSlot.course_slot_id ?? courseSlot.cohort_slot_course_id;
    if (courseSlotId == null) return;

    const existingIdx = this.courseSlotDays.findIndex(
      (csd) =>
        String(csd.course_slot_id) === String(courseSlotId) &&
        normalizeDate(csd.date) === normalizedDate
    );

    if (existingIdx >= 0) {
      const record = this.courseSlotDays[existingIdx];
      if (record.is_default) {
        record.active = !record.active;
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
        course_slot_id: courseSlotId,
        date: normalizedDate,
        is_default: isDefault ? 1 : 0,
        active: isDefault ? false : true,
      });
    }
    if (!skipNotify) this.events.notify();
    // Auto-save happens in notify() - no manual save needed
  }
}
