import {
  db,
  ensureSlotDaysForSlot,
  DEFAULT_SLOT_LENGTH_DAYS,
} from "../../../../db/index.js";

export function insertTeacherAvailability(ops = [], { remapTeacherId, remapSlotId }) {
  if (!ops.length) return;

  const hasDayRangeOps = ops.some((op) => op.type === "dayRange");
  if (hasDayRangeOps) {
    const slots = db
      .prepare("SELECT slot_id, start_date, end_date FROM slots")
      .all();
    slots.forEach((slot) => {
      try {
        const normalizedStart = normalizeDateOnly(slot?.start_date);
        let endDate = normalizeDateOnly(slot?.end_date);
        if (!endDate && normalizedStart) {
          const end = new Date(normalizedStart);
          if (!Number.isNaN(end.getTime())) {
            end.setDate(end.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
            endDate = end.toISOString().split("T")[0];
          }
        }
        if (!normalizedStart || !endDate) return;
        ensureSlotDaysForSlot({
          ...slot,
          start_date: normalizedStart,
          end_date: endDate,
        });
      } catch (error) {
        console.warn(
          "Failed to ensure slot_days for slot",
          slot?.slot_id,
          error
        );
      }
    });
  }

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
    .prepare(
      "SELECT slot_day_id FROM slot_days WHERE date(date) >= date(?) AND date(date) <= date(?)"
    )
    .all(startStr, endStr);

  dayRows.forEach((dr) => {
    if (op.action === "insert") {
      insertDay.run(op.id || null, teacherId, dr.slot_day_id, op.created_at || new Date().toISOString());
    } else {
      deleteDay.run(teacherId, dr.slot_day_id);
    }
  });
}

function normalizeDateOnly(value) {
  if (!value) return "";
  const raw = String(value);
  const splitOnT = raw.split("T")[0];
  return splitOnT.split(" ")[0];
}
