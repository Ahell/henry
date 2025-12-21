import { db } from "../../../../db/index.js";

export function insertCourseKursansvarig(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return;

  const stmt = db.prepare(
    "INSERT OR REPLACE INTO course_kursansvarig (course_id, teacher_id, created_at) VALUES (?, ?, ?)"
  );

  list.forEach((row) => {
    if (row?.course_id == null || row?.teacher_id == null) return;
    stmt.run(
      row.course_id,
      row.teacher_id,
      row.created_at || new Date().toISOString()
    );
  });
}
