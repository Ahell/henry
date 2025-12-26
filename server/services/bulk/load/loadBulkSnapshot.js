import {
  getCohorts,
  getCoursePrerequisites,
  getCourseRunSlots,
  getCourseSlotDays,
  getCourses,
  getAppSetting,
  getSlotDays,
  getSlots,
  getCourseExaminators,
  getCourseKursansvarig,
  getTeacherCourses,
  getTeacherDayUnavailability,
  getTeachers,
  getTeacherSlotUnavailability,
  getJointCourseRuns,
  getJointCourseRunTeachers,
  getCohortSlotLinks,
  getCohortSlotCourses
} from "./dbQueries.js";
import { buildCourseRuns, buildCourseSlots, buildSlotsByRun } from "./courseRuns.js";
import { mapTeacherAvailability } from "./teacherAvailability.js";
import { normalizeCoursePrerequisites } from "./coursePrerequisites.js";

export function loadBulkSnapshot() {
  const base = loadBaseEntities();
  const scheduling = loadCourseRunsData();
  const aux = loadAuxTables(base.courses);
  const availability = loadAvailabilityData({
    slots: base.slots,
    slotDays: aux.slotDays,
    teacherDayUnavailability: aux.teacherDayUnavailability,
  });
  const businessLogic = loadBusinessLogic();

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
    ...businessLogic,
  });
}

function loadBaseEntities() {
  return {
    courses: getCourses(),
    cohorts: getCohorts(),
    teachers: getTeachers(),
    teacherCourses: getTeacherCourses(),
    courseExaminators: getCourseExaminators(),
    courseKursansvarig: getCourseKursansvarig(),
    slots: getSlots(),
  };
}

function loadCourseRunsData() {
  const jointRuns = getJointCourseRuns();
  const jointTeachers = getJointCourseRunTeachers();
  const cohortLinks = getCohortSlotLinks();
  const courseRunSlots = getCourseRunSlots();
  const cohortSlotCourses = getCohortSlotCourses();
  
  const slotsByRun = buildSlotsByRun(courseRunSlots);
  const courseSlots = buildCourseSlots(jointRuns, jointTeachers);
  const courseRuns = buildCourseRuns(jointRuns, jointTeachers, cohortLinks, slotsByRun);
  
  return { courseSlots, courseRuns, courseRunSlots, cohortSlotCourses };
}

function loadAvailabilityData({ slots = [], slotDays = [], teacherDayUnavailability = [] } = {}) {
  return {
    teacherAvailability: mapTeacherAvailability({
      slotUnavailability: getTeacherSlotUnavailability(),
      dayUnavailability: teacherDayUnavailability,
      slots,
      slotDays,
    }),
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

function loadBusinessLogic() {
  const raw = getAppSetting("business_logic");
  if (!raw) return { businessLogic: null };
  try {
    return { businessLogic: JSON.parse(raw) };
  } catch (error) {
    console.warn("Failed to parse business_logic setting:", error);
    return { businessLogic: null };
  }
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
    courseExaminators: data.courseExaminators,
    courseKursansvarig: data.courseKursansvarig,
    slots: data.slots,
    courseRuns: data.courseRuns,
    teacherAvailability: data.teacherAvailability,
    courseSlots: data.courseSlots,
    cohortSlotCourses: data.cohortSlotCourses,
    courseRunSlots: data.courseRunSlots,
    slotDays: data.slotDays,
    teacherDayUnavailability: data.teacherDayUnavailability,
    courseSlotDays: data.courseSlotDays,
    coursePrerequisites: data.coursePrerequisites,
    businessLogic: data.businessLogic,
  };
}
