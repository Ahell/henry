import { db } from "../../../../db/index.js";

export function clearBulkTables() {
  [
    "courses",
    "cohorts",
    "teachers",
    "teacher_course_competency",
    "teacher_courses_staff",
    "course_examinators",
    "course_kursansvarig",
    "slots",
    "teacher_slot_unavailability",
    "teacher_day_unavailability",
    "cohort_slot_courses",
    "course_run_slots",
    "slot_days",
    "course_slot_days",
    "course_prerequisites",
    "app_settings",
  ].forEach((table) => db.prepare(`DELETE FROM ${table}`).run());
}
