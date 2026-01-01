import { db } from "../../../db/index.js";
import { normalizeBulkPayload } from "./normalizePayload.js";
import { clearBulkTables, clearTables } from "./db/clearTables.js";
import { insertCourses } from "./db/insertCourses.js";
import { insertCoursePrerequisites } from "./db/insertCoursePrerequisites.js";
import { insertCohorts } from "./db/insertCohorts.js";
import { insertTeachers } from "./db/insertTeachers.js";
import { insertTeacherCourses } from "./db/insertTeacherCourses.js";
import { insertCourseExaminators } from "./db/insertCourseExaminators.js";
import { insertCourseKursansvarig } from "./db/insertCourseKursansvarig.js";
import { insertSlots } from "./db/insertSlots.js";
import { insertSlotDays } from "./db/insertSlotDays.js";
import { insertTeacherAvailability } from "./db/insertTeacherAvailability.js";
import { insertJointCourseRuns } from "./db/insertJointCourseRuns.js";
import { insertCourseSlotDays } from "./db/insertCourseSlotDays.js";
import { insertCourseRunSlots } from "./db/insertCourseRunSlots.js";
import { upsertAppSetting } from "./db/upsertAppSetting.js";

export async function persistBulkData(payload = {}) {
  const isDelta =
    payload && payload._delta === true && Array.isArray(payload.changed);
  const normalized = normalizeBulkPayload(payload);

  const tx = db.transaction(() => {
    if (!isDelta) {
      clearBulkTables();
      insertCourses(normalized.dedupedCourses);
      insertCoursePrerequisites({
        courses: normalized.dedupedCourses,
        coursePrerequisites: payload.coursePrerequisites,
        remapCourseId: normalized.remappers.remapCourseId,
      });
      insertCohorts(normalized.dedupedCohorts);
      insertTeachers(normalized.dedupedTeachers);
      insertTeacherCourses(normalized.teacherCoursesToInsert);
      insertCourseExaminators(normalized.courseExaminatorsToInsert);
      insertCourseKursansvarig(normalized.courseKursansvarigToInsert);
      insertSlots(normalized.dedupedSlots);
      insertSlotDays(payload.slotDays || [], normalized.remappers.remapSlotId);
      insertTeacherAvailability(
        normalized.teacherAvailabilityOps,
        normalized.remappers
      );
      insertJointCourseRuns(normalized.dedupedCourseSlots);
      insertCourseSlotDays(
        payload.courseSlotDays || [],
        normalized.remapCourseSlotId
      );
      insertCourseRunSlots(normalized.courseRunSlotsRows);

      if (payload.businessLogic != null) {
        upsertAppSetting(
          "business_logic",
          JSON.stringify(payload.businessLogic)
        );
      }
      return;
    }

    persistDeltaPayload(payload, normalized);
  });

  tx();
  return { success: true };
}

function persistDeltaPayload(payload, normalized) {
  const changed = new Set(payload.changed || []);
  const hasScheduleChange = hasAny(changed, [
    "courseRuns",
    "courseSlots",
    "cohortSlotCourses",
  ]);
  const hasCourseSlotDays = changed.has("courseSlotDays");
  const hasSlotDays = changed.has("slotDays");
  const hasSlots = changed.has("slots");
  const hasTeacherAvailability = changed.has("teacherAvailability");

  if (hasScheduleChange) {
    clearTables([
      "course_run_slots",
      "joint_course_run_teachers",
      "cohort_slot_courses",
      "joint_course_runs",
    ]);
    insertJointCourseRuns(normalized.dedupedCourseSlots);
    insertCourseRunSlots(normalized.courseRunSlotsRows);
  }

  if (hasCourseSlotDays) {
    clearTables(["course_slot_days"]);
    insertCourseSlotDays(
      payload.courseSlotDays || [],
      normalized.remapCourseSlotId
    );
  }

  if (changed.has("coursePrerequisites")) {
    clearTables(["course_prerequisites"]);
    insertCoursePrerequisites({
      courses: normalized.dedupedCourses,
      coursePrerequisites: payload.coursePrerequisites,
      remapCourseId: normalized.remappers.remapCourseId,
    });
  }

  if (changed.has("courses")) {
    clearTables(["courses"]);
    insertCourses(normalized.dedupedCourses);
  }

  if (changed.has("cohorts")) {
    clearTables(["cohorts"]);
    insertCohorts(normalized.dedupedCohorts);
  }

  if (changed.has("teachers")) {
    clearTables(["teachers"]);
    insertTeachers(normalized.dedupedTeachers);
  }

  if (changed.has("teacherCourses")) {
    clearTables(["teacher_course_competency"]);
    insertTeacherCourses(normalized.teacherCoursesToInsert);
  }

  if (changed.has("courseExaminators")) {
    clearTables(["course_examinators"]);
    insertCourseExaminators(normalized.courseExaminatorsToInsert);
  }

  if (changed.has("courseKursansvarig")) {
    clearTables(["course_kursansvarig"]);
    insertCourseKursansvarig(normalized.courseKursansvarigToInsert);
  }

  if (hasTeacherAvailability) {
    clearTables(["teacher_slot_unavailability", "teacher_day_unavailability"]);
  }

  if (hasSlotDays || hasSlots) {
    clearTables(["slot_days"]);
  }

  if (hasSlots) {
    clearTables(["slots"]);
    insertSlots(normalized.dedupedSlots);
  }

  if (hasSlotDays || hasSlots) {
    insertSlotDays(payload.slotDays || [], normalized.remappers.remapSlotId);
  }

  if (hasTeacherAvailability) {
    insertTeacherAvailability(
      normalized.teacherAvailabilityOps,
      normalized.remappers
    );
  }

  if (changed.has("businessLogic") && payload.businessLogic != null) {
    upsertAppSetting("business_logic", JSON.stringify(payload.businessLogic));
  }
}

function hasAny(set, keys = []) {
  return keys.some((key) => set.has(key));
}
