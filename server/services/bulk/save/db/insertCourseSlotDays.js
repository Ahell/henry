import { db } from "../../../../db/index.js";

export function insertCourseSlotDays(courseSlotDays = [], remapCourseSlotId) {
  if (!courseSlotDays || !courseSlotDays.length) return;
  const stmt = db.prepare(
    "INSERT INTO course_slot_days (course_slot_day_id, course_slot_id, date, is_default, active) VALUES (?, ?, ?, ?, ?)"
  );
  courseSlotDays.forEach((csd) => {
    const courseSlotId = csd.cohort_slot_course_id ?? csd.course_slot_id ?? null;
    const activeValue =
      csd.active === 0 ||
      csd.active === false ||
      csd.active === "0" ||
      csd.active === "false"
        ? 0
        : 1;
    stmt.run(
      csd.course_slot_day_id || null,
      remapCourseSlotId(courseSlotId),
      csd.date,
      csd.is_default ? 1 : 0,
      activeValue
    );
  });
}
