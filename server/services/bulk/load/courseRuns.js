import {
  computeCourseSlotSpan,
  getConsecutiveSlotIds,
  getSortedSlots,
} from "../../../db/index.js";

export function buildSlotsByRun(courseRunSlots = []) {
  const slotsByRun = new Map();
  courseRunSlots.forEach((row) => {
    const list = slotsByRun.get(row.run_id) || [];
    list.push(row);
    slotsByRun.set(row.run_id, list);
  });
  return slotsByRun;
}

function mapTeachersByRun(jointTeachers = []) {
  const map = new Map();
  jointTeachers.forEach(t => {
      if (!map.has(t.joint_run_id)) map.set(t.joint_run_id, []);
      map.get(t.joint_run_id).push(t.teacher_id);
  });
  return map;
}

export function buildCourseSlots(jointRuns = [], jointTeachers = []) {
  const teachersByRun = mapTeachersByRun(jointTeachers);
  
  return jointRuns.map((jr) => {
    return {
      course_slot_id: jr.id,
      course_id: jr.course_id,
      slot_id: jr.slot_id,
      teachers: teachersByRun.get(jr.id) || [],
      slot_span: jr.slot_span,
      created_at: jr.created_at
    };
  });
}

export function buildCourseRuns(jointRuns = [], jointTeachers = [], cohortLinks = [], slotsByRun) {
  const sortedSlots = getSortedSlots();
  const teachersByRun = mapTeachersByRun(jointTeachers);
  
  const cohortsByRun = new Map();
  cohortLinks.forEach(l => {
      if (!cohortsByRun.has(l.joint_run_id)) cohortsByRun.set(l.joint_run_id, []);
      if (l.cohort_id) cohortsByRun.get(l.joint_run_id).push(l.cohort_id);
  });

  return jointRuns.map((jr) => {
    const rawSlots = slotsByRun.get(jr.id) || [];
    const span = Number(jr.slot_span);
    
    const slotIds =
      rawSlots.length > 0
        ? rawSlots
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((r) => r.slot_id)
        : getConsecutiveSlotIds(
            jr.slot_id,
            span >= 2 ? span : computeCourseSlotSpan(jr.course_id),
            sortedSlots
          );

    return {
      run_id: jr.id,
      course_id: jr.course_id,
      slot_id: slotIds[0] ?? jr.slot_id,
      slot_ids: slotIds,
      slot_span: slotIds.length || span || 1,
      cohorts: cohortsByRun.get(jr.id) || [],
      teachers: teachersByRun.get(jr.id) || [],
      kursansvarig_id: jr.kursansvarig_id || null,
    };
  });
}
