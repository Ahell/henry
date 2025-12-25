import { db } from "../../../../db/index.js";

export function insertJointCourseRuns(courseSlots = []) {
  if (!courseSlots.length) return;

  // Group by course_id + slot_id to identify joint runs
  // Map key: "courseId-slotId" -> { slots: [], jointData: {} }
  const groups = new Map();

  for (const cs of courseSlots) {
    // skip invalid entries
    if (!cs.course_id || !cs.slot_id) continue;

    const key = `${cs.course_id}-${cs.slot_id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        course_id: cs.course_id,
        slot_id: cs.slot_id,
        teachers: cs.teachers || [],
        slot_span: cs.slot_span || 1,
        created_at: cs.created_at || new Date().toISOString(),
        children: []
      });
    }
    const group = groups.get(key);
    group.children.push(cs);
  }

  const insertJoint = db.prepare(
    "INSERT INTO joint_course_runs (course_id, slot_id, slot_span, kursansvarig_id, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  
  const insertChild = db.prepare(
    "INSERT INTO cohort_slot_courses (cohort_slot_course_id, joint_run_id, course_id, slot_id, cohort_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const insertTeacherLink = db.prepare(
    "INSERT OR IGNORE INTO joint_course_run_teachers (joint_run_id, teacher_id) VALUES (?, ?)"
  );

  for (const group of groups.values()) {
    // 1. Insert Parent Joint Run
    const info = insertJoint.run(
      group.course_id,
      group.slot_id,
      group.slot_span,
      // Temporarily use null for kursansvarig_id in bulk save
      // as it's not present in normalized.dedupedCourseSlots from frontend
      null, 
      group.created_at
    );
    const jointRunId = info.lastInsertRowid;

    // 2. Insert Children linking to Parent
    for (const child of group.children) {
      insertChild.run(
        child.cohort_slot_course_id || null,
        jointRunId,
        child.course_id,
        child.slot_id,
        child.cohort_id ?? null,
        child.created_at || new Date().toISOString()
      );
    }

    // 3. Insert Teachers linking to Parent
    if (Array.isArray(group.teachers)) {
      for (const tid of group.teachers) {
        if (tid) {
          insertTeacherLink.run(jointRunId, tid);
        }
      }
    }
  }
}