export type Student = { id: string; name: string; batch: 'AI' | 'CS' };
export type Course = {
  id: string;
  name: string;
  short: string;
  teacher: string;
  teacherId: string;
  color: string;
  room: string;
};
export type Session = {
  id: string;
  courseId: string;
  date: string;
  status: 'open' | 'closed' | 'cancelled';
  lat: number;
  lon: number;
  radius: number;
};
export type CheckIn = { sessionId: string; studentId: string; time: string; distance?: number };
export type Correction = {
  id: number;
  sessionId: string;
  studentId: string;
  present: boolean;
  reason: string;
  time: string;
};
export type Snapshot = { sessions: Session[]; checkIns: CheckIn[]; corrections?: Correction[] };

export const courses: Course[] = [
  {
    id: 'CS3101',
    name: 'Operating Systems',
    short: 'OS',
    teacher: 'Dr. Ananya Sharma',
    teacherId: 'FAC001',
    color: '#8faef1',
    room: 'Academic Block · Room 201',
  },
  {
    id: 'CS3102',
    name: 'Database Management Systems',
    short: 'DBMS',
    teacher: 'Dr. Vikram Rao',
    teacherId: 'FAC002',
    color: '#c4a6e9',
    room: 'Academic Block · Room 202',
  },
  {
    id: 'CS3103',
    name: 'Computer Networks',
    short: 'CN',
    teacher: 'Dr. Meera Iyer',
    teacherId: 'FAC003',
    color: '#7fbfac',
    room: 'Academic Block · Room 203',
  },
  {
    id: 'CS3104',
    name: 'Design and Analysis of Algorithms',
    short: 'DAA',
    teacher: 'Dr. Arjun Mehta',
    teacherId: 'FAC004',
    color: '#deb887',
    room: 'Academic Block · Room 204',
  },
  {
    id: 'CS3105',
    name: 'Software Engineering',
    short: 'SE',
    teacher: 'Dr. Kavita Nair',
    teacherId: 'FAC005',
    color: '#e29bab',
    room: 'Academic Block · Room 205',
  },
  {
    id: 'CS3106',
    name: 'Artificial Intelligence',
    short: 'AI',
    teacher: 'Dr. Rohan Verma',
    teacherId: 'FAC006',
    color: '#86bdcf',
    room: 'Academic Block · Room 206',
  },
];
const firstNames = [
  'Aarav',
  'Aditi',
  'Vihaan',
  'Ananya',
  'Arjun',
  'Diya',
  'Ishaan',
  'Kavya',
  'Reyansh',
  'Meera',
  'Rohan',
  'Isha',
  'Aditya',
  'Saanvi',
  'Kabir',
  'Nandini',
  'Dev',
  'Riya',
  'Aryan',
  'Tanvi',
  'Dhruv',
  'Avni',
  'Kunal',
  'Sneha',
  'Harsh',
  'Priya',
  'Yash',
  'Anika',
  'Nikhil',
  'Shreya',
  'Siddharth',
  'Pooja',
  'Pranav',
  'Manya',
  'Vivek',
  'Tara',
  'Sahil',
  'Neha',
];
const lastNames = [
  'Sharma',
  'Patel',
  'Iyer',
  'Singh',
  'Gupta',
  'Nair',
  'Mehta',
  'Rao',
  'Verma',
  'Joshi',
  'Reddy',
  'Das',
  'Bose',
  'Kapoor',
  'Kulkarni',
  'Khan',
  'Chatterjee',
  'Mishra',
  'Pillai',
  'Saxena',
  'Bhat',
  'Agarwal',
  'Menon',
  'Sinha',
];
export const students: Student[] = (['AI', 'CS'] as const).flatMap((batch, b) =>
  Array.from({ length: batch === 'AI' ? 56 : 96 }, (_, i) => {
    const n = i + b * 56;
    return {
      id: `2401${batch}${String(i + 1).padStart(2, '0')}`,
      name: `${firstNames[n % firstNames.length]} ${lastNames[(Math.floor(n / firstNames.length) + n * 7) % lastNames.length]}`,
      batch,
    };
  }),
);
export const demoInstitution = 'Northfield Institute of Technology';
export const semesterLabel = 'Year 3 · Semester 1';
export function createHistory(): Snapshot {
  const sessions: Session[] = [],
    checkIns: CheckIn[] = [];
  courses.forEach((course, c) => {
    for (let week = 0; week < 12; week++)
      for (let day = 0; day < 2; day++) {
        // Monday/Wednesday, Tuesday/Thursday or Wednesday/Friday; 09:00 IST onwards.
        const date = new Date(Date.UTC(2026, 7, 3 + week * 7 + (c % 3) + day * 2, 3 + (c % 3), 30));
        const id = `history-${course.id}-${week}-${day}`;
        sessions.push({
          id,
          courseId: course.id,
          date: date.toISOString(),
          status: 'closed',
          lat: 25.535,
          lon: 84.851,
          radius: 50,
        });
        students.forEach((student, s) => {
          const target = 14 + ((s * 7 + c * 3) % 11); // 14–24 of 24, with varied course risk.
          const rank = ((week * 2 + day) * 7 + s + c) % 24;
          if (rank < target)
            checkIns.push({
              sessionId: id,
              studentId: student.id,
              time: new Date(date.getTime() + 60_000 + s * 900).toISOString(),
            });
        });
      }
  });
  return { sessions, checkIns };
}
export const history = createHistory();
export const schedule = [
  { time: '09:00', end: '10:00', courseId: 'CS3101', kind: 'Lecture' },
  { time: '10:15', end: '11:15', courseId: 'CS3104', kind: 'Lecture' },
  { time: '11:30', end: '12:30', courseId: 'CS3102', kind: 'Lecture' },
  { time: '14:00', end: '16:00', courseId: 'CS3106', kind: 'Lab' },
];
export const services = [
  { id: 'rides', name: 'Cab sharing', description: 'A better way home', icon: 'Car' },
  { id: 'passes', name: 'Gate passes', description: 'Requests, without the queue', icon: 'Ticket' },
  {
    id: 'complaints',
    name: 'Hostel complaints',
    description: 'Report. Track. Resolve.',
    icon: 'Wrench',
  },
  {
    id: 'lost',
    name: 'Lost & found',
    description: 'Reconnect with your belongings',
    icon: 'Search',
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'The updates that matter',
    icon: 'Megaphone',
  },
  {
    id: 'calendar',
    name: 'Academic calendar',
    description: 'Stay a step ahead',
    icon: 'CalendarDays',
  },
  {
    id: 'leave',
    name: 'Leave & corrections',
    description: 'Make your record right',
    icon: 'FileCheck',
  },
  { id: 'mess', name: 'Mess & feedback', description: 'Today on the menu', icon: 'Utensils' },
  {
    id: 'directory',
    name: 'Campus directory',
    description: 'Find the right person',
    icon: 'Phone',
  },
];
export type ServiceItem = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  detail: string;
};
export function sampleItems(id: string): ServiceItem[] {
  const items: Record<string, ServiceItem[]> = {
    rides: [
      {
        id: 'r1',
        title: 'Campus → Patna Airport',
        subtitle: 'Tomorrow · 06:30 AM · 2 seats available',
        badge: '₹280 / person',
        detail:
          'Aditi Patel · Shared sedan · 2 of 4 seats filled. Meet at the main gate. Fare is an estimate, not a booking or payment.',
      },
      {
        id: 'r2',
        title: 'Campus → Patna Junction',
        subtitle: 'Friday · 04:00 PM · 3 seats available',
        badge: '₹180 / person',
        detail:
          'Arjun Singh · Shared cab · One medium bag per person. Your join request stays in this sample demo.',
      },
    ],
    passes: [
      {
        id: 'p1',
        title: 'Weekend home visit',
        subtitle: 'Submitted 12 Nov · Return 15 Nov',
        badge: 'Approved',
        detail:
          'Sample gate pass GP-2026-0148. Destination: Patna. This is a demo record, not valid permission to leave campus.',
      },
      {
        id: 'p2',
        title: 'Medical appointment',
        subtitle: 'Submitted 16 Nov · 10:00–16:00',
        badge: 'Pending',
        detail:
          'Request received. In a live deployment, this would be routed to the designated approver.',
      },
    ],
    complaints: [
      {
        id: 'h1',
        title: 'Ceiling fan needs repair',
        subtitle: 'Hostel A · Room 214 · 15 Nov',
        badge: 'In progress',
        detail:
          'Maintenance team assigned. Sample timeline: submitted → acknowledged → technician assigned.',
      },
      {
        id: 'h2',
        title: 'Water cooler not dispensing',
        subtitle: 'Hostel A · Second floor · 11 Nov',
        badge: 'Resolved',
        detail: 'Filter replaced and water supply restored. Sample resolution time: 22 hours.',
      },
    ],
    lost: [
      {
        id: 'l1',
        title: 'Found: black wireless earbuds',
        subtitle: 'Library · Reading room · Yesterday',
        badge: 'Found',
        detail:
          'Found near desk 12. In a live app, contact details would be shared through a controlled claim process.',
      },
      {
        id: 'l2',
        title: 'Lost: blue water bottle',
        subtitle: 'Academic Block · Room 203',
        badge: 'Lost',
        detail:
          'A steel blue bottle with a small mountain sticker. Sample listing for the campus lost-and-found board.',
      },
    ],
    announcements: [
      {
        id: 'a1',
        title: 'Mid-semester assessment schedule',
        subtitle: 'Academic office · 2 hours ago',
        badge: 'Academic',
        detail:
          'Assessments begin next Monday. Check the academic calendar for the sample course schedule. Bring your institute ID.',
      },
      {
        id: 'a2',
        title: 'Library extended hours',
        subtitle: 'Library office · Yesterday',
        badge: 'Campus',
        detail:
          'The reading room will remain open until 11 PM during assessment week. This is sample campus information.',
      },
    ],
    calendar: [
      {
        id: 'c1',
        title: 'Operating Systems assessment',
        subtitle: '23 Nov · 09:00 AM · Room 201',
        badge: 'Exam',
        detail: 'Sample syllabus: processes, scheduling, synchronization, and memory management.',
      },
      {
        id: 'c2',
        title: 'Software Engineering project',
        subtitle: '27 Nov · Submission by 11:59 PM',
        badge: 'Deadline',
        detail:
          'Submit the project report and repository link. These dates are sample academic events.',
      },
      {
        id: 'c3',
        title: 'Winter break begins',
        subtitle: '12 Dec · Academic calendar',
        badge: 'Holiday',
        detail:
          'Use cab sharing to coordinate your trip home. Confirm actual dates with your institute.',
      },
    ],
    leave: [
      {
        id: 'v1',
        title: 'Attendance correction · CS3102',
        subtitle: '12 Nov · Submitted with explanation',
        badge: 'Pending',
        detail:
          'Reason: present in class but unable to scan. The teacher can review corrections in the dashboard; this sample request is local only.',
      },
    ],
    mess: [
      {
        id: 'm1',
        title: 'Breakfast · 07:30–09:30',
        subtitle: 'Poha · Boiled eggs · Milk · Banana',
        badge: 'Today',
        detail: 'Vegetarian and non-vegetarian options shown for the sample menu.',
      },
      {
        id: 'm2',
        title: 'Lunch · 12:00–14:00',
        subtitle: 'Rice · Dal tadka · Mixed vegetables · Curd',
        badge: 'Today',
        detail: 'Sample menu. Submit feedback to help improve meal quality.',
      },
      {
        id: 'm3',
        title: 'Dinner · 19:00–21:00',
        subtitle: 'Chapati · Paneer curry · Rice · Salad',
        badge: 'Today',
        detail: 'Sample menu. Dietary needs should be discussed with the mess office.',
      },
    ],
    directory: [
      {
        id: 'd1',
        title: 'Medical centre',
        subtitle: 'Health & wellbeing · Open 24 hours',
        badge: 'Health',
        detail:
          'Demo directory entry. Use your institute’s verified emergency numbers; no sample number is dialled.',
      },
      {
        id: 'd2',
        title: 'Hostel office',
        subtitle: 'Student housing · 09:00–17:00',
        badge: 'Housing',
        detail: 'For room allocation, maintenance follow-up, and hostel-related queries.',
      },
      {
        id: 'd3',
        title: 'Academic office',
        subtitle: 'Academic Block · Ground floor',
        badge: 'Academic',
        detail: 'For registration, exam eligibility, transcripts, and timetable queries.',
      },
    ],
  };
  return items[id] ?? [];
}
