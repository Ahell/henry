import { normalizeCourseCode } from "../../../utils/index.js";
import { idForCompare } from "./idUtils.js";

export function dedupeCourses(inputCourses = []) {
  const codeMap = new Map();
  const idMapping = new Map();
  const deduped = [];

  (inputCourses || []).forEach((course) => {
    const normalizedCode = normalizeCourseCode(course?.code);
    const courseWithNormalized = { ...course, code: normalizedCode };

    if (!normalizedCode) {
      deduped.push(courseWithNormalized);
      ensureSelfMapping(idMapping, courseWithNormalized?.course_id);
      return;
    }

    const existing = codeMap.get(normalizedCode);
    if (!existing) {
      codeMap.set(normalizedCode, courseWithNormalized);
      deduped.push(courseWithNormalized);
      ensureSelfMapping(idMapping, courseWithNormalized?.course_id);
      return;
    }

    const keep =
      idForCompare(existing.course_id) <=
      idForCompare(courseWithNormalized.course_id)
        ? existing
        : courseWithNormalized;
    const drop = keep === existing ? courseWithNormalized : existing;

    if (keep !== existing) {
      codeMap.set(normalizedCode, keep);
      const idx = deduped.indexOf(existing);
      if (idx !== -1) deduped[idx] = keep;
    }

    if (drop.course_id != null && keep.course_id != null) {
      idMapping.set(drop.course_id, keep.course_id);
    }
    ensureSelfMapping(idMapping, keep?.course_id);
  });

  return { dedupedCourses: deduped, courseIdMapping: idMapping };
}

function ensureSelfMapping(idMapping, id) {
  if (id != null && !idMapping.has(id)) idMapping.set(id, id);
}

