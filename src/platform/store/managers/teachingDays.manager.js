// Teaching days store manager
export class TeachingDaysManager {
  constructor(store) {
    this.store = store;
  }

  loadTeachingDays(teachingDays) {
    this.store.teachingDays = teachingDays || [];
  }

  loadSlotDays(slotDays) {
    this.store.slotDays = slotDays || [];
  }

  loadCourseSlotDays(courseSlotDays) {
    this.store.courseSlotDays = courseSlotDays || [];
  }

  _ensureCourseSlotDayDefaults() {
    if (!Array.isArray(this.store.courseSlotDays)) {
      this.store.courseSlotDays = [];
    }
    const normalizeDate = (v) => (v || "").split("T")[0];
    let nextId =
      this.store.courseSlotDays.reduce(
        (max, csd) => Math.max(max, csd.course_slot_day_id || 0),
        0
      ) + 1;

    for (const cs of this.store.courseRunsManager.courseSlots || []) {
      const defaults = this.store.slotsManager.getDefaultTeachingDaysPattern(cs.slot_id);
      defaults.forEach((d) => {
        const exists = this.store.courseSlotDays.some(
          (csd) =>
            String(csd.course_slot_id) === String(cs.course_slot_id) &&
            normalizeDate(csd.date) === normalizeDate(d)
        );
        if (!exists) {
          this.store.courseSlotDays.push({
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

  toggleTeachingDay(slotId, date, courseId = null) {
    const defaultDates = this.store.slotsManager.getDefaultTeachingDaysPattern(slotId);
    const isDefaultDate = defaultDates.includes(date);

    if (courseId != null) {
      const specificIndex = this.store.teachingDays.findIndex(
        (td) =>
          td.slot_id === slotId && td.date === date && td.course_id === courseId
      );
      const baseState = this.getTeachingDayState(slotId, date, courseId) || {
        isDefault: isDefaultDate,
        active: false,
      };
      const desiredActive = !(baseState.active ?? false);

      if (specificIndex !== -1) {
        this.store.teachingDays[specificIndex].active = desiredActive;
      } else {
        this.store.teachingDays.push({
          slot_id: slotId,
          date,
          course_id: courseId,
          isDefault: baseState.isDefault ?? isDefaultDate,
          active: desiredActive,
        });
      }
      this.store.notify();
      this.store.saveData().catch((err) =>
        console.error("Failed to save teaching day change:", err)
      );
      return;
    }

    const courseSlotsInSlot = (this.store.courseRunsManager.courseSlots || []).filter(
      (cs) => String(cs.slot_id) === String(slotId)
    );
    courseSlotsInSlot.forEach((cs) => {
      this.toggleCourseSlotDay(slotId, cs.course_id, date, {
        skipSave: true,
        skipNotify: true,
      });
    });
    this.store.notify();
    this.store.saveData().catch((err) =>
      console.error("Failed to save teaching day change:", err)
    );
  }

  getTeachingDayState(slotId, date, courseId = null) {
    const normalizeDate = (v) => (v || "").split("T")[0];

    if (courseId != null) {
      const courseSlot = this.getCourseSlot(courseId, slotId);
      if (courseSlot) {
        const csd = (this.store.courseSlotDays || []).find(
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
        const defaultDates = this.store.slotsManager.getDefaultTeachingDaysPattern(slotId);
        if (defaultDates.includes(normalizeDate(date))) {
          return { isDefault: true, active: true };
        }
      }

      const td =
        this.store.teachingDays.find(
          (t) =>
            t.slot_id === slotId && t.date === date && t.course_id === courseId
        ) ||
        this.store.teachingDays.find(
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

    const courseSlotsInSlot = (this.store.courseRunsManager.courseSlots || []).filter(
      (cs) => String(cs.slot_id) === String(slotId)
    );
    const matches = [];
    courseSlotsInSlot.forEach((cs) => {
      const hit = (this.store.courseSlotDays || []).find(
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

    const defaultDates = this.store.slotsManager.getDefaultTeachingDaysPattern(slotId);
    if (defaultDates.includes(normalizeDate(date))) {
      return { isDefault: true, active: true };
    }

    const generic = this.store.teachingDays.find(
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
    return this.store.teachingDays
      .filter((td) => td.slot_id === slotId)
      .map((td) => td.date);
  }

  isTeachingDay(slotId, date) {
    return this.store.teachingDays.some(
      (td) => td.slot_id === slotId && td.date === date
    );
  }

  getCourseSlots() {
    return this.store.courseRunsManager.courseSlots || [];
  }

  getCourseSlot(courseId, slotId) {
    return (this.store.courseRunsManager.courseSlots || []).find(
      (cs) =>
        String(cs.course_id) === String(courseId) &&
        String(cs.slot_id) === String(slotId)
    );
  }

  getCourseSlotDays(courseSlotId) {
    return (this.store.courseSlotDays || [])
      .filter((csd) => String(csd.course_slot_id) === String(courseSlotId))
      .filter((csd) => csd.active !== false)
      .map((csd) => (csd.date || csd.slot_day_id_date || "").split("T")[0]);
  }

  getCourseSlotDaysForCourse(slotId, courseId) {
    const courseSlot = this.getCourseSlot(courseId, slotId);
    if (!courseSlot) return [];
    return this.getCourseSlotDays(courseSlot.course_slot_id);
  }

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
    if (!Array.isArray(this.store.courseSlotDays)) {
      this.store.courseSlotDays = [];
    }
    const normalizeDate = (value) => (value || "").split("T")[0];
    const normalizedDate = normalizeDate(dateStr);
    const defaultDates = this.store.slotsManager.getDefaultTeachingDaysPattern(slotId);
    const isDefault = defaultDates.includes(normalizedDate);

    const existingIdx = this.store.courseSlotDays.findIndex(
      (csd) =>
        String(csd.course_slot_id) === String(courseSlot.course_slot_id) &&
        normalizeDate(csd.date) === normalizedDate
    );

    if (existingIdx >= 0) {
      const record = this.store.courseSlotDays[existingIdx];
      if (record.is_default) {
        record.active = record.active === false;
      } else {
        this.store.courseSlotDays.splice(existingIdx, 1);
      }
    } else {
      const nextId =
        this.store.courseSlotDays.reduce(
          (max, csd) => Math.max(max, csd.course_slot_day_id || 0),
          0
        ) + 1;
      this.store.courseSlotDays.push({
        course_slot_day_id: nextId,
        course_slot_id: courseSlot.course_slot_id,
        date: normalizedDate,
        is_default: isDefault ? 1 : 0,
        active: isDefault ? 0 : 1,
      });
    }
    if (!skipNotify) this.store.notify();
    if (!skipSave) {
      this.store.saveData().catch((err) =>
        console.error("Failed to save course slot day change:", err)
      );
    }
  }
}
