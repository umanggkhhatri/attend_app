/** Capture a shareable UI gallery without changing existing attendance records. */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'artifacts/team-screenshots');
const facultyDir = resolve(output, 'faculty-admin');
const studentDir = resolve(output, 'student');
await Promise.all([mkdir(facultyDir, { recursive: true }), mkdir(studentDir, { recursive: true })]);
const manifest = [];
const skipped = [];

async function scrollTop(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const element of document.querySelectorAll('*')) {
      const style = getComputedStyle(element);
      if (element.scrollHeight > element.clientHeight && /auto|scroll/.test(style.overflowY)) {
        element.scrollTop = 0;
      }
    }
  });
}
async function shot(page, group, file, caption) {
  await scrollTop(page);
  await page.screenshot({
    path: resolve(group === 'student' ? studentDir : facultyDir, file),
    animations: 'disabled',
  });
  manifest.push({ group, file, caption });
  console.log(`${group}/${file}`);
}
async function dismissPhoneSheet(page) {
  await page.getByLabel('Close dialog', { exact: true }).last().click();
}

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
  const faculty = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
  });
  await faculty.goto('http://localhost:5173');
  await faculty.getByText('Live connected', { exact: true }).waitFor({ timeout: 20000 });
  await shot(
    faculty,
    'faculty',
    '01-overview.png',
    'Faculty overview; fictional fixture cohort and attendance data.',
  );
  await faculty.getByRole('button', { name: 'Student records', exact: true }).click();
  await shot(
    faculty,
    'faculty',
    '02-student-records.png',
    'Searchable course-wise student records.',
  );
  await faculty.getByRole('button', { name: 'Below 75%', exact: true }).click();
  await shot(
    faculty,
    'faculty',
    '03-shortage-filter.png',
    'Students below 75% with recovery requirements.',
  );
  await faculty.getByPlaceholder('Search name or roll number').fill('2401AI01');
  await faculty.locator('tbody tr').first().click();
  await faculty.getByRole('dialog').waitFor();
  await shot(
    faculty,
    'faculty',
    '04-individual-record.png',
    'Individual course history and eligibility details.',
  );
  await faculty.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await faculty.getByRole('button', { name: 'Reports & insights', exact: true }).click();
  await shot(
    faculty,
    'faculty',
    '05-reports-insights.png',
    'Faculty reports, weekly participation and export controls.',
  );
  await faculty.getByRole('button', { name: 'Corrections', exact: false }).click();
  await shot(
    faculty,
    'faculty',
    '06-correction-inbox.png',
    'Attendance correction controls; sample request queue. No correction was submitted.',
  );
  await faculty.getByRole('button', { name: 'Timetable', exact: true }).click();
  await shot(
    faculty,
    'faculty',
    '07-teaching-timetable.png',
    'Sample teaching timetable with session-start controls.',
  );

  const openButton = faculty.getByRole('button', { name: 'Start attendance', exact: true });
  if (await openButton.isEnabled()) {
    await openButton.click();
    await faculty.locator('.leaflet-container').waitFor();
    await faculty.locator('.leaflet-container').click({ position: { x: 250, y: 150 } });
    await faculty
      .waitForFunction(
        () => {
          const tiles = [...document.querySelectorAll('.leaflet-tile-pane img')];
          return tiles.length > 0 && tiles.every((tile) => tile.complete && tile.naturalWidth > 0);
        },
        undefined,
        { timeout: 15000 },
      )
      .catch(() =>
        skipped.push(
          'Some map tiles did not load completely; map screenshot preserves the actual displayed state.',
        ),
      );
    await shot(
      faculty,
      'faculty',
      '08-classroom-map.png',
      'Map-selected classroom example and 50m boundary; no session submitted from this form.',
    );
    await faculty.getByRole('button', { name: 'Close dialog', exact: true }).click();
  } else {
    skipped.push(
      'Classroom-map form: an existing session was open, so its controls were not altered.',
    );
  }

  const snapshot = await rpc('demo_snapshot', { p_student: null, p_course: 'CS3101' });
  if (!snapshot.sessions.some((session) => session.status === 'open')) {
    ownedSession = await rpc('demo_open_session', {
      p_course: 'CS3101',
      p_lat: 25.535,
      p_lon: 84.851,
    });
  }
  await faculty.getByRole('button', { name: 'Attendance sessions', exact: true }).click();
  await faculty.locator('.qr-box svg').waitFor({ timeout: 20000 });
  await shot(
    faculty,
    'faculty',
    '09-live-attendance.png',
    'Actual live-demo session UI. QR screenshot is static and expired; roster is fictional.',
  );
  await faculty.getByRole('button', { name: 'Demo guide', exact: true }).click();
  await shot(
    faculty,
    'faculty',
    '10-demo-guide-reminders.png',
    'Demo guide and reminder preview; no messages sent.',
  );
  await faculty.getByRole('button', { name: 'Close dialog', exact: true }).click();

  const phone = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
  });
  await phone.goto('http://localhost:4174');
  await phone.getByText('Live connected', { exact: true }).waitFor({ timeout: 20000 });
  await phone.getByRole('tab', { name: 'Attendance', exact: true }).click();
  await shot(
    phone,
    'student',
    '01-membership-overview.png',
    'Student attendance membership screen; proposed price, no payment.',
  );
  await phone.getByRole('button', { name: 'Unlock attendance insights', exact: true }).click();
  await phone.getByPlaceholder('Enter demo access code').click();
  await shot(
    phone,
    'student',
    '02-demo-unlock.png',
    'Demo unlock form; not a real subscription purchase.',
  );
  await phone.getByPlaceholder('Enter demo access code').fill('student123');
  await phone.getByRole('button', { name: 'Unlock demo insights', exact: true }).click();
  await phone.getByPlaceholder('Enter demo access code').waitFor({ state: 'hidden' });
  if (await phone.getByRole('alert').count()) await phone.getByRole('alert').click();
  await shot(
    phone,
    'student',
    '03-course-attendance.png',
    'Course-wise attendance insights using seeded fictional records.',
  );
  await phone.getByText('CS3101', { exact: true }).first().click();
  await phone.getByText('What if I miss a class?', { exact: true }).waitFor();
  await shot(phone, 'student', '04-recovery-what-if.png', 'Recovery planner and what-if analysis.');
  await dismissPhoneSheet(phone);
  await phone.getByText('Trends', { exact: true }).click();
  await shot(phone, 'student', '05-weekly-trends.png', 'Weekly trends and course comparisons.');
  await phone.getByText('Calendar', { exact: true }).click();
  await shot(
    phone,
    'student',
    '06-attendance-calendar.png',
    'Attendance calendar with present, absent and cancelled records.',
  );
  await phone.getByRole('tab', { name: 'Home', exact: true }).click();
  await shot(
    phone,
    'student',
    '07-home-dashboard.png',
    'Live-connected student home with sample attendance and campus shortcuts.',
  );
  await phone.getByText('Timetable', { exact: true }).first().click();
  await shot(phone, 'student', '08-student-timetable.png', 'Sample student weekly timetable.');
  await phone.getByRole('tab', { name: 'Campus', exact: true }).click();
  await shot(
    phone,
    'student',
    '09-campus-services.png',
    'Campus-service directory; interactive sample workflows.',
  );

  const campus = [
    ['Cab sharing', '10-cab-sharing.png'],
    ['Gate passes', '11-gate-passes.png'],
    ['Hostel complaints', '12-hostel-complaints.png'],
    ['Lost & found', '13-lost-found.png'],
    ['Announcements', '14-announcements.png'],
    ['Academic calendar', '15-academic-calendar.png'],
    ['Leave & corrections', '16-leave-corrections.png'],
    ['Mess & feedback', '17-mess-feedback.png'],
    ['Campus directory', '18-campus-directory.png'],
  ];
  for (const [name, file] of campus) {
    await phone.getByText(name, { exact: true }).first().click();
    await shot(
      phone,
      'student',
      file,
      `${name}: sample campus workflow, not a live institutional service.`,
    );
    if (name === 'Hostel complaints') {
      await phone.getByRole('button', { name: 'Report an issue', exact: true }).click();
      await phone.getByPlaceholder('Ceiling fan is not working').click();
      await shot(
        phone,
        'student',
        '19-hostel-complaint-form.png',
        'Sample complaint form; no request submitted.',
      );
      await dismissPhoneSheet(phone);
    }
    await phone.getByText('Back to campus', { exact: true }).click();
  }
  await phone.getByRole('tab', { name: 'Profile', exact: true }).click();
  await shot(
    phone,
    'student',
    '20-student-profile.png',
    'Fictional demo student profile and demo membership state.',
  );
  await phone.getByLabel('Choose demo student', { exact: true }).click();
  await phone.getByPlaceholder('Name or roll number').click();
  await shot(
    phone,
    'student',
    '21-demo-student-selector.png',
    'Searchable fictional demo identity selector, not real authenticated users.',
  );
  await dismissPhoneSheet(phone);
  await phone.getByRole('tab', { name: 'Check in', exact: true }).click();
  await phone.getByText('FREE CLASSROOM CHECK-IN', { exact: true }).waitFor();
  await shot(
    phone,
    'student',
    '22-checkin-permission-screen.png',
    'Browser camera/location permission state. Not evidence of a successful GPS check-in.',
  );
} finally {
  if (ownedSession) {
    await rpc('demo_close_session', { p_session: ownedSession, p_cancel: true });
    console.log('Cancelled only the session created for these screenshots.');
  }
  await browser.close();
  await writeFile(
    resolve(output, 'manifest.json'),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        source: 'Authentic browser previews; fictional seeded student records',
        facultyRole: 'Faculty dashboard, admin-style layout; not a separate institute-admin role',
        screenshots: manifest,
        skipped,
      },
      null,
      2,
    ),
  );
  const description = [
    '# OneAttend team screenshot gallery',
    '',
    'Faculty/admin-style screenshots are in `faculty-admin/`; student screenshots are in `student/`.',
    'All images are original, high-resolution browser-preview screenshots. They are not native Android device captures.',
    'All student identities and attendance history are fictional demo fixtures. Campus workflows are samples, not actual approvals or bookings.',
    'The QR in the live-session screenshot is static and expired. The scanner image is a permission-state view, not a successful real-device GPS check-in.',
    '',
    '## Screenshots',
    ...manifest.map(
      (item) =>
        `- **${item.group === 'student' ? 'student' : 'faculty-admin'}/${item.file}** — ${item.caption}`,
    ),
    ...(skipped.length ? ['', '## Not captured', ...skipped.map((item) => `- ${item}`)] : []),
  ].join('\n');
  await writeFile(resolve(output, 'README.md'), description);
}
console.log(`Saved ${manifest.length} screenshots to ${output}`);
