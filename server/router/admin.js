import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

router.post("/reset-teachers", (req, res) => {
  try {
    db.transaction(() => {
      const toRemove = db
        .prepare("SELECT teacher_id FROM teachers")
        .all()
        .map((t) => Number(t.teacher_id));

      db.prepare("DELETE FROM teacher_day_unavailability").run();
      db.prepare("DELETE FROM teacher_slot_unavailability").run();
      db.prepare("DELETE FROM teacher_courses_staff").run();
      db.prepare("DELETE FROM teacher_course_competency").run();
      db.prepare("DELETE FROM teachers").run();

      const rows = db
        .prepare("SELECT cohort_slot_course_id, teachers FROM cohort_slot_courses")
        .all();
      const update = db.prepare(
        "UPDATE cohort_slot_courses SET teachers = ? WHERE cohort_slot_course_id = ?"
      );
      rows.forEach((r) => {
        try {
          const arr = JSON.parse(r.teachers || "[]");
          if (Array.isArray(arr) && arr.length > 0) {
            const filtered = arr
              .map((x) => (typeof x === "string" ? Number(x) : x))
              .filter((id) => !toRemove.includes(Number(id)));
            if (filtered.length !== arr.length) {
              update.run(JSON.stringify(filtered), r.cohort_slot_course_id);
            }
          }
        } catch (e) {
          update.run(JSON.stringify([]), r.cohort_slot_course_id);
        }
      });
    })();

    console.log("Admin: reset teachers and cleared references");
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to reset teachers:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-courses", (req, res) => {
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM course_prerequisites").run();
      db.prepare("DELETE FROM course_slot_days").run();
      db.prepare("DELETE FROM cohort_slot_courses").run();
      db.prepare("DELETE FROM course_run_slots").run();
      db.prepare("DELETE FROM course_run_days").run();
      db.prepare("DELETE FROM course_run_cohorts").run();
      db.prepare("DELETE FROM course_run_teachers").run();
      db.prepare("DELETE FROM teacher_courses_staff").run();
      db.prepare("DELETE FROM teacher_course_competency").run();
      db.prepare("DELETE FROM courses").run();
    })();

    console.log("Admin: reset courses and cleared references");
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to reset courses:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-all", (req, res) => {
  try {
    db.transaction(() => {
      // Delete all data in correct order to handle foreign key constraints
      db.prepare("DELETE FROM course_run_days").run();
      db.prepare("DELETE FROM course_run_teachers").run();
      db.prepare("DELETE FROM course_run_cohorts").run();
      db.prepare("DELETE FROM course_run_slots").run();
      db.prepare("DELETE FROM teacher_day_unavailability").run();
      db.prepare("DELETE FROM teacher_slot_unavailability").run();
      db.prepare("DELETE FROM course_slot_days").run();
      db.prepare("DELETE FROM slot_days").run();
      db.prepare("DELETE FROM cohort_slot_courses").run();
      db.prepare("DELETE FROM teacher_course_competency").run();
      db.prepare("DELETE FROM teacher_courses_staff").run();
      db.prepare("DELETE FROM course_prerequisites").run();
      db.prepare("DELETE FROM slots").run();
      db.prepare("DELETE FROM cohorts").run();
      db.prepare("DELETE FROM teachers").run();
      db.prepare("DELETE FROM courses").run();
    })();

    console.log("Admin: reset all database tables");
    res.json({ success: true, message: "All database tables cleared" });
  } catch (error) {
    console.error("Failed to reset database:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
