import { store } from "../../core/store/DataStore.js";

/**
 * Check if there is a slot-level "busy" entry for a teacher.
 * Slot-level entries have a `slot_id` and `type: 'busy'`.
 * @param {number} teacherId
 * @param {number} slotId
 * @param {string} [fromDate] - optional from_date to match specifically
 * @returns {boolean}
 */
export function hasBusySlotEntry(teacherId, slotId, fromDate) {
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
 * Returns the availability entry or undefined.
 * @param {number} teacherId
 * @param {number} slotId
 * @param {string} [fromDate]
 */
export function findBusySlotEntry(teacherId, slotId, fromDate) {
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
 * @param {number} teacherId
 * @param {number} slotId
 * @param {string} [fromDate]
 */
export function removeBusySlotEntry(teacherId, slotId, fromDate) {
  const entry = findBusySlotEntry(teacherId, slotId, fromDate);
  if (entry) store.removeTeacherAvailability(entry.id);
  return entry;
}

/**
 * Convert a slot-level busy entry into day-level busy entries for
 * all days in the slot except the clickedDate.
 * (Slot-level -> multiple day-level entries)
 * @param {number} teacherId
 * @param {number} slotId
 * @param {string} slotFromDate
 * @param {string} clickedDate
 */
export function convertSlotEntryToDayEntries(
  teacherId,
  slotId,
  slotFromDate,
  clickedDate
) {
  const days = store.getSlotDays(slotId);
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
 * Determine whether a given day is unavailable for a teacher either because
 * of a day-level busy entry, or because the entire slot is marked busy
 * (when in detail view).
 * @param {number} teacherId
 * @param {string} dateStr
 * @param {number} detailSlotId
 * @param {string} detailSlotDate
 * @returns {boolean}
 */
export function isDayUnavailableConsideringSlot(
  teacherId,
  dateStr,
  detailSlotId,
  detailSlotDate
) {
  if (store.isTeacherUnavailableOnDay(teacherId, dateStr)) return true;
  if (detailSlotId && detailSlotDate) {
    return hasBusySlotEntry(teacherId, detailSlotId, detailSlotDate);
  }
  return false;
}

// Backwards-compatible / convenience helpers (old names)
/**
 * Old name: teacherHasSlotEntry
 */
export function teacherHasSlotEntry(teacherId, fromDate, slotId) {
  return hasBusySlotEntry(teacherId, slotId, fromDate);
}

/**
 * Old name: findTeacherSlotEntry
 */
export function findTeacherSlotEntry(teacherId, fromDate, slotId) {
  return findBusySlotEntry(teacherId, slotId, fromDate);
}

/**
 * Old name: convertSlotEntryToDayEntriesAndRemove
 * Delegates to the canonical helpers: find, convert, remove.
 */
export function convertSlotEntryToDayEntriesAndRemove(
  slotId,
  teacherId,
  clickedDate
) {
  // slotId, teacherId order preserved from previous signature
  const entry = findBusySlotEntry(teacherId, slotId);
  if (entry) {
    convertSlotEntryToDayEntries(
      teacherId,
      slotId,
      entry.from_date,
      clickedDate
    );
    removeBusySlotEntry(teacherId, slotId, entry.from_date);
    return entry;
  }
}

/** Toggle day availability (proxy to store) */
export function toggleDayAvailability(teacherId, dateStr) {
  return store.toggleTeacherAvailabilityForDay(teacherId, dateStr);
}

/** Day-level unavailable check (proxy) */
export function isDayUnavailable(teacherId, dateStr) {
  return store.isTeacherUnavailableOnDay(teacherId, dateStr);
}

/** Toggle slot availability (proxy) */
export function toggleSlotAvailability(teacherId, slotDate, slotId) {
  return store.toggleTeacherAvailabilityForSlot(teacherId, slotDate, slotId);
}
