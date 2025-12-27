// src/features/slots/store/slots.manager.js
import { showAlert } from "../../../utils/ui.js";
import {
  normalizeDateOnly,
  defaultSlotEndDate,
  DEFAULT_SLOT_LENGTH_DAYS,
  getSlotRange,
} from "../../../utils/date-utils.js";

export class SlotsManager {
  constructor(events, courseRunsManager) {
    this.events = events;
    this.courseRunsManager = courseRunsManager;
    this.slots = [];
    this.slotDays = [];
  }

  load(slots, slotDays) {
    this.slots = slots || [];
    this.slotDays = slotDays || [];
  }

  // SLOTS
  addSlot(slot) {
    const startStr = normalizeDateOnly(slot.start_date);
    if (!startStr) {
      throw new Error("Kan inte skapa slot utan giltigt startdatum.");
    }

    const endStr = normalizeDateOnly(slot.end_date);

    if (!endStr) {
      throw new Error("Kan inte skapa slot utan giltigt slutdatum.");
    }

    if (new Date(endStr) <= new Date(startStr)) {
      throw new Error("Slotens slutdatum måste vara efter startdatum.");
    }

    const overlapping = this.findOverlappingSlot(startStr, endStr);
    if (overlapping) {
      const overlappingRange = getSlotRange(overlapping);
      const conflictEnd =
        overlappingRange?.endStr ||
        overlapping.end_date ||
        normalizeDateOnly(defaultSlotEndDate(overlapping.start_date));
      const message = `Slot ${startStr}–${endStr} krockar med befintlig slot ${overlapping.start_date}–${conflictEnd}.`;
      throw new Error(message);
    }

    const id = Math.max(...this.getSlots().map((s) => s.slot_id), 0) + 1;
    const newSlot = {
      slot_id: id,
      start_date: startStr,
      end_date: endStr,
      evening_pattern: slot.evening_pattern || "",
      is_placeholder: slot.is_placeholder !== false,
      location: slot.location || "",
      is_law_period: slot.is_law_period || false,
    };
    this.getSlots().push(newSlot);

    // Keep normalized slotDays in sync
    this.ensureSlotDaysFromSlots();

    this.events.notify();
    return newSlot;
  }

  getSlots() {
    return this.slots;
  }

  getSlot(slotId) {
    return this.getSlots().find((s) => s.slot_id === slotId);
  }

  deleteSlot(slotId) {
    // Prevent removal if there are course runs in the slot
    const runs = this.courseRunsManager.getCourseRunsBySlot(slotId);
    if (runs && runs.length > 0) {
      const message = "Kan inte ta bort slot som har tilldelade kurskörningar.";
      showAlert(message);
      throw new Error(message);
    }

    const idx = this.getSlots().findIndex(
      (s) => String(s.slot_id) === String(slotId)
    );
    if (idx === -1) return false;

    // Remove slot
    this.getSlots().splice(idx, 1);

    // Remove any slotDays for this slot
    this.slotDays = this.slotDays.filter(
      (sd) => String(sd.slot_id) !== String(slotId)
    );

    // Remove any cohort_slot_courses / courseSlots referencing slot
    this.courseRunsManager.courseSlots = (
      this.courseRunsManager.courseSlots || []
    ).filter((cs) => String(cs.slot_id) !== String(slotId));

    // Recompute derived data
    this.courseRunsManager.ensureCourseSlotsFromRuns();
    this.ensureSlotDaysFromSlots();
    this.events.notify();
    return true;
  }

