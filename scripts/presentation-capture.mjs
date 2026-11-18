import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, '../OneAttend_Presentation_Assets');
await mkdir(output, { recursive: true });
const env = Object.fromEntries(
  (await readFile(resolve(root, 'apps/mobile/.env'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
const db = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
async function rpc(name, args) {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

const browser = await chromium.launch({ headless: true });
let ownedSession;
try {
  const phone = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
  });
  await phone.goto('http://localhost:4174');
  await phone.getByText('Live connected', { exact: true }).waitFor({ timeout: 20000 });
  await phone.getByRole('tab', { name: 'Attendance', exact: true }).click();
  await phone.screenshot({ path: resolve(output, 'student-membership.png') });
  await phone.getByRole('button', { name: 'Unlock attendance insights' }).click();
  await phone.getByPlaceholder('Enter demo access code').fill('student123');
  await phone.getByRole('button', { name: 'Unlock demo insights' }).click();
  await phone.getByPlaceholder('Enter demo access code').waitFor({ state: 'hidden' });
  const alert = phone.getByRole('alert');
  if (await alert.count()) await alert.click();
  await phone.screenshot({ path: resolve(output, 'student-analytics.png') });
  await phone.getByRole('tab', { name: 'Home', exact: true }).click();
  await phone.screenshot({ path: resolve(output, 'student-home.png') });
  await phone.getByRole('tab', { name: 'Campus', exact: true }).click();
  await phone.screenshot({ path: resolve(output, 'student-campus.png') });

  const snapshot = await rpc('demo_snapshot', { p_student: null, p_course: 'CS3101' });
  if (!snapshot.sessions.some((s) => s.status === 'open')) {
    // This is an explicitly demonstration-only session; never modify existing user sessions.
    ownedSession = await rpc('demo_open_session', {
      p_course: 'CS3101',
      p_lat: 25.535,
      p_lon: 84.851,
    });
  }
  const faculty = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  await faculty.goto('http://localhost:5173');
  await faculty.getByText('Live connected', { exact: true }).waitFor({ timeout: 20000 });
  await faculty.getByRole('button', { name: 'Attendance sessions', exact: true }).click();
  await faculty.locator('.qr-box svg').waitFor({ timeout: 20000 });
  await faculty
    .locator('.session-panel')
    .screenshot({ path: resolve(output, 'faculty-live-session.png') });
  await faculty.getByRole('button', { name: 'Student records', exact: true }).click();
  await faculty.screenshot({ path: resolve(output, 'faculty-records.png') });
  console.log(
    'Captured six authentic browser-preview screenshots. All student records are fixtures.',
  );
} finally {
  if (ownedSession) {
    await rpc('demo_close_session', { p_session: ownedSession, p_cancel: true });
    console.log('Cancelled only the screenshot-created session; eligibility totals are unchanged.');
  }
  await browser.close();
}
