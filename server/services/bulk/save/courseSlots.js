import { dedupeCourseSlots } from "../transform/dedupeCourseSlots.js";

export function normalizeCourseSlotsInput(payload, { spanForCourse, remappers }) {
  const courseSlotsInput = resolveCourseSlotsInput(payload, spanForCourse);
  const { dedupedCourseSlots, courseSlotIdMapping } = dedupeCourseSlots(
    courseSlotsInput,
    { ...remappers, spanForCourse }
  );
  const remapCourseSlotId = (id) =>
    id == null ? id : courseSlotIdMapping.get(id) ?? id;
  return { dedupedCourseSlots, remapCourseSlotId };
}

function resolveCourseSlotsInput(payload, spanForCourse) {
  const { cohortSlotCourses, courseSlots, courseRuns } = payload || {};
  if (cohortSlotCourses) return cohortSlotCourses;
  if (courseSlots) return courseSlots;
  if (!Array.isArray(courseRuns)) return [];

  return courseRuns.flatMap((r) => {
    const cohortsArr =
      Array.isArray(r.cohorts) && r.cohorts.length > 0 ? r.cohorts : [null];
    const runSpan =
      Number(r.slot_span) >= 2
        ? Number(r.slot_span)
        : Array.isArray(r.slot_ids) && r.slot_ids.length > 1
        ? r.slot_ids.length
        : spanForCourse(r.course_id);

    return cohortsArr.map((cohortId) => ({
      course_id: r.course_id,
      slot_id: r.slot_id,
      cohort_id: cohortId,
      teachers: Array.isArray(r.teachers) ? r.teachers : [],
      slot_span: runSpan,
    }));
  });
}

