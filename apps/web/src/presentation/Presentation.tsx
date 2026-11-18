import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Car,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Database,
  Expand,
  ExternalLink,
  FileCheck2,
  GalleryHorizontalEnd,
  GraduationCap,
  HelpCircle,
  List,
  MapPin,
  Maximize2,
  Megaphone,
  Minimize2,
  Pause,
  Phone,
  Play,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Ticket,
  Timer,
  Users,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { attendanceMath } from '@oneattend/core';
import {
  apkUrl,
  briefSlides,
  fullSlides,
  imagePath,
  screenshots,
  sections,
  shotByTitle,
  team,
  type Screenshot,
  type SlideId,
} from './content';
import './presentation.css';

type Overlay = 'notes' | 'gallery' | 'evidence' | 'team' | 'help' | 'image' | null;
type Mode = 'full' | 'brief';
const roleKey = 'oneattend-presentation-team-roles-v1';
const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const initialMode: Mode =
  new URLSearchParams(location.search).get('mode') === 'brief' ? 'brief' : 'full';
const initialList = initialMode === 'full' ? fullSlides : briefSlides;
const requested = Number(new URLSearchParams(location.search).get('slide') ?? 1);
const initialSlide =
  initialList[
    Math.max(0, Math.min(initialList.length - 1, Number.isFinite(requested) ? requested - 1 : 0))
  ] ?? initialList[0];

