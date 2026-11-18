export type SlideId =
  'intro' | 'evidence' | 'discovery' | 'flow' | 'student' | 'faculty' | 'campus' | 'model' | 'next';
export type Screenshot = {
  group: 'student' | 'faculty';
  file: string;
  title: string;
  caption: string;
};
export const fullSlides: SlideId[] = [
  'intro',
  'evidence',
  'discovery',
  'flow',
  'student',
  'faculty',
  'campus',
  'model',
  'next',
];
export const briefSlides: SlideId[] = ['intro', 'evidence', 'flow', 'model', 'next'];
export const sections: Record<
  SlideId,
  { label: string; title: string; seconds: number; notes: string[] }
> = {
  intro: {
    label: 'The venture',
    title: 'A clearer picture. Every class.',
    seconds: 45,
    notes: [
      'Start with the everyday problem: students reconstruct their attendance across several records, and teachers compile it again. OneAttend connects those two sides.',
      'The value is not just a faster scan. It is knowing where you stand early enough to act. This is the professor-approved MVP-stage venture, not a completed institutional rollout.',
      'The screenshots use fictional students. The Android APK is built, but actual phone installation and classroom GPS reliability must be reported separately.',
    ],
  },
  evidence: {
    label: 'The evidence',
    title: 'Guesswork has a real cost.',
    seconds: 80,
    notes: [
      'The uploaded workbook contains 300 student responses. 189 were unsure about meeting 75%; 165 found cross-course tracking difficult or very difficult; 222 did not track regularly.',
      '221 respondents identified IIT Patna. Treat this as exploratory campus discovery, not a representative national study.',
      'Six faculty responses are team-reported. Do not invent a faculty percentage or describe 300 surveys as 300 interviews. Open the evidence panel if asked about denominators.',
    ],
  },
  discovery: {
    label: 'Customer discovery',
    title: 'What we heard shaped what we built.',
    seconds: 50,
    notes: [
      'Link each finding to a product decision: uncertainty to recovery planning; scattered records to one course-wise view; irregular personal tracking to an automatic shared record.',
      'Earlier faculty conversations highlighted compilation effort and ease of adoption. We chose web-based faculty tools and simpler session controls.',
      'The proposed acquisition step is one faculty champion, one course and an opt-in group. This has not yet been completed, and survey respondents are not acquired customers.',
    ],
  },
  flow: {
    label: 'The connected MVP',
    title: 'One session. A shared record.',
    seconds: 80,
    notes: [
      'Walk through map selection, opening attendance, the rotating QR, the student scan and session closing. Explain the 50m boundary and unique check-in rule.',
      'QRs rotate every three seconds; the current and previous slot are accepted for a short grace window. Do not claim a fixed three-second maximum token lifetime.',
      'Actual Supabase smoke checks verified HMAC signing, duplicate prevention and geofence rejection using synthetic coordinates. This is not a classroom field trial. Screenshot QRs are static and expired.',
      'Campus services are interactive samples. Demo identities are selectable, not production authentication. The cohort of 152 is fictional fixture data.',
    ],
  },
  student: {
    label: 'Student experience',
    title: 'Know where you stand. Know what to do next.',
    seconds: 60,
    notes: [
      'Show attendance by course, not just the overall percentage. Eligibility is assessed per course. The recovery example starts with a fictional 14/24 record.',
      'Attending 16 consecutive additional classes changes 14/24 to 30/40, exactly 75%. Use the interactive example to explain the maths.',
      'Attendance records and insights are in the proposed paid student tier; check-in remains free. The code student123 is a demo unlock, not a payment transaction.',
    ],
  },
  faculty: {
    label: 'Faculty experience',
    title: 'Built for the work after class.',
    seconds: 60,
    notes: [
      'Faculty can search and filter student records, identify shortages, correct an entry with a reason, inspect class trends and export reports.',
      'These tools aim to reduce manual work; no time-saving percentage has been measured yet. Select a screenshot or open the live faculty workspace.',
      'Use the team contribution editor to add genuine individual roles. Do not invent work. The guidelines explicitly ask each team member to explain their contribution.',
    ],
  },
  campus: {
    label: 'Campus experience',
    title: 'Useful beyond the classroom.',
    seconds: 40,
    notes: [
      'Show the campus-service concepts briefly rather than letting the feature inventory dominate the venture story.',
      'Timetable, rides, passes, complaints, lost and found, announcements, calendar, leave/corrections, mess feedback and directory are sample frontend workflows.',
      'They do not create real bookings, approvals, messages or institutional leave. Attendance remains the live connected core.',
    ],
  },
  model: {
    label: 'Proposed business model',
    title: 'Free to check in. A simple plan for clarity.',
    seconds: 55,
    notes: [
      'The student hypothesis is Rs 9 per month for attendance visibility and analytics. The earlier canvas proposed Rs 19; the change is a hypothesis, not a measured commercial result.',
      'Institutes would pay based on enrolled students for shared records and faculty reporting. No institutional quote has been validated, so do not invent one.',
      'The MVP uses free-tier infrastructure. Production cost per active student, support effort and willingness to pay still need measurement. Validate the access policy before charging.',
    ],
  },
  next: {
    label: 'Learning & next steps',
    title: 'A record both sides can trust.',
    seconds: 70,
    notes: [
      'Three learnings: problem evidence is not payment validation; faculty adoption requires fewer steps; and real classroom conditions are a separate test from a working demo.',
      'Next: one course, one faculty member and opt-in students. Measure check-in success, corrections/disputes and faculty effort. Then test the pricing proposition.',
      'GPS can be spoofed. Production needs authenticated roles, tenant isolation, abuse/device controls and a privacy review. Do not promise complete proxy elimination.',
      'Close with the evidence we have, the MVP we can demonstrate and the specific pilot that tests what remains uncertain.',
    ],
  },
};

