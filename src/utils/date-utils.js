// Shared date utilities for validation and calculations.

export const DEFAULT_SLOT_LENGTH_DAYS = 28;

export function normalizeDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

export function defaultSlotEndDate(startDate) {
  const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
  return end;
}

export function getSlotRange(slot) {
  if (!slot) return null;
  const startStr = normalizeDateOnly(slot.start_date);
  if (!startStr) return null;
  const endStr =
    normalizeDateOnly(slot.end_date) ||
    normalizeDateOnly(defaultSlotEndDate(startStr));
  if (!endStr) return null;
  return {
    start: new Date(startStr),
    end: new Date(endStr),
    startStr,
    endStr,
  };
}
