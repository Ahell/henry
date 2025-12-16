import { normalizeCredits } from "../utils/index.js";

export default function createDbHelpers(db) {
  const getSortedSlots = () =>
    db
      .prepare(
        "SELECT slot_id, start_date FROM slots ORDER BY date(start_date), slot_id"
      )
      .all();

  const computeCourseSlotSpan = (courseId) => {
    const course = db
      .prepare("SELECT credits FROM courses WHERE course_id = ?")
      .get(courseId);
    return course && normalizeCredits(course.credits) === 15 ? 2 : 1;
  };

  const getConsecutiveSlotIds = (
    primarySlotId,
    span,
    sortedSlots = null
  ) => {
    const orderedSlots = sortedSlots || getSortedSlots();
    const index = orderedSlots.findIndex(
      (s) => String(s.slot_id) === String(primarySlotId)
    );
    if (index === -1) {
      return [primarySlotId];
    }

    const ids = [];
    for (let i = 0; i < span; i++) {
      const slot = orderedSlots[index + i];
      if (!slot) break;
      ids.push(slot.slot_id);
    }
    return ids.length > 0 ? ids : [primarySlotId];
  };

  const ensureSlotDaysForSlot = (slot) => {
    if (!slot || !slot.slot_id || !slot.start_date || !slot.end_date) return;
    const start = new Date(slot.start_date);
    const end = new Date(slot.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    const insert = db.prepare(
      "INSERT OR IGNORE INTO slot_days (slot_id, date) VALUES (?, ?)"
    );

    db.transaction(() => {
      const d = new Date(start);
      while (d <= end) {
        insert.run(slot.slot_id, d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }
    })();
  };

  const upsertRunSlots = (runId, primarySlotId, span) => {
    const slotIds = getConsecutiveSlotIds(primarySlotId, span);
    const deleteStmt = db.prepare(
      "DELETE FROM course_run_slots WHERE run_id = ?"
    );
    const insertStmt = db.prepare(
      "INSERT OR IGNORE INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)"
    );
    db.transaction(() => {
      deleteStmt.run(runId);
      slotIds.forEach((slotId, idx) => insertStmt.run(runId, slotId, idx + 1));
    })();
    return slotIds;
  };

  return {
    getSortedSlots,
    computeCourseSlotSpan,
    getConsecutiveSlotIds,
    ensureSlotDaysForSlot,
    upsertRunSlots,
  };
}