export default function Presentation() {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [slide, setSlide] = useState<SlideId>(initialSlide);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [selectedImage, setSelectedImage] = useState<Screenshot>(screenshots[0]);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'student' | 'faculty'>('all');
  const [studentImage, setStudentImage] = useState(shotByTitle('Course-wise attendance'));
  const [facultyImage, setFacultyImage] = useState(shotByTitle('Student records'));
  const [scenario, setScenario] = useState<'attend' | 'miss'>('attend');
  const [classes, setClasses] = useState(0);
  const [roles, setRoles] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(roleKey) ?? '{}');
    } catch {
      return {};
    }
  });
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [toast, setToast] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const list = mode === 'full' ? fullSlides : briefSlides;
  const index = list.indexOf(slide);
  const current = sections[slide];
  const dark = slide === 'intro' || slide === 'next';
  const apk = import.meta.env.VITE_APK_URL || apkUrl;
  const studentDemo =
    import.meta.env.VITE_STUDENT_DEMO_URL ||
    (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:4174' : null);
  const projected = attendanceMath(14 + (scenario === 'attend' ? classes : 0), 24 + classes);
  const filled = team.filter((name) => roles[name]?.trim()).length;

  function go(id: SlideId) {
    setSlide(id);
  }
  function next() {
    if (index < list.length - 1) go(list[index + 1]);
  }
  function previous() {
    if (index > 0) go(list[index - 1]);
  }
  function switchMode(value: Mode) {
    const nextList = value === 'full' ? fullSlides : briefSlides;
    setMode(value);
    if (!nextList.includes(slide)) setSlide(nextList[0]);
  }
  function showImage(image: Screenshot) {
    setSelectedImage(image);
    setOverlay('image');
  }
  function toggleTimer() {
    if (!running) startedAt.current = Date.now() - elapsed * 1000;
    setRunning((value) => !value);
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen();
      else
        setToast(
          'Fullscreen is unavailable here. Use your browser’s presentation/fullscreen command.',
        );
    } catch {
      setToast('Your browser did not allow fullscreen. The presentation still works normally.');
    }
  }

  useEffect(() => {
    const oldTitle = document.title;
    document.title = 'OneAttend · MVP presentation';
    return () => {
      document.title = oldTitle;
    };
  }, []);
  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    url.searchParams.set('slide', String(index + 1));
    history.replaceState(null, '', url);
    if (stageRef.current) stageRef.current.scrollTop = 0;
  }, [mode, slide, index]);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)),
      500,
    );
    return () => clearInterval(interval);
  }, [running]);
  useEffect(() => {
    const listener = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', listener);
    return () => document.removeEventListener('fullscreenchange', listener);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        overlay ||
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )
        return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        next();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        previous();
      } else if (event.key === 'Home') {
        event.preventDefault();
        go(list[0]);
      } else if (event.key === 'End') {
        event.preventDefault();
        go(list[list.length - 1]);
      } else if (/^[1-9]$/.test(event.key) && list[Number(event.key) - 1])
        go(list[Number(event.key) - 1]);
      else if (event.key.toLowerCase() === 'f') void toggleFullscreen();
      else if (event.key.toLowerCase() === 'n') setOverlay('notes');
      else if (event.key.toLowerCase() === 'g') setOverlay('gallery');
      else if (event.key.toLowerCase() === 't') toggleTimer();
      else if (event.key === '?') setOverlay('help');
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  useEffect(() => {
    if (!overlay) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>('button, input, a[href]')?.focus();
    function handle(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOverlay(null);
      }
      if (event.key === 'Tab' && dialog) {
        const items = [
          ...dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input, a[href], [tabindex="0"]',
          ),
        ].filter((item) => item.getClientRects().length);
        if (!items.length) return;
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0].focus();
        }
      }
    }
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('keydown', handle);
      previousFocus?.focus();
    };
  }, [overlay]);

  const screenshot = (image: Screenshot, className = '') => (
    <button
      className={`deck-shot ${className}`}
      onClick={() => showImage(image)}
      aria-label={`Enlarge ${image.title}`}
    >
      <img src={imagePath(image)} alt={image.title} draggable={false} />
      <span className="deck-shot-hint">
        <Expand size={14} />
        Enlarge
      </span>
    </button>
  );
  const eyebrow = (text: string) => <div className="deck-eyebrow">{text}</div>;
  const evidenceLink = (
    <button className="deck-text-button" onClick={() => setOverlay('evidence')}>
      See the evidence <ArrowUpRight size={15} />
    </button>
  );

  function renderSlide(): ReactNode {
    switch (slide) {
      case 'intro':
        return (
          <div className="deck-slide deck-hero">
            <div className="deck-hero-copy">
              {eyebrow('A student-built campus venture · MVP stage')}
              <h1>
                A clearer picture.
                <br />
                <span>Every class.</span>
              </h1>
              <p className="deck-lead">
                OneAttend connects classroom check-in, faculty records, and student clarity.
              </p>
              <div className="deck-hero-pills">
                <span>
                  <Smartphone size={15} />
                  Android-first
                </span>
                <span>
                  <Users size={15} />
                  Faculty workspace
                </span>
                <span>
                  <Database size={15} />
                  Connected MVP
                </span>
              </div>
              <div className="deck-hero-bottom">
                <span className="deck-tiny-rule" />
                <p>
                  For students who need to know where they stand.
                  <br />
                  For teachers who need less work after class.
                </p>
              </div>
              <button className="deck-start" onClick={next}>
                Explore the story <ArrowRight size={19} />
                <kbd>→</kbd>
              </button>
            </div>
            <div className="deck-hero-product">
              <div className="deck-orbit-label">
                <span />A real interface. A clear purpose.
              </div>
              {screenshot(shotByTitle('Student home'), 'deck-phone hero-phone')}
              <div className="deck-hero-float">
                <Activity size={19} />
                <div>
                  <strong>Know early.</strong>
                  <span>Act before 75% becomes a problem.</span>
                </div>
              </div>
              <div className="deck-image-caption">Browser preview · fictional demo records</div>
            </div>
          </div>
        );
      case 'evidence':
        return (
          <div className="deck-slide deck-evidence-slide">
            <div className="deck-heading">
              <div>
                {eyebrow('Problem identification / verified survey')}
                <h1>
                  Guesswork has
                  <br />
                  <span>a real cost.</span>
                </h1>
              </div>
              <div className="deck-sample">
                <strong>300</strong>
                <span>
                  student survey
                  <br />
                  responses
                </span>
              </div>
            </div>
            <div className="deck-stat-grid">
              {[
                {
                  value: 63,
                  count: 189,
                  title: 'Unsure near the eligibility threshold',
                  description: 'Students unsure about meeting the 75% requirement.',
                },
                {
                  value: 55,
                  count: 165,
                  title: 'Cross-course tracking is difficult',
                  description: 'Students reporting difficult or very difficult tracking.',
                },
                {
                  value: 74,
                  count: 222,
                  title: 'Tracking is not a regular habit',
                  description: 'Students who do not track attendance regularly.',
                },
              ].map((stat) => (
                <article className="deck-survey-stat" key={stat.value}>
                  <Ring value={stat.value} />
                  <h2>{stat.title}</h2>
                  <p>{stat.description}</p>
                  <span>{stat.count} / 300 respondents</span>
                </article>
              ))}
            </div>
            <div className="deck-evidence-bottom">
              <div>
                <span className="deck-count-label">6 faculty responses</span>
                <p>Team-reported input on compilation effort and ease of adoption.</p>
              </div>
              {evidenceLink}
            </div>
            <p className="deck-source">
              Source: uploaded student survey (n=300; 221 IIT Patna responses). Exploratory
              sample—not nationally representative.
            </p>
          </div>
        );
      case 'discovery':
        return (
          <div className="deck-slide">
            <div className="deck-heading">
              {eyebrow('Customer discovery / product decisions')}
              <h1>
                What we heard
                <br />
                <span>shaped what we built.</span>
              </h1>
            </div>
            <div className="deck-discovery-grid">
              <div className="deck-findings">
                <div className="deck-findings-labels">
                  <span>THE NEED</span>
                  <span>OUR RESPONSE</span>
                </div>
                {[
                  ['Uncertainty near 75%', 'Eligibility alerts and a recovery plan'],
                  ['Records scattered across subjects', 'One course-wise student view'],
                  ['Personal tracking is inconsistent', 'Automatic shared attendance records'],
                  [
                    'Faculty need an easy workflow',
                    'Web tools for batches, corrections and reports',
                  ],
                ].map(([need, response], i) => (
                  <div className="deck-finding" key={need}>
                    <span className="deck-small-index">0{i + 1}</span>
                    <strong>{need}</strong>
                    <ArrowRight size={18} />
                    <p>{response}</p>
                  </div>
                ))}
              </div>
              <aside className="deck-adoption">
                <Users size={25} />
                <h2>
                  A focused way
                  <br />
                  to start.
                </h2>
                <p>
                  One faculty champion.
                  <br />
                  One course.
                  <br />
                  An opt-in student group.
                </p>
                <span className="deck-pill">Proposed pilot—not completed acquisition</span>
              </aside>
            </div>
            <div className="deck-principle">
              <span>THE IMPORTANT DISTINCTION</span>
              <p>Problem evidence is not yet proof of payment intent.</p>
              {evidenceLink}
            </div>
          </div>
        );
      case 'flow':
        return (
          <div className="deck-slide">
            <div className="deck-heading deck-heading-inline">
              <div>
                {eyebrow('MVP execution / the connected core')}
                <h1>
                  One session.
                  <br />
                  <span>A shared record.</span>
                </h1>
              </div>
              <a className="deck-btn" href="/" target="_blank" rel="noreferrer">
                Open faculty demo <ExternalLink size={15} />
              </a>
            </div>
            <div className="deck-flow-strip">
              {[
                [MapPin, 'Choose the classroom', 'Map-selected point · 50m boundary'],
                [QrCode, 'Open & display the QR', '3-second rotation · short grace window'],
                [
                  Smartphone,
                  'Scan inside the classroom',
                  'Signature, expiry, distance & duplicates',
                ],
                [FileCheck2, 'Close, review & report', 'Absent marking · audited corrections'],
              ].map(([Glyph, title, detail], i) => {
                const G = Glyph as typeof MapPin;
                return (
                  <div className="deck-flow-step" key={i}>
                    <span className="deck-step-icon">
                      <G size={21} />
                    </span>
                    <strong>{String(title)}</strong>
                    <p>{String(detail)}</p>
                  </div>
                );
              })}
            </div>
            <div className="deck-live-image">{screenshot(shotByTitle('Live session panel'))}</div>
            <div className="deck-flow-footer">
              <span>
                <CheckCheck size={17} />
                Live Supabase signing, duplicate and geofence smoke checks verified.
              </span>
              <span>152 fictional identities · not acquired users</span>
            </div>
            <p className="deck-source">
              Checks used synthetic coordinates. Real classroom GPS reliability remains a separate
              test. Screenshot QR is static and expired.
            </p>
          </div>
        );
      case 'student':
        return (
          <div className="deck-slide deck-student-slide">
            <div className="deck-student-copy">
              {eyebrow('Student experience / insight, not guesswork')}
              <h1>
                Know where you stand.
                <br />
                <span>Know what to do next.</span>
              </h1>
              <p className="deck-lead">
                Every course, one clear record. Early alerts, recovery planning, and the effect of
                your next class.
              </p>
              <div className="deck-example">
                <div className="deck-example-top">
                  <span>TRY A FICTIONAL COURSE RECORD</span>
                  <span>75% required</span>
                </div>
                <div className="deck-example-numbers">
                  <strong>
                    {projected.percentage.toFixed(1)}
                    <small>%</small>
                  </strong>
                  <div>
                    {projected.attended} / {projected.total}
                    <span>classes attended</span>
                  </div>
                </div>
                <div className="deck-example-track">
                  <i style={{ width: `${projected.percentage}%` }} />
                  <span style={{ left: '75%' }} />
                </div>
                <div className="deck-scenario">
                  <div className="deck-segment">
                    <button
                      aria-pressed={scenario === 'attend'}
                      onClick={() => {
                        setScenario('attend');
                        setClasses(0);
                      }}
                    >
                      Attend next
                    </button>
                    <button
                      aria-pressed={scenario === 'miss'}
                      onClick={() => {
                        setScenario('miss');
                        setClasses(0);
                      }}
                    >
                      Miss next
                    </button>
                  </div>
                  <div className="deck-counter">
                    <button
                      aria-label="Decrease future classes"
                      disabled={!classes}
                      onClick={() => setClasses(Math.max(0, classes - 1))}
                    >
                      −
                    </button>
                    <strong>{classes}</strong>
                    <button
                      aria-label="Increase future classes"
                      disabled={classes >= 20}
                      onClick={() => setClasses(Math.min(20, classes + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className={projected.eligible ? 'deck-positive' : ''}>
                  {projected.eligible
                    ? 'At or above 75%.'
                    : `Needs ${projected.needed} consecutive attended classes to reach 75%.`}
                </p>
                <button
                  className="deck-text-button"
                  onClick={() => {
                    setScenario('attend');
                    setClasses(16);
                  }}
                >
                  Show the 16-class recovery <ArrowRight size={14} />
                </button>
              </div>
            </div>
            <div className="deck-student-showcase">
              <div className="deck-shot-tabs">
                {[
                  'Course-wise attendance',
                  'Recovery & what-if planner',
                  'Weekly trends',
                  'Attendance calendar',
                ].map((title) => (
                  <button
                    key={title}
                    aria-pressed={studentImage.title === title}
                    onClick={() => setStudentImage(shotByTitle(title))}
                  >
                    {title === 'Course-wise attendance'
                      ? 'Courses'
                      : title === 'Recovery & what-if planner'
                        ? 'Recovery'
                        : title === 'Weekly trends'
                          ? 'Trends'
                          : 'Calendar'}
                  </button>
                ))}
              </div>
              {screenshot(studentImage, 'deck-phone')}
              <p className="deck-image-caption">Actual browser preview · seeded records</p>
            </div>
          </div>
        );
      case 'faculty':
        return (
          <div className="deck-slide">
            <div className="deck-heading deck-heading-inline">
              <div>
                {eyebrow('Faculty experience / operations')}
                <h1>
                  Built for the work
                  <br />
                  <span>after class.</span>
                </h1>
              </div>
              <button className="deck-btn" onClick={() => setOverlay('team')}>
                <Users size={16} />
                Team contributions <span className="deck-mini-count">{filled}/7</span>
              </button>
            </div>
            <div className="deck-faculty-layout">
              <div>
                <div className="deck-shot-tabs">
                  {[
                    'Student records',
                    'Shortage list',
                    'Reports & insights',
                    'Correction inbox',
                    'Teaching timetable',
                  ].map((title) => (
                    <button
                      key={title}
                      aria-pressed={facultyImage.title === title}
                      onClick={() => setFacultyImage(shotByTitle(title))}
                    >
                      {title === 'Reports & insights'
                        ? 'Reports'
                        : title === 'Correction inbox'
                          ? 'Corrections'
                          : title === 'Teaching timetable'
                            ? 'Timetable'
                            : title}
                    </button>
                  ))}
                </div>
                <div className="deck-browser">
                  <div className="deck-browser-bar">
                    <i />
                    <i />
                    <i />
                    <span>OneAttend / Faculty workspace</span>
                    <ShieldCheck size={14} />
                  </div>
                  {screenshot(facultyImage)}
                </div>
              </div>
              <div className="deck-faculty-benefits">
                {[
                  [Search, 'Find the record', 'Search students and filter batches.'],
                  [Activity, 'See who needs attention', 'Course shortages and recovery counts.'],
                  [FileCheck2, 'Correct with context', 'Reasons and persistent audit history.'],
                  [
                    ArrowDownToLine,
                    'Finish the reporting',
                    'CSV exports and print-to-PDF reports.',
                  ],
                ].map(([Glyph, title, body], i) => {
                  const G = Glyph as typeof Search;
                  return (
                    <article key={i}>
                      <G size={22} />
                      <div>
                        <h2>{String(title)}</h2>
                        <p>{String(body)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <p className="deck-source">
              These tools aim to reduce manual work. Time savings have not yet been measured in a
              classroom pilot.
            </p>
          </div>
        );
      case 'campus':
        return (
          <div className="deck-slide">
            <div className="deck-heading deck-heading-inline">
              <div>
                {eyebrow('Campus experience / useful adjacent services')}
                <h1>
                  Useful beyond
                  <br />
                  <span>the classroom.</span>
                </h1>
              </div>
              <span className="deck-pill">
                <GraduationCap size={16} />
                Interactive sample workflows
              </span>
            </div>
            <div className="deck-campus-grid">
              {[
                [CalendarDays, 'Student timetable', 'Your week, organised.'],
                [Car, 'Cab sharing', 'A better way home.'],
                [Ticket, 'Gate passes', 'Requests without the queue.'],
                [Wrench, 'Hostel complaints', 'Report. Track. Resolve.'],
                [Search, 'Lost & found', 'Reconnect with your belongings.'],
                [Megaphone, 'Announcements', 'The updates that matter.'],
                [CalendarDays, 'Academic calendar', 'Stay a step ahead.'],
                [FileCheck2, 'Leave & correction requests', 'Make your record right.'],
                [Utensils, 'Mess & feedback', 'Today on the menu.'],
                [Phone, 'Campus directory', 'Find the right person.'],
              ].map(([Glyph, title, detail], i) => {
                const G = Glyph as typeof Car;
                return (
                  <button
                    className="deck-campus-card"
                    key={i}
                    onClick={() => showImage(shotByTitle(String(title)))}
                  >
                    <span>
                      <G size={24} />
                    </span>
                    <h2>
                      {String(
                        title === 'Student timetable'
                          ? 'Timetable'
                          : title === 'Leave & correction requests'
                            ? 'Leave & corrections'
                            : title,
                      )}
                    </h2>
                    <p>{String(detail)}</p>
                    <ArrowUpRight size={16} />
                  </button>
                );
              })}
            </div>
            <div className="deck-campus-bottom">
              <p>
                Attendance is the connected core.
                <br />
                Campus-service screens show the intended experience—not real approvals or bookings.
              </p>
              <button
                className="deck-text-button"
                onClick={() => {
                  setGalleryFilter('student');
                  setOverlay('gallery');
                }}
              >
                Explore student screens <GalleryHorizontalEnd size={17} />
              </button>
            </div>
          </div>
        );
      case 'model':
        return (
          <div className="deck-slide">
            <div className="deck-heading">
              {eyebrow('Business model / a hypothesis to test')}
              <h1>
                Free to check in.
                <br />
                <span>A simple plan for clarity.</span>
              </h1>
            </div>
            <div className="deck-model-grid">
              <article className="deck-price-card">
                <span>PROPOSED STUDENT PLAN</span>
                <div className="deck-price">
                  <strong>₹9</strong>
                  <span>/ month</span>
                </div>
                <h2>OneAttend Insights</h2>
                <ul>
                  <li>
                    <Check size={16} />
                    Course-wise attendance records
                  </li>
                  <li>
                    <Check size={16} />
                    Eligibility and recovery planning
                  </li>
                  <li>
                    <Check size={16} />
                    Trends, history and what-if analysis
                  </li>
                </ul>
                <p>Check-in and campus services remain free.</p>
                <span className="deck-price-tag">Price hypothesis · no payment integration</span>
              </article>
              <div className="deck-institute-model">
                <div>
                  <Users size={24} />
                  <h2>Institutions</h2>
                  <p>Per-student licensing for shared records and faculty reporting.</p>
                  <span>Institutional pilot pricing is still to be defined.</span>
                </div>
                <div>
                  <Database size={24} />
                  <h2>Measure before scaling</h2>
                  <p>Infrastructure use, security, maintenance and support per active student.</p>
                  <span>Free-tier MVP infrastructure is not proof of production costs.</span>
                </div>
                <div className="deck-next-test">
                  <span>NEXT COMMERCIAL EXPERIMENT</span>
                  <p>
                    A clear ₹9 offer. A defined audience.
                    <br />
                    Measured interest—then real willingness to pay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'next':
        return (
          <div className="deck-slide deck-closing">
            <div className="deck-closing-head">
              {eyebrow('Learning / the next proof point')}
              <h1>
                A record both sides
                <br />
                <span>can trust.</span>
              </h1>
              <p>
                We have evidence of the problem and a connected MVP.
                <br />
                The next step is a focused classroom pilot.
              </p>
            </div>
            <div className="deck-learning-grid">
              <article>
                <span>01 / THE LEARNING</span>
                <h2>
                  Prove the need.
                  <br />
                  Then test the demand.
                </h2>
                <p>
                  The survey supports the problem. Pricing and access policy need their own
                  experiment.
                </p>
              </article>
              <article>
                <span>02 / THE PRODUCT</span>
                <h2>
                  Design for faculty,
                  <br />
                  not just students.
                </h2>
                <p>
                  A useful student view depends on a record teachers can maintain with fewer steps.
                </p>
              </article>
              <article>
                <span>03 / THE NEXT TEST</span>
                <h2>
                  Take it into
                  <br />
                  one real classroom.
                </h2>
                <p>
                  Measure check-in success, corrections and faculty effort before wider deployment.
                </p>
              </article>
            </div>
            <div className="deck-closing-bottom">
              <div>
                <span className="deck-pilot-line">
                  <i />
                  ONE COURSE → ONE FACULTY MEMBER → OPT-IN STUDENTS
                </span>
                <p>
                  Success is not more features.
                  <br />
                  It is a shared record people can rely on.
                </p>
              </div>
              <div className="deck-apk">
                <div>
                  <a
                    href={apk}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Download OneAttend Android APK"
                  >
                    <QRCodeSVG
                      value={apk}
                      size={78}
                      marginSize={1}
                      bgColor="#ffffff"
                      fgColor="#152239"
                    />
                  </a>
                </div>
                <span>
                  Scan for the Android demo
                  <br />
                  <small>Build 0.1.0 · internet required</small>
                </span>
              </div>
            </div>
            <p className="deck-source">
              QR links to this specific Expo-hosted APK (listed build expiry: 2 Dec 2026). Classroom
              GPS testing is separate from server checks.
            </p>
          </div>
        );
    }
  }

  return (
    <div ref={rootRef} className="deck" data-tone={dark ? 'dark' : 'light'}>
      <header className="deck-header">
        <a className="deck-brand" href="/presentation" aria-label="OneAttend presentation home">
          <span>
            <CheckCheck size={22} />
          </span>
          OneAttend<span className="deck-brand-dot">.</span>
        </a>
        <div className="deck-course-label">
          INNOVATION & ENTREPRENEURSHIP <i /> HS3108 <i /> TEAM C
        </div>
        <div className="deck-header-actions">
          <span className="deck-status">
            <i />
            MVP showcase
          </span>
          <button aria-label="Presentation help" onClick={() => setOverlay('help')}>
            <HelpCircle size={18} />
          </button>
        </div>
      </header>
      <div className="deck-body">
        <nav className="deck-rail" aria-label="Presentation slides">
          {list.map((id, i) => (
            <button
              key={id}
              className={slide === id ? 'active' : ''}
              aria-current={slide === id ? 'step' : undefined}
              aria-label={`Slide ${i + 1}: ${sections[id].label}`}
              title={sections[id].label}
              onClick={() => go(id)}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              <i />
            </button>
          ))}
        </nav>
        <main
          ref={stageRef}
          className="deck-stage"
          aria-label={`Slide ${index + 1}: ${current.title}`}
        >
          <div key={slide} className="deck-scene">
            {renderSlide()}
          </div>
        </main>
      </div>
      <footer className="deck-footer">
        <div className="deck-footer-tools">
          <button
            onClick={() => setOverlay('notes')}
            aria-label="Open speaker notes"
            title="Speaker notes (N)"
          >
            <BookOpen size={17} />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setOverlay('gallery')}
            aria-label="Open screenshot gallery"
            title="Screenshot gallery (G)"
          >
            <GalleryHorizontalEnd size={17} />
            <span>Screens</span>
          </button>
          <button
            onClick={() => setOverlay('team')}
            aria-label="Edit team contributions"
            title="Add genuine individual contributions"
          >
            <Users size={17} />
            <span>Team</span>
          </button>
          <button
            onClick={() => void toggleFullscreen()}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title="Fullscreen (F)"
          >
            {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
        <div className="deck-navigation">
          <button aria-label="Previous slide" disabled={!index} onClick={previous}>
            <ChevronLeft size={20} />
          </button>
          <div className="deck-slide-count">
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <span>/ {String(list.length).padStart(2, '0')}</span>
            <small>{current.label}</small>
          </div>
          <button aria-label="Next slide" disabled={index === list.length - 1} onClick={next}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="deck-footer-options">
          <button
            className={elapsed >= 600 ? 'deck-clock overtime' : 'deck-clock'}
            onClick={toggleTimer}
            aria-label={running ? 'Pause rehearsal timer' : 'Start rehearsal timer'}
            title="Rehearsal timer (T)"
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            <span>{time(elapsed)}</span>
          </button>
          <label className="deck-mode">
            <List size={14} />
            <select
              value={mode}
              onChange={(event) => switchMode(event.target.value as Mode)}
              aria-label="Presentation length"
            >
              <option value="full">Full story · 9 slides</option>
              <option value="brief">Condensed · 5 slides</option>
            </select>
          </label>
        </div>
      </footer>
      <div className="deck-progress" aria-hidden="true">
        <i style={{ transform: `scaleX(${(index + 1) / list.length})` }} />
      </div>
      {toast && (
        <div className="deck-toast" role="status">
          {toast}
          <button onClick={() => setToast('')} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      )}
      {overlay && (
        <div className="deck-overlay" onClick={() => setOverlay(null)}>
          <div
            ref={dialogRef}
            className={`deck-dialog ${overlay === 'image' ? 'deck-image-dialog' : overlay === 'gallery' ? 'deck-gallery-dialog' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              overlay === 'notes'
                ? 'Speaker notes'
                : overlay === 'gallery'
                  ? 'Screenshot gallery'
                  : overlay === 'evidence'
                    ? 'Survey evidence'
                    : overlay === 'team'
                      ? 'Team contributions'
                      : overlay === 'image'
                        ? selectedImage.title
                        : 'Presentation help'
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div className="deck-dialog-head">
              <div>
                <span>
                  {overlay === 'image' ? 'ACTUAL MVP INTERFACE' : 'PRESENTATION WORKSPACE'}
                </span>
                <h2>
                  {overlay === 'notes'
                    ? current.label
                    : overlay === 'gallery'
                      ? 'A closer look at OneAttend.'
                      : overlay === 'evidence'
                        ? 'The numbers behind the story.'
                        : overlay === 'team'
                          ? 'Every contribution matters.'
                          : overlay === 'image'
                            ? selectedImage.title
                            : 'Make the presentation your own.'}
                </h2>
              </div>
              <button onClick={() => setOverlay(null)} aria-label="Close presentation dialog">
                <X size={22} />
              </button>
            </div>
            {overlay === 'notes' && (
              <div className="deck-notes">
                <div className="deck-notes-meta">
                  <span>
                    <Timer size={16} />
                    Suggested pace:{' '}
                    {mode === 'brief'
                      ? time([75, 110, 145, 95, 100][index])
                      : time(current.seconds)}
                  </span>
                  <button className="deck-text-button" onClick={toggleTimer}>
                    {running ? 'Pause' : 'Start'} rehearsal timer
                  </button>
                </div>
                {current.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
                <a
                  href="/presentation-files/OneAttend_Presenter_Notes.md"
                  download
                  className="deck-text-button"
                >
                  Download full talk tracks and Q&A notes <ArrowDownToLine size={15} />
                </a>
              </div>
            )}
            {overlay === 'evidence' && (
              <div className="deck-evidence-dialog">
                <div className="deck-evidence-summary">
                  <strong>300</strong>
                  <span>verified student responses</span>
                  <strong>6</strong>
                  <span>
                    faculty responses
                    <br />
                    <small>Team-reported</small>
                  </span>
                </div>
                <EvidenceRow
                  title="Uncertainty about meeting 75%"
                  answer="189 yes · 111 no"
                  percent={63}
                />
                <EvidenceRow
                  title="Cross-course tracking difficulty"
                  answer="105 difficult + 60 very difficult · 79 neutral · 56 very easy"
                  percent={55}
                />
                <EvidenceRow
                  title="Attendance is not tracked regularly"
                  answer="86 no + 76 sometimes + 60 rarely · 78 regularly"
                  percent={74}
                />
                <div className="deck-evidence-note">
                  <strong>Read the denominator correctly.</strong>
                  <p>
                    221 responses were from IIT Patna; 79 were from other listed colleges. This was
                    an exploratory convenience sample. Survey participation is not acquisition, and
                    problem evidence is not payment validation.
                  </p>
                  <p>
                    Source: the uploaded survey workbook. No faculty dataset was supplied, so
                    faculty themes and count remain team-reported.
                  </p>
                </div>
                <a
                  href="/presentation-media/research-evidence.json"
                  download
                  className="deck-text-button"
                >
                  Download aggregate evidence <ArrowDownToLine size={15} />
                </a>
              </div>
            )}
            {overlay === 'team' && (
              <div className="deck-team">
                <p>
                  Add only actual contributions. Changes are saved on this browser, not to a shared
                  team account.
                </p>
                <div>
                  {team.map((name) => (
                    <label key={name}>
                      <span>{name}</span>
                      <input
                        value={roles[name] ?? ''}
                        placeholder="Actual contribution (e.g. survey collection)"
                        onChange={(event) =>
                          setRoles((values) => ({ ...values, [name]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <button
                  className="deck-btn primary"
                  onClick={() => {
                    try {
                      localStorage.setItem(roleKey, JSON.stringify(roles));
                      setToast('Team contributions saved on this browser.');
                      setOverlay(null);
                    } catch {
                      setToast('Could not save roles. Your browser may block local storage.');
                    }
                  }}
                >
                  <Check size={17} />
                  Save contributions
                </button>
                <p className="deck-small-note">
                  The source PPTX has separate role placeholders. Editing here does not change that
                  file.
                </p>
              </div>
            )}
            {overlay === 'help' && (
              <div className="deck-help">
                <div className="deck-shortcuts">
                  {[
                    ['← / →', 'Previous / next slide'],
                    ['1–9', 'Jump to a slide'],
                    ['F', 'Fullscreen'],
                    ['N', 'Speaker notes'],
                    ['G', 'Screenshot gallery'],
                    ['T', 'Rehearsal timer'],
                    ['Esc', 'Close an overlay'],
                  ].map(([key, action]) => (
                    <div key={key}>
                      <kbd>{key}</kbd>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
                <div className="deck-help-resources">
                  <a
                    className="deck-btn"
                    href="/presentation-files/OneAttend_MVP_Final.pptx"
                    download
                  >
                    <ArrowDownToLine size={17} />
                    Download PPTX backup
                  </a>
                  <a className="deck-btn" href="/" target="_blank" rel="noreferrer">
                    <Users size={17} />
                    Faculty demo <ExternalLink size={14} />
                  </a>
                  {studentDemo && (
                    <a className="deck-btn" href={studentDemo} target="_blank" rel="noreferrer">
                      <Smartphone size={17} />
                      Student preview <ExternalLink size={14} />
                    </a>
                  )}
                  <a className="deck-btn primary" href={apk} target="_blank" rel="noreferrer">
                    <Smartphone size={17} />
                    Android APK <ExternalLink size={14} />
                  </a>
                </div>
                <p>
                  Nine slides tell the full story; condensed mode keeps five core sections. Your
                  uploaded guidelines require PPTX and specify five slides, so retain the backup
                  unless your professor approves website delivery.
                </p>
                <p>
                  Student demo code: <code>student123</code>. Screenshots contain fictional records;
                  campus services are sample workflows. Real-device GPS testing must be reported
                  separately.
                </p>
                <div className="deck-timer-reset">
                  <span>Rehearsal: {time(elapsed)}</span>
                  <button
                    className="deck-text-button"
                    onClick={() => {
                      setRunning(false);
                      setElapsed(0);
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset timer
                  </button>
                </div>
              </div>
            )}
            {overlay === 'gallery' && (
              <div className="deck-gallery">
                <div className="deck-gallery-tabs">
                  {(['all', 'student', 'faculty'] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={galleryFilter === value}
                      onClick={() => setGalleryFilter(value)}
                    >
                      {value === 'all'
                        ? 'All screens'
                        : value === 'student'
                          ? 'Student'
                          : 'Faculty'}
                    </button>
                  ))}
                </div>
                <p>
                  Original browser-preview screenshots. Fictional records, not native-device or
                  adoption evidence.
                </p>
                <div className="deck-gallery-grid">
                  {screenshots
                    .filter((image) => galleryFilter === 'all' || image.group === galleryFilter)
                    .map((image) => (
                      <button key={image.file + image.group} onClick={() => showImage(image)}>
                        <div>
                          <img src={imagePath(image)} alt={image.title} loading="lazy" />
                        </div>
                        <strong>{image.title}</strong>
                        <span>
                          {image.group === 'student' ? 'Student interface' : 'Faculty workspace'}
                          <ArrowUpRight size={13} />
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
            {overlay === 'image' && (
              <div className="deck-image-viewer">
                <img src={imagePath(selectedImage)} alt={selectedImage.title} />
                <div>
                  <p>{selectedImage.caption}</p>
                  <button className="deck-text-button" onClick={() => setOverlay('gallery')}>
                    <ArrowLeft size={14} />
                    All screenshots
                  </button>
                  <a className="deck-text-button" href={imagePath(selectedImage)} download>
                    Download PNG <ArrowDownToLine size={15} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const radius = 59,
    circumference = 2 * Math.PI * radius;
  return (
    <div className="deck-ring">
      <svg viewBox="0 0 136 136" aria-hidden="true">
        <circle cx="68" cy="68" r={radius} fill="none" stroke="currentColor" strokeWidth="7" />
        <circle
          cx="68"
          cy="68"
          r={radius}
          fill="none"
          stroke="var(--p-accent)"
          strokeWidth="7"
          strokeDasharray={`${(circumference * value) / 100} ${circumference}`}
          transform="rotate(-90 68 68)"
          strokeLinecap="round"
        />
      </svg>
      <strong>
        {value}
        <span>%</span>
      </strong>
    </div>
  );
}
function EvidenceRow({
  title,
  answer,
  percent,
}: {
  title: string;
  answer: string;
  percent: number;
}) {
  return (
    <div className="deck-evidence-row">
      <div>
        <h3>{title}</h3>
        <p>{answer}</p>
      </div>
      <strong>{percent}%</strong>
      <div>
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
