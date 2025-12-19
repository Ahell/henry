import { db } from "../../../../db/index.js";
import { normalizeCourseCode, normalizeCredits } from "../../../../utils/index.js";

export function insertCourses(courses = []) {
  if (!courses.length) return;
  const stmt = db.prepare(
    "INSERT INTO courses (course_id, name, code, credits, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  courses.forEach((c) => {
    stmt.run(
      c.course_id,
      c.name,
      normalizeCourseCode(c.code),
      normalizeCredits(c.credits),
      c.created_at || new Date().toISOString()
    );
  });
}

