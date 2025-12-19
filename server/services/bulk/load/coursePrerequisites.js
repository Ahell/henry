export function normalizeCoursePrerequisites(courses, coursePrerequisitesRaw) {
  const prerequisites = Array.isArray(coursePrerequisitesRaw)
    ? coursePrerequisitesRaw
    : [];

  if (prerequisites.length === 0) {
    return buildPrerequisitesFromCourseField(courses);
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

function buildPrerequisitesFromCourseField(courses = []) {
  const prerequisites = [];
  courses.forEach((c) => {
    if (!Array.isArray(c.prerequisites)) return;
    c.prerequisites.forEach((pid) =>
      prerequisites.push({
        course_id: c.course_id,
        prerequisite_course_id: pid,
      })
    );
  });
  return prerequisites;
}

