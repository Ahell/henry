export function buildCourseExaminatorsToInsert({
  courseExaminatorsPayload,
  coursesPayload,
  remapCourseId,
  remapTeacherId,
} = {}) {
  const rows = [];
  const seenCourseIds = new Set();

  const pushRow = (courseId, teacherId) => {
    if (courseId == null || teacherId == null) return;
    const nextCourseId = remapCourseId ? remapCourseId(courseId) : courseId;
    const nextTeacherId = remapTeacherId ? remapTeacherId(teacherId) : teacherId;
    if (nextCourseId == null || nextTeacherId == null) return;
    const key = String(nextCourseId);
    if (seenCourseIds.has(key)) return;
    seenCourseIds.add(key);
    rows.push({ course_id: nextCourseId, teacher_id: nextTeacherId });
  };

  if (Array.isArray(courseExaminatorsPayload)) {
    courseExaminatorsPayload.forEach((row) =>
      pushRow(row?.course_id, row?.teacher_id)
    );
    return rows;
  }

  if (Array.isArray(coursesPayload)) {
    coursesPayload.forEach((c) =>
      pushRow(c?.course_id, c?.examinator_teacher_id ?? c?.examinatorTeacherId)
    );
  }

  return rows;
}

