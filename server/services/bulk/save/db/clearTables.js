import { db } from "../../../../db/index.js";

export function clearBulkTables() {
  const tables = [
    "courses",
    "cohorts",
    "teachers",
    "teacher_course_competency",
    "course_examinators",
    "course_kursansvarig",
    "slots",
    "teacher_slot_unavailability",
    "teacher_day_unavailability",
    "cohort_slot_courses",
    "joint_course_run_teachers",
    "joint_course_runs",
    "course_run_slots",
    "slot_days",
    "course_slot_days",
    "course_prerequisites",
    "app_settings",
  ];

  const checkStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");

  tables.forEach((table) => {
    const exists = checkStmt.get(table);
    if (exists) {
      try {
        db.prepare(`DELETE FROM ${table}`).run();
      } catch (err) {
        console.error(`Failed to clear table ${table}:`, err);
        throw err;
      }
    }
  });
}
