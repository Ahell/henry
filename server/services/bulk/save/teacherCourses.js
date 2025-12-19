export function buildTeacherCoursesToInsert({
  teacherCoursesPayload,
  dedupedTeachers,
  remapTeacherId,
  remapCourseId,
} = {}) {
  if (Array.isArray(teacherCoursesPayload)) {
    return teacherCoursesPayload.map((tc) => ({
      teacher_id: remapTeacherId(tc.teacher_id),
      course_id: remapCourseId(tc.course_id),
    }));
  }

  const rows = [];
  (dedupedTeachers || []).forEach((t) => {
    (t.compatible_courses || []).forEach((cid) => {
      rows.push({
        teacher_id: remapTeacherId(t.teacher_id),
        course_id: remapCourseId(cid),
      });
    });
  });
  return rows;
}

