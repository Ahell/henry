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
  const base = loadBaseEntities();
  const scheduling = loadCourseRunsData();
  const availability = loadAvailabilityData(base.slots);
  const aux = loadAuxTables(base.courses);

  logBulkLoadStats({
    ...base,
    ...scheduling,
    ...availability,
  });

  return buildSnapshot({
    ...base,
    ...scheduling,
    ...availability,
    ...aux,
  });
}

function loadBaseEntities() {
  return {
    courses: getCourses(),
    cohorts: getCohorts(),
    teachers: getTeachers(),
    teacherCourses: getTeacherCourses(),
    slots: getSlots(),
  };
}

function loadCourseRunsData() {
  const cohortSlotCoursesRaw = getCohortSlotCourses();
  const courseRunSlots = getCourseRunSlots();
  const slotsByRun = buildSlotsByRun(courseRunSlots);
  const courseSlots = buildCourseSlots(cohortSlotCoursesRaw);
  const courseRuns = buildCourseRuns(courseSlots, slotsByRun);
  return { courseSlots, courseRuns, courseRunSlots };
}

function loadAvailabilityData(slots) {
  return {
    teacherAvailability: mapTeacherAvailability(getTeacherSlotUnavailability(), slots),
  };
}

function loadAuxTables(courses) {
  return {
    slotDays: getSlotDays(),
    courseSlotDays: getCourseSlotDays(),
    teacherDayUnavailability: getTeacherDayUnavailability(),
    coursePrerequisites: normalizeCoursePrerequisites(
      courses,
      getCoursePrerequisites()
    ),
  };
}

function logBulkLoadStats({ courses, cohorts, teachers, slots, courseRuns, courseRunSlots, teacherAvailability }) {
  console.log("Bulk load successful:", {
    courses: courses.length,
    cohorts: cohorts.length,
    teachers: teachers.length,
    slots: slots.length,
    courseRuns: courseRuns.length,
    courseRunSlots: courseRunSlots.length,
    teacherAvailability: teacherAvailability.length,
  });
}

function buildSnapshot(data) {
  return {
    courses: data.courses,
    cohorts: data.cohorts,
    teachers: data.teachers,
    teacherCourses: data.teacherCourses,
    slots: data.slots,
    courseRuns: data.courseRuns,
    teacherAvailability: data.teacherAvailability,
    courseSlots: data.courseSlots,
    cohortSlotCourses: data.courseSlots,
    courseRunSlots: data.courseRunSlots,
    slotDays: data.slotDays,
    teacherDayUnavailability: data.teacherDayUnavailability,
    courseSlotDays: data.courseSlotDays,
    coursePrerequisites: data.coursePrerequisites,
  };
}
