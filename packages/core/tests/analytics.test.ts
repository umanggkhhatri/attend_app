import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attendanceMath,
  haversine,
  students,
  courses,
  history,
  studentAnalytics,
  teacherRows,
  exportCsv,
} from '../src';
test('requested roster and six year-three semester-one courses', () => {
  assert.equal(students.length, 152);
  assert.equal(new Set(students.map((s) => s.id)).size, 152);
  assert.equal(students.filter((s) => s.batch === 'AI').length, 56);
  assert.equal(courses.length, 6);
  assert.ok(courses.every((c) => /^CS31\d{2}$/.test(c.id)));
});
test('75% recovery and safe-to-miss math', () => {
  assert.equal(attendanceMath(14, 24).needed, 16);
  assert.equal(attendanceMath(18, 24).needed, 0);
  assert.equal(attendanceMath(18, 24).canMiss, 0);
  assert.equal(attendanceMath(24, 24).canMiss, 8);
  assert.equal(attendanceMath(0, 0).eligible, false);
  assert.throws(() => attendanceMath(5, 4));
});
test('history is 12 weeks with consistent faculty/student reports', () => {
  assert.equal(history.sessions.length, 144);
  const s = students[0];
  const a = studentAnalytics(s.id, history);
  const r = teacherRows(courses[0].id, history, students)[0];
  assert.equal(a[0].attended, r.attended);
  assert.ok(a.every((c) => c.total === 24));
});
test('cancelled and open sessions do not lower student attendance', () => {
  const original = studentAnalytics(students[0].id, history)[0];
  const modified = studentAnalytics(students[0].id, {
    ...history,
    sessions: [...history.sessions, { ...history.sessions[0], id: 'new', status: 'cancelled' }],
  })[0];
  assert.equal(original.total, modified.total);
});
test('geofence distance and CSV export', () => {
  assert.equal(haversine(25, 84, 25, 84), 0);
  assert.ok(haversine(25, 84, 25.001, 84) > 100);
  assert.ok(exportCsv(teacherRows(courses[0].id, history, students)).includes('2401AI01'));
});
