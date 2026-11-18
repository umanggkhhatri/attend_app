import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { history, teacherRows, students } from '../../packages/core/src';
const db = new PGlite();
// PGlite executes real PostgreSQL / PLpgSQL but has no pgcrypto extension.
// These SQL orchestration tests use a deterministic crypto shim. Production
// QR cryptography is pgcrypto HMAC-SHA256 and must also be tested on Supabase.
before(async () => {
  await db.exec(`create role anon; create role authenticated; create schema extensions;
 create function extensions.gen_random_bytes(n integer) returns bytea language sql as $$ select decode(repeat(md5(random()::text),ceil(n/16.0)::integer),'hex'); $$;
 create function extensions.hmac(data text, secret text, algo text) returns bytea language sql immutable as $$ select decode(md5(data || secret),'hex'); $$;`);
  const sql = await readFile(new URL('../demo.sql', import.meta.url), 'utf8');
  await db.exec(
    sql.replace(
      'create extension if not exists pgcrypto with schema extensions;',
      '-- pgcrypto replaced by explicit test-only shims above.',
    ),
  );
});
after(async () => {
  await db.close();
});
async function scalar<T>(sql: string, params: unknown[] = []): Promise<T> {
  const result = await db.query<{ value: T }>(sql, params);
  return result.rows[0].value;
}
test('database seed exactly matches the frontend history', async () => {
  const s = await scalar<any>('select public.demo_snapshot(null,null) as value');
  assert.equal(s.sessions.length, history.sessions.length);
  assert.equal(s.check_ins.length, history.checkIns.length);
  const frontend = teacherRows('CS3101', history, students);
  for (const row of frontend) {
    assert.equal(
      s.check_ins.filter(
        (c: any) => c.student_id === row.student.id && c.session_id.startsWith('history-CS3101'),
      ).length,
      row.attended,
    );
  }
});
test('QR check-in: geofence, signature, expiry, duplicates and close', async () => {
  const id = await scalar<string>(
    "select public.demo_open_session('CS3101',25.535,84.851) as value",
  );
  await assert.rejects(
    () => db.query("select public.demo_open_session('CS3101',25.535,84.851)"),
    /already has an open session/,
  );
  const getQR = async () =>
    JSON.parse(await scalar<string>('select public.demo_qr($1) as value', [id]));
  const mark = (qr: any, student = '2401AI01', lat = 25.535, accuracy = 10) =>
    scalar<any>('select public.demo_mark($1,$2,$3,$4,$5) as value', [
      qr,
      student,
      lat,
      84.851,
      accuracy,
    ]);
  await assert.rejects(
    async () => mark({ ...(await getQR()), token: 'forged' }),
    /signature is invalid/,
  );
  await assert.rejects(async () => mark({ ...(await getQR()), slot: 1 }), /QR expired/);
  await assert.rejects(async () => mark(await getQR(), '2401AI99'), /valid demo student/);
  await assert.rejects(async () => mark(await getQR(), '2401AI01', 25.545), /Move within 50m/);
  await assert.rejects(
    async () => mark(await getQR(), '2401AI01', 25.535, 200),
    /accuracy is too low/,
  );
  const first = await mark(await getQR());
  assert.equal(first.already, false);
  assert.equal(first.distance, 0);
  const duplicate = await mark(await getQR());
  assert.equal(duplicate.already, true);
  const checks = await scalar<number>(
    'select count(*)::integer as value from public.demo_check_ins where session_id=$1',
    [id],
  );
  assert.equal(checks, 1);
  await db.query('select public.demo_close_session($1,false)', [id]);
  await assert.rejects(async () => mark(await getQR()), /session is not open/);
  const status = await scalar<string>(
    'select status as value from public.demo_sessions where id=$1',
    [id],
  );
  assert.equal(status, 'closed');
});
test('corrections require a reason and retain persistent audit history', async () => {
  const sid = 'history-CS3102-0-0';
  await assert.rejects(
    () => db.query('select public.demo_correct($1,$2,true,$3)', [sid, '2401AI01', 'x']),
    /Provide a reason/,
  );
  await db.query('select public.demo_correct($1,$2,true,$3)', [
    sid,
    '2401AI01',
    'Faculty reviewed the camera issue.',
  ]);
  const snapshot = await scalar<any>('select public.demo_snapshot($1,$2) as value', [
    '2401AI01',
    'CS3102',
  ]);
  assert.equal(snapshot.corrections.length, 1);
  assert.equal(snapshot.corrections[0].present, true);
  assert.ok(snapshot.check_ins.some((c: any) => c.session_id === sid));
  assert.ok(snapshot.check_ins.every((c: any) => c.student_id === '2401AI01'));
  await db.query('select public.demo_correct($1,$2,false,$3)', [
    sid,
    '2401AI01',
    'Faculty reviewed the absence.',
  ]);
  const count = await scalar<number>(
    'select count(*)::integer as value from public.demo_check_ins where session_id=$1 and student_id=$2',
    [sid, '2401AI01'],
  );
  assert.equal(count, 0);
});
test('anonymous roles cannot directly access private secrets or attendance tables', async () => {
  await db.exec('set role anon;');
  await assert.rejects(
    () => db.query('select * from oneattend_private.secrets'),
    /permission denied/,
  );
  await assert.rejects(() => db.query('select * from public.demo_check_ins'), /permission denied/);
  const snapshot = await scalar<any>("select public.demo_snapshot('2401CS01','CS3103') as value");
  assert.ok(snapshot.sessions.length > 0);
  await db.exec('reset role;');
});
