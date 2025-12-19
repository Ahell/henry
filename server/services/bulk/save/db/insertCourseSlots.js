import { db } from "../../../../db/index.js";

export function insertCourseSlots(courseSlots = []) {
  if (!courseSlots.length) return;
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO cohort_slot_courses (cohort_slot_course_id, course_id, slot_id, cohort_id, teachers, slot_span, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  courseSlots.forEach((cs) => {
    stmt.run(
      cs.cohort_slot_course_id || null,
      cs.course_id,
      cs.slot_id,
      cs.cohort_id ?? null,
      JSON.stringify(cs.teachers || []),
      Number(cs.slot_span) >= 2 ? Number(cs.slot_span) : 1,
      cs.created_at || new Date().toISOString()
    );
  });
}

