import {
  getCohortSlotCourses,
  getCohorts,
  getCoursePrerequisites,
  getCourseRunSlots,
  getCourseSlotDays,
  getCourses,
  getSlotDays,
  getSlots,
  getTeacherCourses,
  getTeacherDayUnavailability,
  getTeachers,
  getTeacherSlotUnavailability,
} from "./dbQueries.js";
import { buildCourseRuns, buildCourseSlots, buildSlotsByRun } from "./courseRuns.js";
import { mapTeacherAvailability } from "./teacherAvailability.js";
import { normalizeCoursePrerequisites } from "./coursePrerequisites.js";

export function loadBulkSnapshot() {
  const courses = getCourses();
  const cohorts = getCohorts();
  const teachers = getTeachers();
  const teacherCourses = getTeacherCourses();
  const slots = getSlots();

  const cohortSlotCoursesRaw = getCohortSlotCourses();
  const courseRunSlots = getCourseRunSlots();
  const slotsByRun = buildSlotsByRun(courseRunSlots);

  const courseSlots = buildCourseSlots(cohortSlotCoursesRaw);
  const courseRuns = buildCourseRuns(courseSlots, slotsByRun);

  const teacherAvailability = mapTeacherAvailability(
    getTeacherSlotUnavailability(),
    slots
  );

  const slotDays = getSlotDays();
  const courseSlotDays = getCourseSlotDays();
  const teacherDayUnavailability = getTeacherDayUnavailability();
  const coursePrerequisites = normalizeCoursePrerequisites(
    courses,
    getCoursePrerequisites()
  );

  console.log("Bulk load successful:", {
    courses: courses.length,
    cohorts: cohorts.length,
    teachers: teachers.length,
    slots: slots.length,
    courseRuns: courseRuns.length,
    courseRunSlots: courseRunSlots.length,
    teacherAvailability: teacherAvailability.length,
  });

  return {
    courses,
    cohorts,
    teachers,
    teacherCourses,
    slots,
    courseRuns,
    teacherAvailability,
    courseSlots,
    cohortSlotCourses: courseSlots,
    courseRunSlots,
    slotDays,
    teacherDayUnavailability,
    courseSlotDays,
    coursePrerequisites,
  };
}

