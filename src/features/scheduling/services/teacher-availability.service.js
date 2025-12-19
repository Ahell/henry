import { store } from "../../../platform/store/DataStore.js";

export const TEACHER_SHORTAGE_STATUS = Object.freeze({
  OK: "ok",
  NO_COMPATIBLE_TEACHERS: "no-compatible-teachers",
  NO_AVAILABLE_COMPATIBLE_TEACHERS: "no-available-compatible-teachers",
});

export function getCompatibleTeachersForCourse(courseId) {
  const teachers = store.getTeachers();
  return teachers.filter((t) => t.compatible_courses?.includes(courseId));
}

export function getAvailableCompatibleTeachersForCourseInSlot(
  courseId,
  slotDate,
  { includeTeacherIds = [] } = {}
) {
  const include = new Set(includeTeacherIds);
  return getCompatibleTeachersForCourse(courseId).filter((teacher) => {
    if (include.has(teacher.teacher_id)) return true;
    return !store.isTeacherUnavailable(teacher.teacher_id, slotDate);
  });
}

export function getTeacherShortageStatusForCourseInSlot(courseId, slotDate) {
  const compatibleTeachers = getCompatibleTeachersForCourse(courseId);
  if (compatibleTeachers.length === 0) {
    return TEACHER_SHORTAGE_STATUS.NO_COMPATIBLE_TEACHERS;
  }

  const slot = store.getSlots().find((s) => s.start_date === slotDate);
  if (!slot) return TEACHER_SHORTAGE_STATUS.OK;

  const runsForCourseInSlot = store
    .getCourseRuns()
    .filter((r) => r.slot_id === slot.slot_id && r.course_id === courseId);

  const hasAssignedTeacher = runsForCourseInSlot.some(
    (r) => Array.isArray(r.teachers) && r.teachers.length > 0
  );
  if (hasAssignedTeacher) return TEACHER_SHORTAGE_STATUS.OK;

  const availableTeachers = compatibleTeachers.filter(
    (t) => !store.isTeacherUnavailable(t.teacher_id, slotDate)
  );

  if (availableTeachers.length === 0) {
    return TEACHER_SHORTAGE_STATUS.NO_AVAILABLE_COMPATIBLE_TEACHERS;
  }

  return TEACHER_SHORTAGE_STATUS.OK;
}

