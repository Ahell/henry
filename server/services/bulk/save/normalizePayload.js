import { normalizeCourses } from "./normalizeCourses.js";
import { normalizeSlots } from "./normalizeSlots.js";
import { normalizeTeachers } from "./normalizeTeachers.js";
import { normalizeCohorts } from "./normalizeCohorts.js";
import { buildTeacherCoursesToInsert } from "./teacherCourses.js";
import { buildCourseExaminatorsToInsert } from "./courseExaminators.js";
import { normalizeCourseSlotsInput } from "./courseSlots.js";
import { buildCourseRunSlotsRows } from "./courseRunSlots.js";
import { buildTeacherAvailabilityOps } from "./teacherAvailabilityOps.js";

export function normalizeBulkPayload(payload = {}) {
  const { dedupedCourses, remapCourseId, spanForCourse } = normalizeCourses(
    payload.courses || []
  );
  const { dedupedSlots, remapSlotId, orderedSlotsForSpan } = normalizeSlots(
    payload.slots || []
  );
  const { dedupedTeachers, remapTeacherId } = normalizeTeachers(
    payload.teachers || []
  );
  const { dedupedCohorts, remapCohortId } = normalizeCohorts(
    payload.cohorts || []
  );

  const remappers = { remapCourseId, remapSlotId, remapCohortId, remapTeacherId };

  const { dedupedCourseSlots, remapCourseSlotId } = normalizeCourseSlotsInput(
    payload,
    { spanForCourse, remappers }
  );

  const teacherCoursesToInsert = buildTeacherCoursesToInsert({
    teacherCoursesPayload: payload.teacherCourses,
    dedupedTeachers,
    remapTeacherId,
    remapCourseId,
  });

  const courseExaminatorsToInsert = buildCourseExaminatorsToInsert({
    courseExaminatorsPayload: payload.courseExaminators,
    coursesPayload: payload.courses,
    remapCourseId,
    remapTeacherId,
  });

  const courseRunSlotsRows = buildCourseRunSlotsRows({
    dedupedCourseSlots,
    orderedSlotsForSpan,
    remapSlotId,
    runSlotOverridesInput: payload.courseRunSlots,
  });

  const teacherAvailabilityOps = buildTeacherAvailabilityOps({
    teacherAvailability: payload.teacherAvailability,
    slots: dedupedSlots,
  });

  return {
    dedupedCourses,
    dedupedCohorts,
    dedupedTeachers,
    dedupedSlots,
    dedupedCourseSlots,
    teacherCoursesToInsert,
    courseExaminatorsToInsert,
    courseRunSlotsRows,
    teacherAvailabilityOps,
    remappers,
    remapCourseSlotId,
  };
}
