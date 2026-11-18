import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEACHER_PERIOD_RULE, teacherPeriodRule, coveredTeacherSlots,
  teacherPeriodConflicts, teacherDayConflicts, assertTeacherAssignmentChanges
} from '../../src/platform/services/teacher-assignment-policy.js';
import { normalizeBusinessLogic } from '../../src/platform/services/business-logic.defaults.js';
import { DataValidator } from '../../src/platform/services/data-validator.service.js';

const slots = [
  { slot_id: 1, start_date: '2027-01-01', end_date: '2027-01-31' },
  { slot_id: 2, start_date: '2027-02-01', end_date: '2027-02-28' },
  { slot_id: 3, start_date: '2027-03-01', end_date: '2027-03-31' }
];
const courses = [{ course_id: 1, credits: 15 }, { course_id: 2, credits: 7.5 }];
const first = { run_id: 1, course_id: 1, slot_id: 1, teachers: [7], kursansvarig_id: 7 };
const second = { run_id: 2, course_id: 2, slot_id: 2, teachers: ['7'] };
const rules = (enabled, kind) => ({ scheduling: { rules: [{ id: TEACHER_PERIOD_RULE, enabled, kind }] } });
const before = { runs: [first], slots, courses };
const check = businessLogic => assertTeacherAssignmentChanges(before, [first, second], businessLogic, slots, courses);

test('missing rule defaults to disabled and old settings gain the disabled rule', () => {
  assert.equal(teacherPeriodRule({}).enabled, false);
  assert.equal(teacherPeriodRule(normalizeBusinessLogic({ scheduling: { rules: [] } })).enabled, false);
});

test('disabled and Soft allow multiple courses, Hard blocks new overlapping assignments', () => {
  assert.doesNotThrow(() => check(rules(false, 'hard')));
  assert.doesNotThrow(() => check(rules(true, 'soft')));
  assert.throws(() => check(rules(true, 'hard')), error => error.status === 409);
  assert.doesNotThrow(() => assertTeacherAssignmentChanges(before,
    [first, { ...second, slot_id: 3 }], rules(true, 'hard'), slots, courses));
});

test('legacy 15 credit courses cover two periods and explicit slot links take precedence', () => {
  assert.deepEqual(coveredTeacherSlots({ ...first, slot_span: 1 }, slots, courses), ['1', '2']);
  assert.deepEqual(coveredTeacherSlots({ ...first, slot_ids: [2, 3] }, slots, courses), ['2', '3']);
  assert.deepEqual(teacherPeriodConflicts([first, second], slots, courses), [
    { teacherId: '7', slotId: '2', courseIds: ['1', '2'] }
  ]);
});

test('same course across cohorts is not a conflict and enabling Hard retains existing assignments', () => {
  assert.deepEqual(teacherPeriodConflicts([first, { ...first, run_id: 3, cohorts: [2] }], slots, courses), []);
  const runs = [structuredClone(first), structuredClone(second)];
  const snapshot = structuredClone(runs);
  const validator = new DataValidator({ getCourseRuns: () => runs, getSlots: () => slots, getCourses: () => courses });
  assert.equal(validator.validateTeacherAssignments().length, 1);
  assert.deepEqual(runs, snapshot);
  assert.doesNotThrow(() => assertTeacherAssignmentChanges({ runs, slots, courses },
    [...runs].reverse(), rules(true, 'hard'), slots, courses));
  assert.doesNotThrow(() => assertTeacherAssignmentChanges({ runs, slots, courses },
    [first], rules(true, 'hard'), slots, courses));
});

test('day overlaps use active dates, normalize timestamps and deduplicate dates', () => {
  const conflicts = teacherPeriodConflicts([first, second], slots, courses);
  const days = new Map([['1', ['2027-02-02T09:00:00', '2027-02-03']],
    ['2', ['2027-02-02', '2027-02-02', '2027-02-04']]]);
  assert.deepEqual(teacherDayConflicts(conflicts, (_slot, course) => days.get(course)), [
    { ...conflicts[0], dates: ['2027-02-02'] }
  ]);
  assert.deepEqual(teacherDayConflicts(conflicts, () => []), []);
});
