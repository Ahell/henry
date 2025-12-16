// Data migrations
export function migrateBackfillSlotSpan(db, helpers) {
  const { getSortedSlots, computeCourseSlotSpan, getConsecutiveSlotIds } =
    helpers;
  const runs = db
    .prepare(
      "SELECT cohort_slot_course_id, course_id, slot_id, slot_span FROM cohort_slot_courses"
    )
    .all();
  if (runs.length === 0) return;

  const sortedSlots = getSortedSlots();
  const updateSpan = db.prepare(
    "UPDATE cohort_slot_courses SET slot_span = ? WHERE cohort_slot_course_id = ?"
  );
  const insertRunSlot = db.prepare(
    "INSERT OR IGNORE INTO course_run_slots (run_id, slot_id, sequence) VALUES (?, ?, ?)"
  );

  try {
    db.transaction(() => {
      runs.forEach((run) => {
        const spanFromCourse = computeCourseSlotSpan(run.course_id);
        const span =
          Number(run.slot_span) >= 2 ? Number(run.slot_span) : spanFromCourse;
        updateSpan.run(span, run.cohort_slot_course_id);

        const slotIds = getConsecutiveSlotIds(run.slot_id, span, sortedSlots);
        slotIds.forEach((slotId, idx) =>
          insertRunSlot.run(run.cohort_slot_course_id, slotId, idx + 1)
        );
      });
    })();
  } catch (err) {
    if (err && err.code === "SQLITE_BUSY") {
      console.warn(
        "Skipping slot_span backfill due to locked database; will retry on next start"
      );
    } else {
      throw err;
    }
  }
}
