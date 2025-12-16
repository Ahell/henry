import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  const courses = db.prepare("SELECT * FROM courses").all();
  res.json(courses);
});

router.post("/", (req, res) => {
  const course = req.body;
  if (course.credits !== 7.5 && course.credits !== 15) {
    return res.status(400).json({ error: "Credits must be 7.5 or 15" });
  }
  const stmt = db.prepare(
    "INSERT INTO courses (course_id, name, code, credits) VALUES (?, ?, ?, ?)"
  );
  stmt.run(course.course_id, course.name, course.code, course.credits);
  res.json(course);
});

router.put("/:id", (req, res) => {
  const course = req.body;
  if (course.credits !== 7.5 && course.credits !== 15) {
    return res.status(400).json({ error: "Credits must be 7.5 or 15" });
  }
  const stmt = db.prepare(
    "UPDATE courses SET name = ?, code = ?, credits = ? WHERE course_id = ?"
  );
  stmt.run(course.name, course.code, course.credits, req.params.id);
  res.json(course);
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM courses WHERE course_id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
