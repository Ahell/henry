import express from "express";
import {
  computeCourseSlotSpan,
  db,
  getConsecutiveSlotIds,
  getSortedSlots,
  upsertRunSlots,
} from "../db/index.js";
import { deserializeArrayFields } from "../utils/index.js";

const router = express.Router();

router.get("/", (req, res) => {
  const courseSlots = db
    .prepare("SELECT * FROM cohort_slot_courses")
    .all()
    .map((cs) => deserializeArrayFields(cs, ["teachers"]));

  const runSlotRows = db
    .prepare("SELECT run_id, slot_id, sequence FROM course_run_slots")
    .all();
  const slotsByRun = new Map();
  runSlotRows.forEach((row) => {
    const list = slotsByRun.get(row.run_id) || [];
    list.push(row);
    slotsByRun.set(row.run_id, list);
  });
  const sortedSlots = getSortedSlots();

  const runs = courseSlots.map((cs) => {
    const rawSlots = slotsByRun.get(cs.cohort_slot_course_id) || [];
    const slotIds =
      rawSlots.length > 0
        ? rawSlots
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((r) => r.slot_id)
        : getConsecutiveSlotIds(
            cs.slot_id,
            Number(cs.slot_span) >= 2
              ? Number(cs.slot_span)
              : computeCourseSlotSpan(cs.course_id),
            sortedSlots
          );

    return {
      run_id: cs.cohort_slot_course_id,
      course_id: cs.course_id,
      slot_id: slotIds[0] ?? cs.slot_id,
      slot_ids: slotIds,
      slot_span: slotIds.length || Number(cs.slot_span) || 1,
      cohorts: cs.cohort_id != null ? [cs.cohort_id] : [],
      teachers: cs.teachers || [],
    };
  });
  res.json(runs);
});

router.post("/", (req, res) => {
  const payload = req.body;
  const cohorts =
    Array.isArray(payload.cohorts) && payload.cohorts.length > 0
      ? payload.cohorts
      : [null];
  const teachers = Array.isArray(payload.teachers) ? payload.teachers : [];
  const slotSpan = computeCourseSlotSpan(payload.course_id);
  const insert = db.prepare(
    "INSERT INTO cohort_slot_courses (course_id, slot_id, cohort_id, teachers, slot_span) VALUES (?, ?, ?, ?, ?)"
  );
  const created = [];
  db.transaction(() => {
    cohorts.forEach((cohortId) => {
      const result = insert.run(
        payload.course_id,
        payload.slot_id,
        cohortId,
        JSON.stringify(teachers),
        slotSpan
      );
      const slotIds = upsertRunSlots(
        Number(result.lastInsertRowid),
        payload.slot_id,
        slotSpan
      );
      created.push({
        run_id: result.lastInsertRowid,
        course_id: payload.course_id,
        slot_id: payload.slot_id,
        slot_ids: slotIds,
        slot_span: slotSpan,
        cohorts: cohortId != null ? [cohortId] : [],
        teachers,
      });
    });
  })();
  res.json(created.length === 1 ? created[0] : created);
});

router.put("/:id", (req, res) => {
  const payload = req.body;
  const teachers = Array.isArray(payload.teachers) ? payload.teachers : [];
  const slotSpan = computeCourseSlotSpan(payload.course_id);
  const stmt = db.prepare(
    "UPDATE cohort_slot_courses SET course_id = ?, slot_id = ?, cohort_id = ?, teachers = ?, slot_span = ? WHERE cohort_slot_course_id = ?"
  );
  stmt.run(
    payload.course_id,
    payload.slot_id,
    Array.isArray(payload.cohorts) && payload.cohorts.length > 0
      ? payload.cohorts[0]
      : null,
    JSON.stringify(teachers),
    slotSpan,
    req.params.id
  );
  const slotIds = upsertRunSlots(
    Number(req.params.id),
    payload.slot_id,
    slotSpan
  );
  res.json({
    run_id: Number(req.params.id),
    course_id: payload.course_id,
    slot_id: payload.slot_id,
    slot_ids: slotIds,
    slot_span: slotSpan,
    cohorts:
      Array.isArray(payload.cohorts) && payload.cohorts.length > 0
        ? payload.cohorts
        : [],
    teachers,
  });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM course_run_slots WHERE run_id = ?").run(req.params.id);
  db.prepare(
    "DELETE FROM cohort_slot_courses WHERE cohort_slot_course_id = ?"
  ).run(req.params.id);
  res.json({ success: true });
});

export default router;
