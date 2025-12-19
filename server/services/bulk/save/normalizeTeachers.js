import { dedupeTeachers } from "../transform/dedupeTeachers.js";

export function normalizeTeachers(teachers = []) {
  const { dedupedTeachers, teacherIdMapping } = dedupeTeachers(teachers);
  const remapTeacherId = (id) =>
    id == null ? id : teacherIdMapping.get(id) ?? id;
  return { dedupedTeachers, remapTeacherId };
}

