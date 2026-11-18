import { db } from '../db/index.js';
import { assertTeacherAssignmentChanges } from '../../src/platform/services/teacher-assignment-policy.js';

function assignmentState() {
  const links = db.prepare('SELECT joint_run_id, teacher_id FROM joint_course_run_teachers').all();
  const periods = db.prepare('SELECT run_id, slot_id, sequence FROM course_run_slots ORDER BY sequence').all();
  return {
    slots: db.prepare('SELECT * FROM slots').all(),
    courses: db.prepare('SELECT * FROM courses').all(),
    runs: db.prepare('SELECT * FROM joint_course_runs').all().map(run => ({
      ...run,
      teachers: links.filter(link => link.joint_run_id === run.id).map(link => link.teacher_id),
      slot_ids: periods.filter(period => period.run_id === run.id).map(period => period.slot_id)
    }))
  };
}

// Validate inside the same transaction as persistence, retaining existing conflicts.
export function assignmentTransaction(action) {
  return db.transaction(() => {
    const before = assignmentState();
    const result = action();
    const after = assignmentState();
    const setting = db.prepare('SELECT value FROM app_settings WHERE key=?').get('business_logic');
    const rules = setting ? JSON.parse(setting.value) : {};
    assertTeacherAssignmentChanges(before, after.runs, rules, after.slots, after.courses);
    return result;
  });
}
