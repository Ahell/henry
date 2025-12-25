import express from "express";
import {
  computeCourseSlotSpan,
  db,
  getConsecutiveSlotIds,
  getSortedSlots,
  upsertRunSlots,
} from "../db/index.js";
const router = express.Router();

router.get("/", (req, res) => {
  const jointRuns = db
    .prepare("SELECT * FROM joint_course_runs")
    .all()
    .map(run => run);

  const links = db.prepare("SELECT joint_run_id, cohort_id FROM cohort_slot_courses").all();
  const cohortsByRun = new Map();
  links.forEach(l => {
      if (!cohortsByRun.has(l.joint_run_id)) cohortsByRun.set(l.joint_run_id, []);
      if (l.cohort_id) cohortsByRun.get(l.joint_run_id).push(l.cohort_id);
  });

  const teacherLinks = db.prepare("SELECT joint_run_id, teacher_id FROM joint_course_run_teachers").all();
  const teachersByRun = new Map();
  teacherLinks.forEach(l => {
      if (!teachersByRun.has(l.joint_run_id)) teachersByRun.set(l.joint_run_id, []);
      teachersByRun.get(l.joint_run_id).push(l.teacher_id);
  });

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

  const runs = jointRuns.map((jr) => {
    const rawSlots = slotsByRun.get(jr.id) || [];
    const slotIds =
      rawSlots.length > 0
        ? rawSlots
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((r) => r.slot_id)
        : getConsecutiveSlotIds(
            jr.slot_id,
            Number(jr.slot_span) >= 2
              ? Number(jr.slot_span)
              : computeCourseSlotSpan(jr.course_id),
            sortedSlots
          );

    return {
      run_id: jr.id,
      course_id: jr.course_id,
      slot_id: slotIds[0] ?? jr.slot_id,
      slot_ids: slotIds,
      slot_span: slotIds.length || Number(jr.slot_span) || 1,
      cohorts: cohortsByRun.get(jr.id) || [],
      teachers: teachersByRun.get(jr.id) || [],
      kursansvarig_id: jr.kursansvarig_id || null,
    };
  });
  res.json(runs);
});

router.post("/", (req, res) => {
  const payload = req.body;
  const cohorts = Array.isArray(payload.cohorts) ? payload.cohorts : [];
  const teachers = Array.isArray(payload.teachers) ? payload.teachers : [];
  const slotSpan = computeCourseSlotSpan(payload.course_id);
  const kursansvarig_id = payload.kursansvarig_id || null;

  const insertJoint = db.prepare(
      "INSERT INTO joint_course_runs (course_id, slot_id, slot_span, kursansvarig_id) VALUES (?, ?, ?, ?)"
  );
  
    const insertTeacherLink = db.prepare(
        "INSERT OR IGNORE INTO joint_course_run_teachers (joint_run_id, teacher_id) VALUES (?, ?)"
    );
  let newRunId;
  
  db.transaction(() => {
    const result = insertJoint.run(
        payload.course_id,
        payload.slot_id,
        slotSpan,
        kursansvarig_id
    );
    newRunId = result.lastInsertRowid;

    cohorts.forEach(cohortId => {
        if (cohortId) {
            insertChild.run(newRunId, payload.course_id, payload.slot_id, cohortId);
        }
    });

    teachers.forEach(tid => {
        if (tid) insertTeacherLink.run(newRunId, tid);
    });
    
    upsertRunSlots(Number(newRunId), payload.slot_id, slotSpan);
  })();

  const slotIds = getConsecutiveSlotIds(payload.slot_id, slotSpan, getSortedSlots());

  res.json({
    run_id: newRunId,
    course_id: payload.course_id,
    slot_id: payload.slot_id,
    slot_ids: slotIds,
    slot_span: slotSpan,
    cohorts: cohorts,
    teachers,
    kursansvarig_id,
  });
});

router.put("/:id", (req, res) => {
  const runId = Number(req.params.id);
  const payload = req.body;
  const teachers = Array.isArray(payload.teachers) ? payload.teachers : [];
  const cohorts = Array.isArray(payload.cohorts) ? payload.cohorts : [];
  const slotSpan = computeCourseSlotSpan(payload.course_id);
  const kursansvarig_id = payload.kursansvarig_id || null;

  const updateJoint = db.prepare(
    "UPDATE joint_course_runs SET course_id = ?, slot_id = ?, slot_span = ?, kursansvarig_id = ? WHERE id = ?"
  );
  
  const deleteChildren = db.prepare("DELETE FROM cohort_slot_courses WHERE joint_run_id = ?");
  const insertChild = db.prepare(
      "INSERT INTO cohort_slot_courses (joint_run_id, course_id, slot_id, cohort_id) VALUES (?, ?, ?, ?)"
  );

  const deleteTeacherLinks = db.prepare("DELETE FROM joint_course_run_teachers WHERE joint_run_id = ?");
  const insertTeacherLink = db.prepare(
      "INSERT OR IGNORE INTO joint_course_run_teachers (joint_run_id, teacher_id) VALUES (?, ?)"
  );

  db.transaction(() => {
      updateJoint.run(
          payload.course_id,
          payload.slot_id,
          slotSpan,
          kursansvarig_id,
          runId
      );
      
      deleteChildren.run(runId);
      cohorts.forEach(cohortId => {
          if (cohortId) {
              insertChild.run(runId, payload.course_id, payload.slot_id, cohortId);
          }
      });

      deleteTeacherLinks.run(runId);
      teachers.forEach(tid => {
          if (tid) insertTeacherLink.run(runId, tid);
      });
      
      upsertRunSlots(runId, payload.slot_id, slotSpan);
  })();

  const customSlots = db.prepare("SELECT slot_id FROM course_run_slots WHERE run_id = ? ORDER BY sequence").all(runId);
  const slotIds = customSlots.length > 0 
      ? customSlots.map(s => s.slot_id)
      : getConsecutiveSlotIds(payload.slot_id, slotSpan, getSortedSlots());

  res.json({
    run_id: runId,
    course_id: payload.course_id,
    slot_id: payload.slot_id,
    slot_ids: slotIds,
    slot_span: slotSpan,
    cohorts: cohorts,
    teachers,
    kursansvarig_id,
  });
});

router.delete("/:id", (req, res) => {
  const runId = req.params.id;
  
  db.transaction(() => {
      db.prepare("DELETE FROM course_run_slots WHERE run_id = ?").run(runId);
      db.prepare("DELETE FROM cohort_slot_courses WHERE joint_run_id = ?").run(runId);
      db.prepare("DELETE FROM joint_course_run_teachers WHERE joint_run_id = ?").run(runId);
      db.prepare("DELETE FROM joint_course_runs WHERE id = ?").run(runId);
  })();
  
  res.json({ success: true });
});

export default router;
