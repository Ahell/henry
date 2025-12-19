import { db } from "../../../../db/index.js";

export function insertTeacherCourses(entries = []) {
  if (!entries.length) return;
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO teacher_course_competency (teacher_id, course_id) VALUES (?, ?)"
  );
  entries.forEach((tc) => {
    stmt.run(tc.teacher_id, tc.course_id);
  });
}

