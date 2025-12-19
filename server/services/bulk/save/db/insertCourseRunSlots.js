import { db } from "../../../../db/index.js";

export function insertCourseRunSlots(rows = []) {
  if (!rows.length) return;
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)"
  );
  rows.forEach((rs) => stmt.run(rs.run_id, rs.slot_id, rs.sequence || 1));
}

