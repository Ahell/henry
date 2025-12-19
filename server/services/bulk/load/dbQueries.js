import { db } from "../../../db/index.js";

const all = (sql) => db.prepare(sql).all();

export const getCourses = () => all("SELECT * FROM courses");
export const getCohorts = () => all("SELECT * FROM cohorts");
export const getTeachers = () => all("SELECT * FROM teachers");
export const getTeacherCourses = () =>
  all("SELECT teacher_id, course_id FROM teacher_course_competency");
export const getSlots = () => all("SELECT * FROM slots");
export const getCohortSlotCourses = () => all("SELECT * FROM cohort_slot_courses");
export const getCourseRunSlots = () => all("SELECT * FROM course_run_slots");
export const getTeacherSlotUnavailability = () =>
  all("SELECT * FROM teacher_slot_unavailability");
export const getSlotDays = () => all("SELECT * FROM slot_days");
export const getCourseSlotDays = () => all("SELECT * FROM course_slot_days");
export const getTeacherDayUnavailability = () =>
  all("SELECT * FROM teacher_day_unavailability");
export const getCoursePrerequisites = () =>
  all("SELECT * FROM course_prerequisites");
