import { db } from "../../../../db/index.js";

export function insertCoursePrerequisites({
  courses = [],
  coursePrerequisites,
  remapCourseId,
}) {
  const prereqRows = Array.isArray(coursePrerequisites)
    ? coursePrerequisites
    : [];

  if (!coursePrerequisites) {
    courses.forEach((c) => {
      (c.prerequisites || []).forEach((pid) => {
        prereqRows.push({
          course_id: remapCourseId(c.course_id),
          prerequisite_course_id: remapCourseId(pid),
        });
      });
    });
  }

  if (!prereqRows.length) return;

  const stmt = db.prepare(
    "INSERT OR IGNORE INTO course_prerequisites (course_id, prerequisite_course_id) VALUES (?, ?)"
  );
  prereqRows.forEach((cp) => {
    stmt.run(remapCourseId(cp.course_id), remapCourseId(cp.prerequisite_course_id));
  });
}