  updateSlot(slotId, updates) {
    const slot = this.getSlot(slotId);
    if (!slot) return null;

    const nextStart = normalizeDateOnly(
      updates.start_date ?? slot.start_date
    );
    if (!nextStart) {
      throw new Error("Slot behöver giltigt startdatum.");
    }

    let nextEnd = normalizeDateOnly(updates.end_date);
    if (!nextEnd) {
      const currentRange = getSlotRange(slot);
      const lengthDays = currentRange
        ? Math.max(
            1,
            Math.round(
              (currentRange.end.getTime() - currentRange.start.getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1
          )
        : DEFAULT_SLOT_LENGTH_DAYS;
      const endDate = new Date(nextStart);
      endDate.setDate(endDate.getDate() + lengthDays - 1);
      nextEnd = normalizeDateOnly(endDate);
    }

    if (!nextEnd) {
      throw new Error("Slot behöver giltigt slutdatum.");
    }

    if (new Date(nextEnd) <= new Date(nextStart)) {
      throw new Error("Slotens slutdatum måste vara efter startdatum.");
    }

    const overlapping = this.findOverlappingSlot(
      nextStart,
      nextEnd,
      slotId
    );
    if (overlapping) {
      const overlappingRange = getSlotRange(overlapping);
      const conflictEnd =
        overlappingRange?.endStr ||
        overlapping.end_date ||
        normalizeDateOnly(defaultSlotEndDate(overlapping.start_date));
      const message = `Slot ${nextStart}–${nextEnd} krockar med befintlig slot ${overlapping.start_date}–${conflictEnd}.`;
      throw new Error(message);
    }

    Object.assign(slot, {
      ...updates,
      start_date: nextStart,
      end_date: nextEnd,
    });

    this.slotDays = this.slotDays.filter(
      (sd) => String(sd.slot_id) !== String(slotId)
    );
    this.ensureSlotDaysFromSlots();
    this.events.notify();
    return slot;
  }

  findOverlappingSlot(startDateStr, endDateStr, ignoreSlotId = null) {
    const normalizedStart = normalizeDateOnly(startDateStr);
    const normalizedEnd = normalizeDateOnly(endDateStr);
    if (!normalizedStart || !normalizedEnd) return null;

    const start = new Date(normalizedStart);
    const end = new Date(normalizedEnd);

    return this.getSlots().find((slot) => {
      if (
        ignoreSlotId != null &&
        String(slot.slot_id) === String(ignoreSlotId)
      ) {
        return false;
      }
      const range = getSlotRange(slot);
      if (!range) return false;
      return start <= range.end && end >= range.start;
    });
  }

  getSlotDays(slotDateOrId) {
    if (!slotDateOrId) return [];

    const normalizeDate = (value) => (value || "").split("T")[0];

    const normalizedDate =
      typeof slotDateOrId === "string" ? normalizeDate(slotDateOrId) : null;

    // Support both slot_id (number/string) and start_date (string)
    const slot =
      this.getSlots().find((s) => String(s.slot_id) === String(slotDateOrId)) ||
      this.getSlots().find(
        (s) => normalizeDate(s.start_date) === normalizedDate
      );

    // Prefer normalized slotDays if they exist
    if (
      slot?.slot_id &&
      Array.isArray(this.slotDays) &&
      this.slotDays.some((sd) => String(sd.slot_id) === String(slot.slot_id))
    ) {
      return this.slotDays
        .filter((sd) => String(sd.slot_id) === String(slot.slot_id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((sd) => normalizeDate(sd.date));
    }

    if (!slot) return [];

    return this.computeSlotDayRange(slot);
  }
  computeSlotDayRange(slot) {
    if (!slot) return [];

    const slotRange = getSlotRange(slot);
    if (!slotRange) return [];

    const allSlots = this.getSlots()
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

    const normalizeDate = (value) => (value || "").split("T")[0];
    const slotIndex = allSlots.findIndex(
      (s) =>
        String(s.slot_id) === String(slot.slot_id) ||
        normalizeDate(s.start_date) === normalizeDate(slot.start_date)
    );

    let endDate = new Date(slotRange.end);
    for (let i = slotIndex + 1; i < allSlots.length; i++) {
      const candidateStart = new Date(allSlots[i].start_date);
      if (Number.isNaN(candidateStart.getTime())) continue;
      if (candidateStart > slotRange.start) {
        const candidateEnd = new Date(candidateStart);
        candidateEnd.setDate(candidateEnd.getDate() - 1);
        if (candidateEnd < endDate) {
          endDate = candidateEnd;
        }
        break;
      }
    }
    if (!endDate || Number.isNaN(endDate.getTime())) {
      endDate = defaultSlotEndDate(slotRange.start);
    }

    const days = [];
    const currentDate = new Date(slotRange.start);

    while (currentDate <= endDate) {
      days.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  ensureSlotDaysFromSlots() {
    if (!Array.isArray(this.slotDays)) {
      this.slotDays = [];
    }

    const normalizeDate = (value) => (value || "").split("T")[0];
    let nextId =
      this.slotDays.reduce((max, sd) => Math.max(max, sd.slot_day_id || 0), 0) +
      1;

    for (const slot of this.getSlots() || []) {
      const hasDays = this.slotDays.some(
        (sd) => String(sd.slot_id) === String(slot.slot_id)
      );
      if (hasDays) continue;

      const days = this.computeSlotDayRange(slot);
      days.forEach((date) =>
        this.slotDays.push({
          slot_day_id: nextId++,
          slot_id: slot.slot_id,
          date: normalizeDate(date),
        })
      );
    }
  }

  getDefaultTeachingDaysPattern(slotId) {
    const slot = this.getSlot(slotId);
    if (!slot) return [];

    const startDate = new Date(slot.start_date);
    const teachingDays = [];

    // Helper function to get date of specific weekday in specific week
    const getDateOfWeekday = (baseDate, weekOffset, targetWeekday) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + weekOffset * 7);

      // targetWeekday: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const currentDay = date.getDay();
      const daysToAdd = (targetWeekday - currentDay + 7) % 7;
      date.setDate(date.getDate() + daysToAdd);

      return date.toISOString().split("T")[0];
    };

    // Week 1: Monday and Thursday
    teachingDays.push(getDateOfWeekday(startDate, 0, 1)); // Monday
    teachingDays.push(getDateOfWeekday(startDate, 0, 4)); // Thursday

    // Week 2: Tuesday and Thursday
    teachingDays.push(getDateOfWeekday(startDate, 1, 2)); // Tuesday
    teachingDays.push(getDateOfWeekday(startDate, 1, 4)); // Thursday

    // Week 3: Tuesday and Thursday
    teachingDays.push(getDateOfWeekday(startDate, 2, 2)); // Tuesday
    teachingDays.push(getDateOfWeekday(startDate, 2, 4)); // Thursday

    // Week 4: Monday and Friday (exam)
    teachingDays.push(getDateOfWeekday(startDate, 3, 1)); // Monday
    teachingDays.push(getDateOfWeekday(startDate, 3, 5)); // Friday (Tenta)

    return teachingDays;
  }
}
