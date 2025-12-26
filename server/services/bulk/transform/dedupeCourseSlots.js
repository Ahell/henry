import { idForCompare, normalizeId } from "./idUtils.js";

export function dedupeCourseSlots(
  inputCourseSlots = [],
  {
    remapCourseId = (id) => id,
    remapSlotId = (id) => id,
    remapCohortId = (id) => id,
    remapTeacherId = (id) => id,
    spanForCourse = () => 1,
  } = {}
) {
  const keepByKey = new Map();
  const idMapping = new Map();

  (inputCourseSlots || []).forEach((raw) => {
    const normalized = normalizeCourseSlot(raw, {
      remapCourseId,
      remapSlotId,
      remapCohortId,
      remapTeacherId,
      spanForCourse,
    });
    upsertCourseSlot(keepByKey, idMapping, normalized);
  });

  ensureAllIdsMapped(keepByKey, idMapping);
  return buildResult(keepByKey, idMapping);
}

function upsertCourseSlot(keepByKey, idMapping, normalized) {
  const key = courseSlotKey(normalized);
  const existing = keepByKey.get(key);
  if (!existing) {
    keepByKey.set(key, normalized);
    ensureSelfMapping(idMapping, normalized.cohort_slot_course_id);
    return;
  }

  const { keep, drop } = chooseKeepDrop(existing, normalized);
  keepByKey.set(key, keep);
  mergeIdMapping(idMapping, drop?.cohort_slot_course_id, keep?.cohort_slot_course_id);
  keep.teachers = mergeUnique(keep.teachers, drop.teachers);
  // Preserve kursansvarig_id if it exists in one of the slots being merged.
  if (keep.kursansvarig_id == null && drop.kursansvarig_id != null) {
    keep.kursansvarig_id = drop.kursansvarig_id;
  }
}

function courseSlotKey(cs) {
  return `${cs.course_id}|${cs.slot_id}|${cs.cohort_id ?? ""}`;
}

function chooseKeepDrop(existing, incoming) {
  const keep =
    idForCompare(existing.cohort_slot_course_id) <=
    idForCompare(incoming.cohort_slot_course_id)
      ? existing
      : incoming;
  const drop = keep === existing ? incoming : existing;
  return { keep, drop };
}

function mergeIdMapping(idMapping, fromId, toId) {
  if (fromId != null && toId != null) {
    idMapping.set(fromId, toId);
  }
}

function ensureAllIdsMapped(keepByKey, idMapping) {
  keepByKey.forEach((cs) =>
    ensureSelfMapping(idMapping, cs.cohort_slot_course_id)
  );
}

function buildResult(keepByKey, idMapping) {
  return {
    dedupedCourseSlots: Array.from(keepByKey.values()).map((cs) => ({
      ...cs,
      course_slot_id: cs.cohort_slot_course_id,
    })),
    courseSlotIdMapping: idMapping,
  };
}

function normalizeCourseSlot(
  cs,
  { remapCourseId, remapSlotId, remapCohortId, remapTeacherId, spanForCourse }
) {
  const id = normalizeId(cs.cohort_slot_course_id ?? cs.course_slot_id ?? null);
  const courseId = normalizeId(remapCourseId(cs.course_id));
  const slotId = normalizeId(remapSlotId(cs.slot_id));
  const cohortId = normalizeId(remapCohortId(cs.cohort_id ?? null));

  const teachers = Array.isArray(cs.teachers)
    ? mergeUnique(
        [],
        cs.teachers
          .map((tid) => remapTeacherId(tid))
          .filter((tid) => tid != null)
      )
    : [];

  const span =
    Number(cs.slot_span) >= 2 ? Number(cs.slot_span) : spanForCourse(courseId);

  return {
    ...cs,
    course_id: courseId,
    slot_id: slotId,
    cohort_id: cohortId,
    slot_span: span,
    teachers,
    cohort_slot_course_id: id,
  };
}

function mergeUnique(a = [], b = []) {
  return Array.from(new Set([...(a || []), ...(b || [])]));
}

function ensureSelfMapping(idMapping, id) {
  if (id != null && !idMapping.has(id)) idMapping.set(id, id);
}
