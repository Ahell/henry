import { db } from "../../../../db/index.js";

export function insertSlotDays(slotDays = [], remapSlotId) {
  if (!slotDays || !slotDays.length) return;
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO slot_days (slot_day_id, slot_id, date) VALUES (?, ?, ?)"
  );
  slotDays.forEach((sd) => {
    stmt.run(sd.slot_day_id || null, remapSlotId(sd.slot_id), sd.date);
  });
}

