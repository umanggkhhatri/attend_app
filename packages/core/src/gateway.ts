import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { history, students, courses, type Snapshot, type Session, type CheckIn } from './data';
import { haversine } from './analytics';
export type Point = { lat: number; lon: number };
export type Position = Point & { accuracy: number; timestamp: number };
export function createGateway(url?: string, key?: string) {
  const client: SupabaseClient | null =
    url && key
      ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      : null;
  let local: Snapshot = { sessions: [...history.sessions], checkIns: [...history.checkIns] };
  async function rpc(name: string, args: Record<string, unknown> = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const { data, error } = await client!.rpc(name, args).abortSignal(controller.signal);
      if (error) throw new Error(error.message);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    live: !!client,
    async snapshot(filter: { studentId?: string; courseId?: string } = {}): Promise<Snapshot> {
      if (!client)
        return {
          sessions: [...local.sessions],
          checkIns: [...local.checkIns],
          corrections: [...(local.corrections ?? [])],
        };
      const data = await rpc('demo_snapshot', {
        p_student: filter.studentId ?? null,
        p_course: filter.courseId ?? null,
      });
      const sessions: Session[] = data.sessions.map((s: any) => ({
        id: s.id,
        courseId: s.course_id,
        date: s.created_at,
        status: s.status,
        lat: s.lat,
        lon: s.lon,
        radius: s.radius,
      }));
      const checkIns: CheckIn[] = data.check_ins.map((c: any) => ({
        sessionId: c.session_id,
        studentId: c.student_id,
        time: c.created_at,
        distance: c.distance,
      }));
      const corrections = (data.corrections ?? []).map((c: any) => ({
        id: c.id,
        sessionId: c.session_id,
        studentId: c.student_id,
        present: c.present,
        reason: c.reason,
        time: c.created_at,
      }));
      return { sessions, checkIns, corrections };
    },
    async open(courseId: string, point: Point): Promise<string> {
      if (
        !courses.some((c) => c.id === courseId) ||
        !Number.isFinite(point.lat) ||
        !Number.isFinite(point.lon) ||
        Math.abs(point.lat) > 90 ||
        Math.abs(point.lon) > 180
      )
        throw new Error('Select a valid course and classroom location.');
      if (client)
        return rpc('demo_open_session', { p_course: courseId, p_lat: point.lat, p_lon: point.lon });
      if (local.sessions.some((s) => s.courseId === courseId && s.status === 'open'))
        throw new Error('Close the existing session first.');
      const id = `demo-${Date.now()}`;
      local.sessions.push({
        id,
        courseId,
        date: new Date().toISOString(),
        status: 'open',
        ...point,
        radius: 50,
      });
      return id;
    },
    async qr(sessionId: string): Promise<string> {
      if (client) return rpc('demo_qr', { p_session: sessionId });
      if (!local.sessions.some((s) => s.id === sessionId && s.status === 'open'))
        throw new Error('This session is not open.');
      return JSON.stringify({
        v: 1,
        session: sessionId,
        slot: Math.floor(Date.now() / 3000),
        token: 'local-preview-only',
      });
    },
    async close(sessionId: string, cancel = false) {
      if (client) await rpc('demo_close_session', { p_session: sessionId, p_cancel: cancel });
      else {
        if (!local.sessions.some((s) => s.id === sessionId && s.status === 'open'))
          throw new Error('This session has already been closed.');
        local.sessions = local.sessions.map((s) =>
          s.id === sessionId ? { ...s, status: cancel ? 'cancelled' : 'closed' } : s,
        );
      }
    },
    async correct(sessionId: string, studentId: string, present: boolean, reason: string) {
      if (!students.some((s) => s.id === studentId))
        throw new Error('Choose a valid demo student.');
      if (reason.trim().length < 5) throw new Error('Add a reason of at least five characters.');
      if (client)
        await rpc('demo_correct', {
          p_session: sessionId,
          p_student: studentId,
          p_present: present,
          p_reason: reason,
        });
      else {
        if (!local.sessions.some((s) => s.id === sessionId && s.status === 'closed'))
          throw new Error('Only finalised sessions can be corrected.');
        local.checkIns = local.checkIns.filter(
          (c) => !(c.sessionId === sessionId && c.studentId === studentId),
        );
        if (present) local.checkIns.push({ sessionId, studentId, time: new Date().toISOString() });
        local.corrections = [
          { id: Date.now(), sessionId, studentId, present, reason, time: new Date().toISOString() },
          ...(local.corrections ?? []),
        ];
      }
    },
    async mark(
      payload: string,
      studentId: string,
      position: Position,
    ): Promise<{ already: boolean; distance: number }> {
      if (!students.some((s) => s.id === studentId))
        throw new Error('Choose a valid demo student.');
      if (payload.length > 10000) throw new Error('QR payload is too large.');
      let qr: { v: number; session: string; slot: number; token: string };
      try {
        qr = JSON.parse(payload);
      } catch {
        throw new Error('This is not a OneAttend attendance QR.');
      }
      if (
        !qr ||
        qr.v !== 1 ||
        typeof qr.session !== 'string' ||
        !Number.isInteger(qr.slot) ||
        typeof qr.token !== 'string'
      )
        throw new Error('Invalid attendance QR.');
      if (
        !Number.isFinite(position.lat) ||
        !Number.isFinite(position.lon) ||
        Math.abs(position.lat) > 90 ||
        Math.abs(position.lon) > 180 ||
        !Number.isFinite(position.accuracy) ||
        position.accuracy < 0
      )
        throw new Error('Invalid GPS position.');
      if (
        !Number.isFinite(position.timestamp) ||
        Date.now() - position.timestamp > 20000 ||
        position.timestamp > Date.now() + 5000
      )
        throw new Error('Location is stale. Scan again for a fresh GPS reading.');
      if (position.accuracy > 100)
        throw new Error('GPS accuracy is too low. Move near a window or outdoors and retry.');
      if (client)
        return rpc('demo_mark', {
          p_payload: qr,
          p_student: studentId,
          p_lat: position.lat,
          p_lon: position.lon,
          p_accuracy: position.accuracy,
        });
      const session = local.sessions.find((s) => s.id === qr.session && s.status === 'open');
      if (!session)
        throw new Error(
          'This session is closed or belongs to another device. Connect Supabase for cross-device check-in.',
        );
      const slot = Math.floor(Date.now() / 3000);
      if (qr.slot !== slot && qr.slot !== slot - 1)
        throw new Error('QR expired. Scan the current code.');
      if (qr.token !== 'local-preview-only') throw new Error('Invalid local preview QR.');
      const distance = haversine(position.lat, position.lon, session.lat, session.lon);
      if (distance > 50)
        throw new Error(
          `You are ${Math.round(distance)}m away. Move within 50m of the selected classroom.`,
        );
      const already = local.checkIns.some(
        (c) => c.sessionId === session.id && c.studentId === studentId,
      );
      if (!already)
        local.checkIns.push({
          sessionId: session.id,
          studentId,
          time: new Date().toISOString(),
          distance,
        });
      return { already, distance };
    },
  };
}
