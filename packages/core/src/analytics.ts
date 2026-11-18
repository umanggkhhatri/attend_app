import { courses, type Snapshot, type Student } from './data';
export const THRESHOLD = 75;
export function attendanceMath(attended: number, total: number, threshold = THRESHOLD) {
  if (
    !Number.isInteger(total) ||
    !Number.isInteger(attended) ||
    total < 0 ||
    attended < 0 ||
    attended > total ||
    threshold <= 0 ||
    threshold >= 100
  )
    throw new Error('Invalid attendance inputs');
  const fraction = threshold / 100;
  const percentage = total ? (attended / total) * 100 : 0;
  const needed = Math.max(0, Math.ceil((fraction * total - attended) / (1 - fraction) - 1e-9));
  const canMiss = total ? Math.max(0, Math.floor(attended / fraction - total + 1e-9)) : 0;
  return {
    attended,
    total,
    percentage,
    needed,
    canMiss,
    eligible: total > 0 && attended / total >= fraction,
  };
}
export function studentAnalytics(studentId: string, snapshot: Snapshot) {
  const marked = new Set(
    snapshot.checkIns.filter((c) => c.studentId === studentId).map((c) => c.sessionId),
  );
  return courses.map((course) => {
    const sessions = snapshot.sessions.filter(
      (s) => s.courseId === course.id && s.status === 'closed',
    );
    const attended = sessions.filter((s) => marked.has(s.id)).length;
    return { course, ...attendanceMath(attended, sessions.length), sessions };
  });
}
export function weeklyTrend(studentId: string, snapshot: Snapshot) {
  const marked = new Set(
    snapshot.checkIns.filter((c) => c.studentId === studentId).map((c) => c.sessionId),
  );
  return Array.from({ length: 12 }, (_, week) => {
    const start = Date.UTC(2026, 7, 3 + week * 7),
      end = start + 7 * 86400000;
    const sessions = snapshot.sessions.filter(
      (s) => s.status === 'closed' && Date.parse(s.date) >= start && Date.parse(s.date) < end,
    );
    return {
      label: `W${week + 1}`,
      ...attendanceMath(sessions.filter((s) => marked.has(s.id)).length, sessions.length),
    };
  });
}
export function teacherRows(courseId: string, snapshot: Snapshot, roster: Student[]) {
  const sessions = snapshot.sessions.filter(
    (s) => s.courseId === courseId && s.status === 'closed',
  );
  const ids = new Set(sessions.map((s) => s.id));
  const counts = new Map<string, Set<string>>();
  snapshot.checkIns.forEach((c) => {
    if (ids.has(c.sessionId)) {
      if (!counts.has(c.studentId)) counts.set(c.studentId, new Set());
      counts.get(c.studentId)!.add(c.sessionId);
    }
  });
  return roster.map((student) => ({
    student,
    ...attendanceMath(counts.get(student.id)?.size ?? 0, sessions.length),
  }));
}
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (v: number) => (v * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
export function exportCsv(rows: ReturnType<typeof teacherRows>) {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [
    ['Roll number', 'Name', 'Batch', 'Attended', 'Conducted', 'Percentage', 'Classes needed'],
    ...rows.map((r) => [
      r.student.id,
      r.student.name,
      r.student.batch,
      r.attended,
      r.total,
      r.percentage.toFixed(1),
      r.needed,
    ]),
  ]
    .map((row) => row.map(cell).join(','))
    .join('\r\n');
}
