import { db } from "../../../db/index.js";
import { normalizeBulkPayload } from "./normalizePayload.js";
import { clearBulkTables } from "./db/clearTables.js";
import { insertCourses } from "./db/insertCourses.js";
import { insertCoursePrerequisites } from "./db/insertCoursePrerequisites.js";
import { insertCohorts } from "./db/insertCohorts.js";
import { insertTeachers } from "./db/insertTeachers.js";
import { insertTeacherCourses } from "./db/insertTeacherCourses.js";
import { insertSlots } from "./db/insertSlots.js";
import { insertSlotDays } from "./db/insertSlotDays.js";
import { insertTeacherAvailability } from "./db/insertTeacherAvailability.js";
import { insertCourseSlots } from "./db/insertCourseSlots.js";
import { insertCourseSlotDays } from "./db/insertCourseSlotDays.js";
import { insertCourseRunSlots } from "./db/insertCourseRunSlots.js";

export async function persistBulkData(payload = {}) {
  const normalized = normalizeBulkPayload(payload);

  console.log("Bulk save received:", {
    courses: normalized.dedupedCourses?.length,
    cohorts: normalized.dedupedCohorts?.length,
    teachers: normalized.dedupedTeachers?.length,
    slots: normalized.dedupedSlots?.length,
    courseRuns: Array.isArray(payload.courseRuns)
      ? payload.courseRuns.length
      : 0,
    teacherAvailability: Array.isArray(payload.teacherAvailability)
      ? payload.teacherAvailability.length
      : Object.keys(payload.teacherAvailability || {}).length,
  });

  const tx = db.transaction(() => {
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
    insertSlots(normalized.dedupedSlots);
    insertSlotDays(payload.slotDays || [], normalized.remappers.remapSlotId);
    insertTeacherAvailability(
      normalized.teacherAvailabilityOps,
      normalized.remappers
    );
    insertCourseSlots(normalized.dedupedCourseSlots);
    insertCourseSlotDays(
      payload.courseSlotDays || [],
      normalized.remapCourseSlotId
    );
    insertCourseRunSlots(normalized.courseRunSlotsRows);
  });

  tx();
  console.log("Bulk save completed successfully");
  return { success: true };
}
