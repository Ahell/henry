import { normalizeCredits } from "../../../utils/index.js";
import { dedupeCourses } from "../transform/dedupeCourses.js";

export function normalizeCourses(courses = []) {
  const { dedupedCourses, courseIdMapping } = dedupeCourses(courses);
  const remapCourseId = (id) => (id == null ? id : courseIdMapping.get(id) ?? id);

  const creditsByCourseId = new Map(
    dedupedCourses.map((c) => [remapCourseId(c.course_id), normalizeCredits(c.credits)])
  );
  const spanForCourse = (courseId) =>
    creditsByCourseId.get(courseId) === 15 ? 2 : 1;

  return { dedupedCourses, remapCourseId, spanForCourse };
}

