import { db } from "../../../../db/index.js";

export function insertTeacherAvailability(ops = [], { remapTeacherId, remapSlotId }) {
  if (!ops.length) return;

  const insertSlot = db.prepare(
    "INSERT OR IGNORE INTO teacher_slot_unavailability (id, teacher_id, slot_id, created_at) VALUES (?, ?, ?, ?)"
  );
  const deleteSlot = db.prepare(
    "DELETE FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
  );

  const insertDay = db.prepare(
    "INSERT OR IGNORE INTO teacher_day_unavailability (id, teacher_id, slot_day_id, created_at) VALUES (?, ?, ?, ?)"
  );
  const deleteDay = db.prepare(
    "DELETE FROM teacher_day_unavailability WHERE teacher_id = ? AND slot_day_id = ?"
  );

  ops.forEach((op) => {
    if (op.type === "slot") {
      applySlotOp(op, { insertSlot, deleteSlot, remapTeacherId, remapSlotId });
      return;
    }
    if (op.type === "dayRange") {
      applyDayRangeOp(op, {
        insertDay,
        deleteDay,
        remapTeacherId,
      });
    }
  });
}

function applySlotOp(op, { insertSlot, deleteSlot, remapTeacherId, remapSlotId }) {
  const teacherId = remapTeacherId(op.teacher_id);
  const slotId = remapSlotId(op.slot_id);
  if (teacherId == null || slotId == null) return;

  if (op.action === "insert") {
    insertSlot.run(op.id || null, teacherId, slotId, op.created_at || new Date().toISOString());
  } else {
    deleteSlot.run(teacherId, slotId);
  }
}

function applyDayRangeOp(op, { insertDay, deleteDay, remapTeacherId }) {
  const teacherId = remapTeacherId(op.teacher_id);
  if (teacherId == null) return;

  const startStr = op.start_date;
  const endStr = op.end_date || op.start_date;
  const dayRows = db
    .prepare("SELECT slot_day_id FROM slot_days WHERE date >= ? AND date <= ?")
    .all(startStr, endStr);

  dayRows.forEach((dr) => {
    if (op.action === "insert") {
      insertDay.run(op.id || null, teacherId, dr.slot_day_id, op.created_at || new Date().toISOString());
    } else {
      deleteDay.run(teacherId, dr.slot_day_id);
    }
  });
}

