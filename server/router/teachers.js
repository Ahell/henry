import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const teachers = db.prepare("SELECT * FROM teachers").all();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req, res) => {
  try {
    const teacher = req.body;
    const stmt = db.prepare(
      "INSERT INTO teachers (teacher_id, name, home_department) VALUES (?, ?, ?)"
    );
    stmt.run(teacher.teacher_id, teacher.name, teacher.home_department);
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", (req, res) => {
  try {
    const teacher = req.body;
    const stmt = db.prepare(
      "UPDATE teachers SET name = ?, home_department = ? WHERE teacher_id = ?"
    );
    stmt.run(teacher.name, teacher.home_department, req.params.id);
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM teachers WHERE teacher_id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
