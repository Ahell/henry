import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const cohorts = db.prepare("SELECT * FROM cohorts").all();
    res.json(cohorts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const cohort = db
      .prepare("SELECT * FROM cohorts WHERE cohort_id = ?")
      .get(req.params.id);
    if (!cohort) {
      return res.status(404).json({ error: "Cohort not found" });
    }
    res.json(cohort);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req, res) => {
  try {
    const cohort = req.body;
    const stmt = db.prepare(
      "INSERT INTO cohorts (cohort_id, name, start_date, planned_size) VALUES (?, ?, ?, ?)"
    );
    stmt.run(
      cohort.cohort_id,
      cohort.name,
      cohort.start_date,
      cohort.planned_size
    );
    res.json(cohort);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", (req, res) => {
  try {
    const cohort = req.body;
    const stmt = db.prepare(
      "UPDATE cohorts SET name = ?, start_date = ?, planned_size = ? WHERE cohort_id = ?"
    );
    stmt.run(
      cohort.name,
      cohort.start_date,
      cohort.planned_size,
      req.params.id
    );
    res.json(cohort);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM cohorts WHERE cohort_id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
