// src/core/store/slots.js
import { showAlert } from "../../shared/utils/ui.js";

export class SlotsManager {
  constructor(store) {
    this.store = store;
  }

  load(slots) {
    this.store.slots = slots || [];
  }

  // SLOTS
  addSlot(slot) {
    const startStr = this.store.normalizer.normalizeDateOnly(slot.start_date);
    if (!startStr) {
      const message = "Kan inte skapa slot utan giltigt startdatum.";
      showAlert(message);
      throw new Error(message);
    }

    const explicitEnd = this.store.normalizer.normalizeDateOnly(slot.end_date);
    const endDateObj = explicitEnd
      ? new Date(explicitEnd)
      : this.store.normalizer.defaultSlotEndDate(startStr);
    const endStr = this.store.normalizer.normalizeDateOnly(endDateObj);

    if (!endStr) {
      const message = "Kan inte skapa slot utan giltigt slutdatum.";
      showAlert(message);
      throw new Error(message);
    }

    if (new Date(endStr) <= new Date(startStr)) {
      const message = "Slotens slutdatum måste vara efter startdatum.";
      showAlert(message);
      throw new Error(message);
    }

    const overlapping = this.findOverlappingSlot(startStr, endStr);
    if (overlapping) {
      const overlappingRange = this.store.normalizer.getSlotRange(overlapping);
      const conflictEnd =
        overlappingRange?.endStr ||
        overlapping.end_date ||
        this.store.normalizer.normalizeDateOnly(
          this.store.normalizer.defaultSlotEndDate(overlapping.start_date)
        );
      const message = `Slot ${startStr}–${endStr} krockar med befintlig slot ${overlapping.start_date}–${conflictEnd}.`;
      showAlert(message);
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

    // Generate default teaching days for new slot
    this.store.generateDefaultTeachingDays(id);
    // Keep normalized slotDays in sync
    this.ensureSlotDaysFromSlots();

    this.store.notify();
    return newSlot;
  }

  getSlots() {
    return this.store.slots;
  }

  getSlot(slotId) {
    return this.getSlots().find((s) => s.slot_id === slotId);
  }

  deleteSlot(slotId) {
    // Prevent removal if there are course runs in the slot
    const runs = this.store.courseRunsManager.getCourseRunsBySlot(slotId);
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
    this.store.slotDays = this.store.slotDays.filter(
      (sd) => String(sd.slot_id) !== String(slotId)
    );

    // Remove any cohort_slot_courses / courseSlots referencing slot
    this.store.courseRunsManager.courseSlots = (
      this.store.courseRunsManager.courseSlots || []
    ).filter((cs) => String(cs.slot_id) !== String(slotId));

    // Recompute derived data
    this.store.courseRunsManager.ensureCourseSlotsFromRuns();
    this.ensureSlotDaysFromSlots();
    this.store.notify();
    return true;
  }

  findOverlappingSlot(startDateStr, endDateStr, ignoreSlotId = null) {
    const normalizedStart = this.store.normalizer.normalizeDateOnly(startDateStr);
    const normalizedEnd = this.store.normalizer.normalizeDateOnly(endDateStr);
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
      const range = this.store.normalizer.getSlotRange(slot);
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
      this.getSlots().find((s) => normalizeDate(s.start_date) === normalizedDate);

    // Prefer normalized slotDays if they exist
    if (
      slot?.slot_id &&
      Array.isArray(this.store.slotDays) &&
      this.store.slotDays.some((sd) => String(sd.slot_id) === String(slot.slot_id))
    ) {
      return this.store.slotDays
        .filter((sd) => String(sd.slot_id) === String(slot.slot_id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((sd) => normalizeDate(sd.date));
    }

    if (!slot) return [];

    return this.computeSlotDayRange(slot);
  }
  computeSlotDayRange(slot) {
    if (!slot) return [];

    const slotRange = this.store.normalizer.getSlotRange(slot);
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
      endDate = this.store.normalizer.defaultSlotEndDate(slotRange.start);
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
    if (!Array.isArray(this.store.slotDays)) {
      this.store.slotDays = [];
    }

    const normalizeDate = (value) => (value || "").split("T")[0];
    let nextId =
      this.store.slotDays.reduce(
        (max, sd) => Math.max(max, sd.slot_day_id || 0),
        0
      ) + 1;

    for (const slot of this.getSlots() || []) {
      const hasDays = this.store.slotDays.some(
        (sd) => String(sd.slot_id) === String(slot.slot_id)
      );
      if (hasDays) continue;

      const days = this.computeSlotDayRange(slot);
      days.forEach((date) =>
        this.store.slotDays.push({
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