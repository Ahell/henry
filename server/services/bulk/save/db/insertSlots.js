import { db, ensureSlotDaysForSlot } from "../../../../db/index.js";

export function insertSlots(slots = []) {
  if (!slots.length) return;
  const stmt = db.prepare(
    "INSERT INTO slots (slot_id, start_date, end_date) VALUES (?, ?, ?)"
  );
  slots.forEach((s) => {
    stmt.run(s.slot_id, s.start_date, s.end_date);
    try {
      ensureSlotDaysForSlot(s);
    } catch (e) {
      console.warn(`Failed to ensure slot_days for slot ${s.slot_id}:`, e);
    }
  });
}

