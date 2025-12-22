import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

const getAvailabilityMatrix = (db) => {
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
  return result;
};

const updateAvailability = (db, data) => {
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
};

router.get("/", (req, res) => {
  try {
    const result = getAvailabilityMatrix(db);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const [teacher_id, slot_id] = req.params.id.split("-").map(Number);
    const unavail = db
      .prepare(
        "SELECT 1 FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
      )
      .get(teacher_id, slot_id);
    res.json({ available: !unavail });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req, res) => {
  try {
    updateAvailability(db, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", (req, res) => {
  try {
    const [teacher_id, slot_id] = req.params.id.split("-").map(Number);
    const available = Boolean(req.body.available);
    if (!available) {
      db.prepare(
        "INSERT OR IGNORE INTO teacher_slot_unavailability (teacher_id, slot_id, created_at) VALUES (?, ?, ?)"
      ).run(teacher_id, slot_id, new Date().toISOString());
    } else {
      db.prepare(
        "DELETE FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
      ).run(teacher_id, slot_id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const [teacher_id, slot_id] = req.params.id.split("-").map(Number);
    db.prepare(
      "DELETE FROM teacher_slot_unavailability WHERE teacher_id = ? AND slot_id = ?"
    ).run(teacher_id, slot_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
