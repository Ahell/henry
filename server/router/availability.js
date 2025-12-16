import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  const teachers = db.prepare("SELECT teacher_id FROM teachers").all();
  const slots = db.prepare("SELECT slot_id FROM slots").all();
  const unavailRows = db
    .prepare("SELECT teacher_id, slot_id FROM teacher_slot_unavailability")
    .all();
  const unavailSet = new Set(
    unavailRows.map((r) => `${r.teacher_id}-${r.slot_id}`)
  );

  const result = {};
  teachers.forEach((t) => {
    slots.forEach((s) => {
      const key = `${t.teacher_id}-${s.slot_id}`;
      result[key] = !unavailSet.has(key);
    });
  });

  res.json(result);
});

router.post("/", (req, res) => {
  const data = req.body;
  const insertUnavail = db.prepare(
    "INSERT OR IGNORE INTO teacher_slot_unavailability (teacher_id, slot_id, created_at) VALUES (?, ?, ?)"
  );
  const deleteUnavail = db.prepare(
    "DELETE FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
  );

  Object.entries(data).forEach(([key, available]) => {
    const [teacher_id, slot_id] = key.split("-").map(Number);
    const avail = Boolean(available);
    if (!avail) {
      insertUnavail.run(teacher_id, slot_id, new Date().toISOString());
    } else {
      deleteUnavail.run(teacher_id, slot_id);
    }
  });

  res.json({ success: true });
});

export default router;
