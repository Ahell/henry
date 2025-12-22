import express from "express";
import { db, ensureSlotDaysForSlot } from "../db/index.js";

const DEFAULT_SLOT_LENGTH_DAYS = 28;

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const slots = db.prepare("SELECT * FROM slots").all();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req, res) => {
  const slot = req.body;

  // Validate end_date is exactly start_date + DEFAULT_SLOT_LENGTH_DAYS - 1
  if (slot.start_date && slot.end_date) {
    const start = new Date(slot.start_date);
    const expectedEnd = new Date(start);
    expectedEnd.setDate(expectedEnd.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
    const expectedEndStr = expectedEnd.toISOString().split("T")[0];
    if (slot.end_date !== expectedEndStr) {
      return res.status(400).json({
        error: `End date must be exactly ${DEFAULT_SLOT_LENGTH_DAYS} days after start date`,
      });
    }
  }

  const stmt = db.prepare(
    "INSERT INTO slots (slot_id, start_date, end_date) VALUES (?, ?, ?)"
  );
  stmt.run(slot.slot_id, slot.start_date, slot.end_date);

  try {
    ensureSlotDaysForSlot(slot);
  } catch (e) {
    console.warn("Failed to ensure slot_days for new slot:", e);
  }

  res.json(slot);
});

export default router;
