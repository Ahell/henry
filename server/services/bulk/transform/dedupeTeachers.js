import { idForCompare, normalizeId } from "./idUtils.js";

export function dedupeTeachers(inputTeachers = []) {
  const byName = new Map();
  const idMapping = new Map();
  const normalizeName = (name) => (name ?? "").toString().trim().toLowerCase();

  (inputTeachers || []).forEach((teacher) => {
    const normalized = {
      ...teacher,
      teacher_id: normalizeId(teacher?.teacher_id),
      name: teacher?.name ?? "",
    };
    const key = normalizeName(normalized.name);
    const existing = byName.get(key);

    if (!existing) {
      byName.set(key, normalized);
      ensureSelfMapping(idMapping, normalized.teacher_id);
      return;
    }

    const keep =
      idForCompare(existing.teacher_id) <= idForCompare(normalized.teacher_id)
        ? existing
        : normalized;
    const drop = keep === existing ? normalized : existing;
    byName.set(key, keep);

    if (drop.teacher_id != null && keep.teacher_id != null) {
      idMapping.set(drop.teacher_id, keep.teacher_id);
    }
    ensureSelfMapping(idMapping, keep.teacher_id);

    keep.compatible_courses = mergeCourses(
      keep.compatible_courses,
      drop.compatible_courses
    );
  });

  const dedupedTeachers = Array.from(byName.values()).sort((a, b) => {
    const nameDiff = normalizeName(a.name).localeCompare(normalizeName(b.name));
    if (nameDiff !== 0) return nameDiff;
    return idForCompare(a.teacher_id) - idForCompare(b.teacher_id);
  });

  return { dedupedTeachers, teacherIdMapping: idMapping };
}

function mergeCourses(keepCourses, dropCourses) {
  const keep = Array.isArray(keepCourses) ? keepCourses : [];
  const drop = Array.isArray(dropCourses) ? dropCourses : [];
  const merged = Array.from(new Set([...keep, ...drop]));
  return merged.length ? merged : keep;
}

function ensureSelfMapping(idMapping, id) {
  if (id != null && !idMapping.has(id)) idMapping.set(id, id);
}

