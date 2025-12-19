import { db } from "../../../../db/index.js";

export function clearBulkTables() {
  [
    "courses",
    "cohorts",
    "teachers",
    "teacher_course_competency",
    "teacher_courses_staff",
    "slots",
    "teacher_slot_unavailability",
    "teacher_day_unavailability",
    "cohort_slot_courses",
    "course_run_slots",
    "slot_days",
    "course_slot_days",
    "course_prerequisites",
  ].forEach((table) => db.prepare(`DELETE FROM ${table}`).run());
}

