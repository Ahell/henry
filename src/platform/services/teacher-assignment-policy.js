export const TEACHER_PERIOD_RULE = 'maxOneCoursePerTeacherPeriod';

export function teacherPeriodRule(businessLogic) {
  return businessLogic?.scheduling?.rules?.find(rule => rule.id === TEACHER_PERIOD_RULE)
    || { enabled: false, kind: 'hard' };
}

export function coveredTeacherSlots(run, slots, courses) {
  if (Array.isArray(run.slot_ids) && run.slot_ids.length) {
    return [...new Set(run.slot_ids.map(String))];
  }
  const ordered = [...slots].sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
  const start = ordered.findIndex(slot => String(slot.slot_id) === String(run.slot_id));
  const course = courses.find(course => String(course.course_id) === String(run.course_id));
  const span = Math.max(1, Number(run.slot_span) || 1, Number(course?.credits) === 15 ? 2 : 1);
  if (start < 0) return run.slot_id == null ? [] : [String(run.slot_id)];
  return ordered.slice(start, start + span).map(slot => String(slot.slot_id));
}

export function teacherPeriodConflicts(runs, slots, courses) {
  const assignments = new Map();
  for (const run of runs) {
    for (const slotId of coveredTeacherSlots(run, slots, courses)) {
      for (const teacherId of run.teachers || []) {
        const key = JSON.stringify([String(teacherId), slotId]);
        if (!assignments.has(key)) {
          assignments.set(key, {
            teacherId: String(teacherId), slotId, courses: new Set()
          });
        }
        assignments.get(key).courses.add(String(run.course_id));
      }
    }
  }
  const conflicts = [];
  for (const assignment of assignments.values()) {
    const ids = [...assignment.courses].sort();
    for (let first = 0; first < ids.length; first++) {
      for (let second = first + 1; second < ids.length; second++) {
        conflicts.push({
          teacherId: assignment.teacherId,
          slotId: assignment.slotId,
          courseIds: [ids[first], ids[second]]
        });
      }
    }
  }
  return conflicts;
}

export function teacherDayConflicts(periodConflicts, activeDays) {
  return periodConflicts.flatMap(conflict => {
    const firstDays = activeDays(conflict.slotId, conflict.courseIds[0])
      .map(day => String(day).split('T')[0]);
    const secondDays = activeDays(conflict.slotId, conflict.courseIds[1])
      .map(day => String(day).split('T')[0]);
    const first = new Set(firstDays);
    const dates = [...new Set(secondDays)].filter(day => first.has(day)).sort();
    return dates.length ? [{ ...conflict, dates }] : [];
  });
}

export function assertTeacherAssignmentChanges(before, after, businessLogic, slots, courses) {
  const rule = teacherPeriodRule(businessLogic);
  if (!rule.enabled || rule.kind !== 'hard') return;
  const existingConflicts = teacherPeriodConflicts(before.runs, before.slots, before.courses);
  const existing = new Set(existingConflicts.map(conflict => JSON.stringify(conflict)));
  const added = teacherPeriodConflicts(after, slots, courses)
    .find(conflict => !existing.has(JSON.stringify(conflict)));
  if (added) {
    const error = new Error('Bemanningen blockerades av regeln ”Högst en kurs per lärare och period”. Läraren är redan bemannad på en annan kurs under en berörd period.');
    error.status = 409;
    throw error;
  }
}
