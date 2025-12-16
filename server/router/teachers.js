import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  const teachers = db.prepare("SELECT * FROM teachers").all();
  res.json(teachers);
});

router.post("/", (req, res) => {
  const teacher = req.body;
  const stmt = db.prepare(
    "INSERT INTO teachers (teacher_id, name, home_department) VALUES (?, ?, ?)"
  );
  stmt.run(teacher.teacher_id, teacher.name, teacher.home_department);
  res.json(teacher);
});

router.put("/:id", (req, res) => {
  const teacher = req.body;
  const stmt = db.prepare(
    "UPDATE teachers SET name = ?, home_department = ? WHERE teacher_id = ?"
  );
  stmt.run(teacher.name, teacher.home_department, req.params.id);
  res.json(teacher);
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM teachers WHERE teacher_id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
