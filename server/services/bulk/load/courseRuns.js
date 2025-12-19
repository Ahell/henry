import {
  computeCourseSlotSpan,
  getConsecutiveSlotIds,
  getSortedSlots,
} from "../../../db/index.js";
import { deserializeArrayFields } from "../../../utils/index.js";

export function buildSlotsByRun(courseRunSlots = []) {
  const slotsByRun = new Map();
  courseRunSlots.forEach((row) => {
    const list = slotsByRun.get(row.run_id) || [];
    list.push(row);
    slotsByRun.set(row.run_id, list);
  });
  return slotsByRun;
}

export function buildCourseSlots(cohortSlotCoursesRaw = []) {
  return cohortSlotCoursesRaw.map((cs) => {
    const parsed = deserializeArrayFields(cs, ["teachers"]);
    return {
      ...cs,
      teachers: parsed.teachers || [],
      course_slot_id: cs.cohort_slot_course_id,
    };
  });
}

export function buildCourseRuns(courseSlots = [], slotsByRun) {
  const sortedSlots = getSortedSlots();

  return courseSlots.map((cs) => {
    const rawSlots = slotsByRun.get(cs.cohort_slot_course_id) || [];
    const span = Number(cs.slot_span);
    const slotIds =
      rawSlots.length > 0
        ? rawSlots
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((r) => r.slot_id)
        : getConsecutiveSlotIds(
            cs.slot_id,
            span >= 2 ? span : computeCourseSlotSpan(cs.course_id),
            sortedSlots
          );

    return {
      run_id: cs.cohort_slot_course_id,
      course_id: cs.course_id,
      slot_id: slotIds[0] ?? cs.slot_id,
      slot_ids: slotIds,
      slot_span: slotIds.length || Number(cs.slot_span) || 1,
      cohorts: cs.cohort_id != null ? [cs.cohort_id] : [],
      teachers: cs.teachers || [],
    };
  });
}
