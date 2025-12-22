import express from "express";
import { db, ensureSlotDaysForSlot } from "../db/index.js";

const DEFAULT_SLOT_LENGTH_DAYS = 28;

const router = express.Router();

// Validation function
const validateSlot = (slot) => {
  if (slot.start_date && slot.end_date) {
    const start = new Date(slot.start_date);
    const expectedEnd = new Date(start);
    expectedEnd.setDate(expectedEnd.getDate() + DEFAULT_SLOT_LENGTH_DAYS - 1);
    const expectedEndStr = expectedEnd.toISOString().split("T")[0];
    if (slot.end_date !== expectedEndStr) {
      throw new Error(
        `End date must be exactly ${DEFAULT_SLOT_LENGTH_DAYS} days after start date`
      );
    }
  }
};

router.get("/", (req, res) => {
  try {
    const slots = db.prepare("SELECT * FROM slots").all();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const slot = db
      .prepare("SELECT * FROM slots WHERE slot_id = ?")
      .get(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req, res) => {
  try {
    const slot = req.body;
    validateSlot(slot);
    const stmt = db.prepare(
      "INSERT INTO slots (slot_id, start_date, end_date) VALUES (?, ?, ?)"
    );
    stmt.run(slot.slot_id, slot.start_date, slot.end_date);

    ensureSlotDaysForSlot(slot); // Now critical; failure will cause 500

    res.json(slot);
  } catch (error) {
    if (error.message.includes("End date")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.put("/:id", (req, res) => {
  try {
    const slot = req.body;
    validateSlot(slot);
    const stmt = db.prepare(
      "UPDATE slots SET start_date = ?, end_date = ? WHERE slot_id = ?"
    );
    stmt.run(slot.start_date, slot.end_date, req.params.id);

    // Adjust slot_days for the updated date range
    db.prepare("DELETE FROM slot_days WHERE slot_id = ?").run(req.params.id);
    ensureSlotDaysForSlot({ ...slot, slot_id: req.params.id }); // Pass updated slot with ID

    res.json(slot);
  } catch (error) {
    if (error.message.includes("End date")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.delete("/:id", (req, res) => {
  try {
    const slotId = req.params.id;
    // Clean up related slot_days
    db.prepare("DELETE FROM slot_days WHERE slot_id = ?").run(slotId);
    db.prepare("DELETE FROM slots WHERE slot_id = ?").run(slotId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