export const apkUrl =
  'https://expo.dev/artifacts/eas/Hh8tMGpbI0OScSrtQ0DFVIOZMvqITuZK1ulZ7kd_pmE.apk';
export const team = [
  'Umang Khatri',
  'Aatiksh Shukla',
  'Shivang Karthikey',
  'Aniket Kumar',
  'Arpan Kumar',
  'Charu Garg',
  'Aakash Kushwaha',
];
const student = (file: string, title: string, caption: string): Screenshot => ({
  group: 'student',
  file,
  title,
  caption,
});
const faculty = (file: string, title: string, caption: string): Screenshot => ({
  group: 'faculty',
  file,
  title,
  caption,
});
export const screenshots: Screenshot[] = [
  faculty(
    '11-live-session-panel.png',
    'Live session panel',
    'Actual live-demo session panel. The QR is static and expired; the 152 identities are fictional fixtures.',
  ),
  student(
    '07-home-dashboard.png',
    'Student home',
    'Actual browser preview connected to the demo backend. The student and records are fictional.',
  ),
  student(
    '03-course-attendance.png',
    'Course-wise attendance',
    'Seeded course records. These are demonstration identities, not acquired customers.',
  ),
  student(
    '04-recovery-what-if.png',
    'Recovery & what-if planner',
    'A fictional record illustrates the recovery calculation and effect of future absences.',
  ),
  student(
    '05-weekly-trends.png',
    'Weekly trends',
    'Student weekly attendance and course comparison using sample history.',
  ),
  student(
    '06-attendance-calendar.png',
    'Attendance calendar',
    'Present, absent and cancelled class records in the demo cohort.',
  ),
  student('08-student-timetable.png', 'Student timetable', 'Sample weekly class timetable.'),
  student(
    '09-campus-services.png',
    'Campus services',
    'Interactive campus-service samples, not institutional integrations.',
  ),
  student(
    '10-cab-sharing.png',
    'Cab sharing',
    'Sample ride-sharing workflow. No cab is booked or host contacted.',
  ),
  student(
    '11-gate-passes.png',
    'Gate passes',
    'Sample request/status interface. Not valid permission to leave campus.',
  ),
  student(
    '12-hostel-complaints.png',
    'Hostel complaints',
    'Local sample complaint tracking. No institutional request is forwarded.',
  ),
  student('13-lost-found.png', 'Lost & found', 'Sample campus item listings.'),
  student(
    '14-announcements.png',
    'Announcements',
    'Sample notices; not official institute announcements.',
  ),
  student(
    '15-academic-calendar.png',
    'Academic calendar',
    'Sample academic dates and reminder workflow.',
  ),
  student(
    '16-leave-corrections.png',
    'Leave & correction requests',
    'Sample student requests. No leave or correction approval is issued.',
  ),
  student(
    '17-mess-feedback.png',
    'Mess & feedback',
    'Sample meal menu and local feedback interface.',
  ),
  student(
    '18-campus-directory.png',
    'Campus directory',
    'Sample directory. No sample emergency number is dialled.',
  ),
  student(
    '19-hostel-complaint-form.png',
    'Complaint form',
    'Sample form; no request was submitted during capture.',
  ),
  student(
    '20-student-profile.png',
    'Student profile',
    'A fictional student and demo membership state.',
  ),
  student(
    '21-demo-student-selector.png',
    'Demo identity selector',
    'Fictional selectable identities, not production authentication.',
  ),
  student(
    '01-membership-overview.png',
    'Insights membership',
    'Proposed student plan. No payment integration or sales claim.',
  ),
  student(
    '02-demo-unlock.png',
    'Demo unlock',
    'The presentation code unlocks the demo; it is not a subscription purchase.',
  ),
  student(
    '22-checkin-permission-screen.png',
    'Check-in permissions',
    'Browser camera/location permission state, not a successful real-device GPS check-in.',
  ),
  faculty(
    '01-overview.png',
    'Faculty overview',
    'Faculty/admin-style dashboard using seeded fictitious attendance data.',
  ),
  faculty(
    '02-student-records.png',
    'Student records',
    'Searchable subject-wise records and batch filters.',
  ),
  faculty(
    '03-shortage-filter.png',
    'Shortage list',
    'Students below 75% and classes needed to recover.',
  ),
  faculty(
    '04-individual-record.png',
    'Individual record',
    'Course-level history and eligibility for a fictional student.',
  ),
  faculty(
    '05-reports-insights.png',
    'Reports & insights',
    'Course participation trends and export controls.',
  ),
  faculty(
    '06-correction-inbox.png',
    'Correction inbox',
    'Sample request queue and reason-based correction controls.',
  ),
  faculty(
    '07-teaching-timetable.png',
    'Teaching timetable',
    'Sample timetable with session-start controls.',
  ),
  faculty(
    '08-classroom-map.png',
    'Classroom geofence',
    'Map-selection example and a 50m boundary, not a field test.',
  ),
  faculty(
    '09-live-attendance.png',
    'Live classroom',
    'Actual live-demo interface. The screenshot QR is static and expired; 152 is the fixture cohort.',
  ),
  faculty(
    '10-demo-guide-reminders.png',
    'Reminder preview',
    'Demo guide and reminder preview; no messages were sent.',
  ),
];
export const shotByTitle = (title: string) => screenshots.find((s) => s.title === title)!;
export const imagePath = (image: Screenshot) =>
  `/presentation-media/${image.group === 'student' ? 'student' : 'faculty-admin'}/${image.file}`;
