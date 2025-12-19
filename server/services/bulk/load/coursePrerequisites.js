export function normalizeCoursePrerequisites(courses, coursePrerequisitesRaw) {
  const prerequisites = Array.isArray(coursePrerequisitesRaw)
    ? coursePrerequisitesRaw
    : [];

  // Om det inte finns några prerequisites i databasen, returnera tom array
  // Kurser från databasen har inte prerequisites embedded
  if (prerequisites.length === 0) {
    return [];
  }

  const byCourse = new Map();
  prerequisites.forEach((cp) => {
    const list = byCourse.get(cp.course_id) || [];
    list.push(cp.prerequisite_course_id);
    byCourse.set(cp.course_id, list);
  });

  (courses || []).forEach((c) => {
    c.prerequisites = byCourse.get(c.course_id) || [];
  });

  return prerequisites;
}
