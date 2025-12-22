import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

// Validation function
const validateCourse = (course) => {
  if (course.credits !== 7.5 && course.credits !== 15) {
    throw new Error("Credits must be 7.5 or 15");
  }
};

router.get("/", (req, res) => {
  try {
    const courses = db.prepare("SELECT * FROM courses").all();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const course = db
      .prepare("SELECT * FROM courses WHERE course_id = ?")
      .get(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", (req, res) => {
  try {
    const course = req.body;
    validateCourse(course);
    const stmt = db.prepare(
      "INSERT INTO courses (course_id, name, code, credits) VALUES (?, ?, ?, ?)"
    );
    stmt.run(course.course_id, course.name, course.code, course.credits);
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", (req, res) => {
  try {
    const course = req.body;
    validateCourse(course);
    const stmt = db.prepare(
      "UPDATE courses SET name = ?, code = ?, credits = ? WHERE course_id = ?"
    );
    stmt.run(course.name, course.code, course.credits, req.params.id);
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM courses WHERE course_id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
