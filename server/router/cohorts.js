import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  const cohorts = db.prepare("SELECT * FROM cohorts").all();
  res.json(cohorts);
});

router.post("/", (req, res) => {
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
});

router.put("/:id", (req, res) => {
  const cohort = req.body;
  const stmt = db.prepare(
    "UPDATE cohorts SET name = ?, start_date = ?, planned_size = ? WHERE cohort_id = ?"
  );
  stmt.run(cohort.name, cohort.start_date, cohort.planned_size, req.params.id);
  res.json(cohort);
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM cohorts WHERE cohort_id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
