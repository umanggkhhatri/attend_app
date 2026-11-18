"""Generate the editable, five-slide OneAttend MVP presentation.

Uses python-pptx and Pillow. Screenshots are captured by presentation-capture.mjs.
Survey statistics are read from the uploaded workbook, not invented.
Run from the repository root with a Python environment containing the dependencies.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from collections import Counter
import json
import re
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent
ASSETS = OUT / 'OneAttend_Presentation_Assets'
ASSETS.mkdir(exist_ok=True)
PPTX = OUT / 'OneAttend_MVP_Final.pptx'
NOTES = OUT / 'OneAttend_Presenter_Notes.md'
BG, INK, MUTED = 'F7F8FA', '192C43', '596B7F'
BLUE, PALE, LINE, WHITE = '376BCE', 'E8EEF7', 'D5DEEA', 'FFFFFF'
TEAL = '247F6C'
W, H, DPI = 13.333333, 7.5, 144
FONT_DIR = Path('/System/Library/Fonts/Supplemental')
REGULAR = FONT_DIR / 'Arial.ttf'
BOLD = FONT_DIR / 'Arial Bold.ttf'
prs = Presentation()
prs.slide_width, prs.slide_height = Inches(W), Inches(H)
prs.core_properties.title = 'OneAttend — MVP-stage venture presentation'
prs.core_properties.subject = 'HS3108 Innovation & Entrepreneurship'
prs.core_properties.author = 'Team C'
prs.core_properties.keywords = 'OneAttend, attendance, MVP, student survey, faculty dashboard'
prs.core_properties.comments = '300 verified student survey responses. Faculty count team-reported. Individual roles must be completed by the team.'
scenes, speaker_notes, validation = [], [], []


def survey_counts():
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with ZipFile(OUT / 'survey.xlsx') as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(t.text or '' for t in item.findall('.//s:t', ns)) for item in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', ns)]
        rows = []
        for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('s:sheetData/s:row', ns):
            values = {}
            for cell in row.findall('s:c', ns):
                column = re.sub(r'\d', '', cell.attrib['r'])
                value = cell.find('s:v', ns)
                if cell.attrib.get('t') == 's' and value is not None:
                    text = strings[int(value.text)]
                elif cell.attrib.get('t') == 'inlineStr':
                    text = ''.join(t.text or '' for t in cell.findall('.//s:t', ns))
                else:
                    text = value.text if value is not None else ''
                values[column] = (text or '').strip()
            if any(values.values()):
                rows.append(values)
    answers = rows[1:]
    n = len(answers)
    unsure = Counter(r.get('G') for r in answers)['Yes']
    difficulty = Counter(r.get('F') for r in answers)
    difficult = difficulty['Difficult'] + difficulty['Very difficult']
    tracking = Counter(r.get('D') for r in answers)
    irregular = n - tracking['Yes , regularly']
    iitp = Counter(r.get('B') for r in answers)['IITP']
    assert (n, unsure, difficult, irregular, iitp) == (300, 189, 165, 222, 221), 'Survey changed: update narrative before generating.'
    return {'responses': n, 'unsure': unsure, 'difficult': difficult, 'irregular': irregular, 'iitp': iitp}


stats = survey_counts()


def rgb(color):
    return RGBColor.from_string(color)


def box(slide, x, y, w, h, color, border=None, rounded=False, name='Panel'):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.name = name
    shape.fill.solid()
    shape.fill.fore_color.rgb = rgb(color)
    if border:
        shape.line.color.rgb = rgb(border)
        shape.line.width = Pt(.7)
    else:
        shape.line.fill.background()
    if rounded:
        shape.adjustments[0] = .12
    scenes[-1].append({'kind': 'box', 'rect': (x, y, w, h), 'color': color, 'border': border, 'rounded': rounded})
    return shape


def text(slide, content, x, y, w, h, size=18, color=INK, bold=False, align='left', name=None):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    if name:
        shape.name = name
    tf = shape.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
    tf.vertical_anchor = MSO_ANCHOR.TOP
    for index, paragraph in enumerate(content.split('\n')):
        p = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        p.text = paragraph
        p.font.name, p.font.size = 'Arial', Pt(size)
        p.font.bold, p.font.color.rgb = bold, rgb(color)
        p.space_before, p.space_after = Pt(0), Pt(0)
        p.line_spacing = 1.13
        p.alignment = {'left': PP_ALIGN.LEFT, 'center': PP_ALIGN.CENTER, 'right': PP_ALIGN.RIGHT}[align]
    scenes[-1].append({'kind': 'text', 'text': content, 'rect': (x, y, w, h), 'size': size, 'color': color, 'bold': bold, 'align': align})
    return shape


def rule(slide, x, y, w, color=LINE):
    return box(slide, x, y, w, .009, color, name='Divider')


def stroke(slide, x1, y1, x2, y2, color=INK, width=1.6):
    shape=slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    shape.line.color.rgb=rgb(color)
    shape.line.width=Pt(width)
    scenes[-1].append({'kind':'stroke','rect':(min(x1,x2),min(y1,y2),abs(x2-x1),abs(y2-y1)),'points':(x1,y1,x2,y2),'color':color,'width':width})
    return shape


def picture(slide, filename, x, y, w, h=None, caption=None):
    path = ASSETS / filename
    iw, ih = Image.open(path).size
    if h is None:
        h = w * ih / iw
    shape = slide.shapes.add_picture(str(path), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    shape.name = caption or filename
    shape._element.xpath('.//p:cNvPr')[0].set('descr', caption or filename)
    scenes[-1].append({'kind': 'picture', 'path': str(path), 'rect': (x, y, w, h)})
    return shape


def label(slide, value, x, y, w=8, color=BLUE):
    return text(slide, value.upper(), x, y, w, .22, 10, color, True)


def new_slide(section, number, title, subtitle=None):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    scenes.append([])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = rgb(BG)
    box(slide, .65, .42, .31, .31, '9BB8EC', rounded=True, name='Brand mark')
    stroke(slide,.714,.574,.762,.623)
    stroke(slide,.762,.623,.888,.487)
    stroke(slide,.815,.599,.844,.627)
    stroke(slide,.844,.627,.925,.535)
    text(slide, 'OneAttend.', 1.08, .405, 3.1, .36, 19, INK, True, name='Brand')
    text(slide, section.upper(), 8.35, .45, 4.32, .23, 10, MUTED, False, 'right')
    rule(slide, .65, .86, 12.03)
    text(slide, title, .65, 1.15, 12.1, 1.04 if '\n' in title else .56, 31, INK, True, name='Slide title')
    if subtitle:
        text(slide, subtitle, .68, 1.82, 11.8, .45, 16, MUTED)
    rule(slide, .65, 7.03, 12.03)
    text(slide, 'HS3108  /  Innovation & Entrepreneurship  /  Team C', .65, 7.14, 10, .2, 9, MUTED)
    text(slide, f'{number:02d} / 05', 11.9, 7.11, .78, .23, 10, MUTED, False, 'right')
    return slide


def notes(slide, heading, timing, content):
    body = f'{heading}\nSuggested time: {timing}\n\n{content}'
    slide.notes_slide.notes_text_frame.text = body
    speaker_notes.append((heading, timing, content))


# 1 — Venture overview: start with the lived problem, not a feature inventory.
s = new_slide('MVP-stage venture overview', 1, 'Your attendance\nshould not be a guess.')
text(s, 'Students juggle separate records.\nTeachers end up compiling them again.', .7, 2.5, 7.55, .8, 21, MUTED)
label(s, 'Our value proposition', .7, 3.61)
text(s, 'One shared record. A clear next step.', .7, 3.98, 7.6, .48, 24, INK, True)
text(s, 'A rotating QR check-in feeds the faculty dashboard.\nStudents see each course’s status and a recovery plan.', .7, 4.58, 7.6, .75, 18)
box(s, .67, 5.63, 7.76, .78, INK, rounded=True)
text(s, 'Know early. Act before 75% becomes a problem.', .91, 5.84, 7.24, .35, 19, WHITE, True)
text(s, 'For attendance-bound students and faculty managing large batches.', .7, 6.59, 8.0, .27, 13, MUTED)
box(s, 9.1, 1.15, 2.7, 5.62, INK, rounded=True, name='Student screenshot frame')
picture(s, 'student-home.png', 9.17, 1.21, 2.56, caption='Authentic student browser preview; fictional demo records, not customer traction.')
text(s, 'Student browser preview · fictional demo records', 8.65, 6.86, 3.65, .16, 8.5, MUTED, False, 'center')
notes(s, '1. Problem, opportunity and venture overview', '1 minute 15 seconds',
"""Start with a simple observation: students should not have to guess whether they can sit an exam. Today, attendance may sit in paper registers, individual teacher QR systems, and personal trackers. That creates two jobs: students keep trying to reconstruct their percentage, and faculty compile records again.

OneAttend is our MVP response: a shared faculty-managed record, plus a student view that explains what to do next. The main value is not merely taking a scan. It is making attendance understandable early enough to act.

Point to the screenshot. It is a real screenshot of the student frontend connected to our live demo backend. The displayed student and records are deliberately fictional; they are not evidence of users acquired. The interface is Android-first, but the screenshot is from its browser preview. The Android APK was queued at preparation time; verify its current status before presenting.

The professor approved an MVP-stage presentation. Do not call this a completed institutional launch or claim paying customers. Campus features include timetable, cab sharing, gate passes, hostel complaints, lost and found, announcements, calendar, leave/corrections, mess feedback and directory. These are sample workflows; attendance is the live connected core.""")


# 2 — Verified discovery evidence and a direct finding-to-product connection.
s = new_slide('Customer discovery & validation', 2, '300 responses. One clear problem.')
figures = [
    ('63%', 'Unsure about meeting\nthe 75% requirement', '189 of 300 responses'),
    ('55%', 'Tracking across courses\nis difficult or very difficult', '165 of 300 responses'),
    ('74%', 'Do not track their\nattendance regularly', '222 of 300 responses'),
]
for i, (value, description, count) in enumerate(figures):
    x = .7 + i * 4.12
    box(s, x, 2.06, 3.88, 1.63, WHITE, border=LINE, rounded=True)
    box(s, x + .2, 2.24, .045, 1.22, BLUE)
    text(s, value, x + .4, 2.19, 3.15, .67, 40, BLUE, True)
    text(s, description, x + .4, 2.93, 3.15, .52, 16)
    text(s, count, x + .4, 3.43, 3.14, .24, 11, MUTED)
label(s, 'What we heard', .78, 4.0, 5)
label(s, 'What we built', 7.12, 4.0, 5)
for i, (finding, response) in enumerate([
    ('Uncertainty near the eligibility threshold', 'Alerts + classes-needed recovery planning'),
    ('Attendance scattered across subjects', 'One course-wise student view'),
    ('Personal tracking is not a regular habit', 'Automatic shared attendance records'),
]):
    y = 4.4 + i * .52
    text(s, finding, .78, y, 5.58, .32, 16.5)
    text(s, '→', 6.44, y - .01, .4, .34, 19, BLUE, True)
    text(s, response, 7.12, y, 5.42, .35, 16.5)
    rule(s, .78, y + .41, 11.77)
box(s, .7, 6.08, 11.95, .61, PALE, rounded=True)
text(s, '6 faculty responses', .91, 6.23, 2.75, .29, 18, INK, True)
text(s, 'Team-reported input: compilation effort and ease of adoption.', 3.72, 6.25, 8.52, .31, 14, MUTED)
text(s, 'Source: survey.xlsx (n=300; 221 IIT Patna responses). Exploratory sample; validates the problem, not payment intent.', .74, 6.83, 11.9, .17, 9.1, MUTED)
notes(s, '2. Customer discovery and market validation', '1 minute 50 seconds',
"""We initially discussed a larger response count, but the uploaded spreadsheet contains exactly 300 completed student rows. We use that verified count rather than overstating the sample.

The three percentages come directly from the workbook: 189 answered yes to uncertainty about meeting 75%; 105 said tracking across courses is difficult and 60 said very difficult, giving 165; only 78 tracked regularly, so the remaining 222 did not. The original 63% draft figure is now supported by the uploaded data.

221 respondents identified their college as IITP. The remaining respondents listed several other colleges, with spelling variants. This was an exploratory convenience sample, not a representative national study. Say '300 survey responses', not '300 interviews' or '300 acquired customers'.

The team reports six faculty responses. Earlier course submissions describe manual compilation and concerns about technical ease of use. No faculty-response spreadsheet was uploaded, so do not quote a faculty percentage or claim all six said the same thing.

Explain the product decisions using the arrows: uncertainty led to threshold/recovery tools; scattered records led to a course-wise view; irregular manual tracking reinforced automatic shared records. The evidence establishes the problem, but not willingness to pay or product-market fit.

Proposed pilot acquisition: recruit one faculty champion for one course and onboard an opt-in student cohort. This is the next step, not an activity already completed. If asked about the guidelines' 20-interview requirement, do not relabel surveys as interviews; explain the actual research conducted and the approved MVP-stage scope.""")


# 3 — Real operations screenshot, explicit demo scope, editable individual contributions.
s = new_slide('MVP execution & operations', 3, 'Built to reduce the work after class.', 'Faculty web dashboard + Android-first student frontend + live demo backend')
steps = [
    ('01', 'Choose point. Open session.', 'Map-selected classroom · 50m radius'),
    ('02', 'Scan inside the classroom.', '3-second QR rotation · server checks'),
    ('03', 'Close, review and export.', 'Absent marking · corrections · reports'),
]
for i, (n, title, sub) in enumerate(steps):
    x = .73 + i * 4.12
    text(s, n, x, 2.45, .48, .35, 20, BLUE, True)
    text(s, title, x + .58, 2.46, 3.25, .44, 15.5, INK, True)
    text(s, sub, x + .58, 2.93, 3.26, .26, 12, MUTED)
picture(s, 'faculty-live-session.png', .7, 3.46, 8.37, caption='Authentic faculty live-demo session. The QR is a static screenshot and has expired; 152 is a fictional fixture cohort.')
text(s, 'Live session interface · seeded cohort of 152 fictional students', .76, 6.1, 8.31, .28, 12, MUTED)
box(s, .7, 6.55, 8.38, .33, PALE, rounded=True)
text(s, 'Attendance is connected. Campus services remain sample workflows.', .83, 6.62, 8.13, .2, 11.5, INK)
box(s, 9.35, 3.46, 3.3, 3.43, WHITE, border=LINE, rounded=True, name='Editable team contributions')
label(s, 'Individual contributions', 9.56, 3.67, 2.88)
text(s, 'Replace each [role] before submission.', 9.56, 3.98, 2.87, .22, 9.5, MUTED)
members = ['Umang Khatri', 'Aatiksh Shukla', 'Shivang Karthikey', 'Aniket Kumar', 'Arpan Kumar', 'Charu Garg', 'Aakash Kushwaha']
for i, member in enumerate(members):
    y = 4.38 + i * .33
    text(s, member, 9.56, y, 2.02, .27, 13.8, INK, name=f'Team member {i+1}')
    text(s, '[role]', 11.7, y, .75, .27, 12.5, BLUE, name=f'EDIT: actual contribution for {member}')
notes(s, '3. MVP execution, resources and individual contributions', '2 minutes 25 seconds',
"""Walk through the classroom flow rather than reading every feature. The teacher chooses the classroom point on a map and opens the session. The displayed QR rotates every three seconds. The student frontend requests actual foreground GPS and submits the scan to the backend. The server validates the QR signature, expiry, student identifier and 50m boundary, and prevents duplicate check-ins. Closing a session marks students without a check-in absent through the shared record; cancelled sessions do not count.

The current implementation uses an Expo/React Native student frontend, a React faculty web dashboard and Supabase. The backend has been tested against the actual Supabase project for HMAC signing, accepted synthetic-location check-in, duplicate prevention and rejection outside the geofence. This is a server smoke test, not proof of in-class GPS accuracy. Fifteen automated tests passed during implementation. Native Android project generation and JavaScript export succeeded; actual phone installation and a classroom pilot remain distinct checks.

QR timing detail for questions: the current and previous three-second slots are accepted to tolerate scanning/network delays. Rotation every three seconds is not a claim that every token lives for exactly three seconds.

The screenshot shows the real faculty interface and a demonstration session. Its QR is static and expired—use the live dashboard for the demonstration. 152 students, six courses and 12 teaching weeks are seeded fixture records, not customers or field-use results.

Day-to-day faculty workflow: choose course, set/open session, display QR, monitor check-ins, close, inspect shortages, correct with a reason, and export. The prototype's selectable identities are not production authentication. Real deployment needs authenticated institute/teacher/student roles, device and abuse controls, and a privacy review.

The team must complete all seven individual roles in the editable sidebar. Do not invent contributions. Suggested length is one or two honest words; fuller detail belongs in the oral explanation. Current labels are deliberately placeholders: Umang Khatri; Aatiksh Shukla; Shivang Karthikey; Aniket Kumar; Arpan Kumar; Charu Garg; Aakash Kushwaha.""")


# 4 — Proposed model only. No sales or financial-performance claims.
s = new_slide('Proposed business model', 4, 'Free check-in. Paid clarity.', 'A proposed model for student insights and institutional access.')
box(s, .7, 2.47, 4.25, 3.69, INK, rounded=True)
label(s, 'Proposed student plan', .96, 2.79, 3.75, color='AEC4ED')
text(s, 'INR 9', .96, 3.23, 3.62, .89, 50, WHITE, True)
text(s, '/ month', .98, 4.14, 3.59, .3, 16, 'CBD6E7')
text(s, 'Course-wise attendance records\nEligibility + recovery planning\nTrends + what-if analysis', .98, 4.69, 3.63, 1.02, 18, WHITE)
text(s, 'Price hypothesis · willingness to pay untested', .98, 5.84, 3.63, .26, 10.2, 'BACEEF')
text(s, 'Free: QR check-in and campus services.', .77, 6.47, 4.32, .45, 15, INK, True)
text(s, 'Institutions', 5.59, 2.55, 6.9, .39, 22, INK, True)
text(s, 'Per-student licensing for faculty reporting\nand shared attendance records.', 5.6, 3.1, 6.75, .65, 18)
text(s, 'Institutional pilot pricing is still to be defined.', 5.6, 3.84, 6.9, .3, 13, MUTED)
rule(s, 5.6, 4.25, 6.89)
text(s, 'Costs to measure before scaling', 5.59, 4.51, 6.91, .4, 22, INK, True)
text(s, 'Hosting + database use · security · maintenance · support', 5.6, 5.08, 6.92, .64, 17.5)
text(s, 'The prototype uses free-tier infrastructure.\nProduction cost per active student is not yet established.', 5.6, 5.84, 6.91, .57, 13.5, MUTED)
text(s, 'Next test: show the Rs 9 offer and measure interest before fixing the paid plan.', 5.6, 6.55, 6.96, .32, 13, BLUE, True)
notes(s, '4. Proposed pricing, business model and viability', '1 minute 35 seconds',
"""Keep this slide clearly in the MVP-stage frame. Check-in is free. The proposed ₹9 monthly student plan covers attendance visibility and deeper analytics. Campus-service interactions remain free sample workflows. The code student123 unlocks the demonstration; it is not a payment integration.

An earlier submission proposed ₹19 per month. The current ₹9 proposal is a revised hypothesis, not a price discovered from paying customers. The team wants institutional fees linked to enrolled student count, but has not provided a validated institutional quote, so no amount is invented.

There are two customer relationships to validate: students who value personal visibility, and institutes that value consistent records and faculty reporting. Before scaling, measure infrastructure cost per active student, faculty support effort and ongoing security/maintenance work. The prototype uses free tiers, which does not mean production is costless or that all team expenditure is known.

Proposed commercial experiment: present the actual ₹9 message transparently, define the reached-prospect denominator, record interest/signups, and then test real willingness to pay. Interest is not a purchase and should not be reported as conversion to paying customers. Institutional pilot pricing should be discussed separately.

No revenue figures, profit calculations, sales claims or assumed budgets are shown, as requested for the approved MVP-stage presentation. If questioned, explain that commercial results are outside the demonstrated stage; do not invent them.

Be ready for the access-policy question: making essential attendance visibility paid may face resistance. This should be tested before finalising policy. Institution-sponsored access is an option to discuss, not a policy already implemented. Avoid promising savings, adoption rates or sustainable margins before measuring them.""")


# 5 — Evidence-based learning and a concrete next validation step.
s = new_slide('Entrepreneurial learning & next strategy', 5, 'What we learned—and what comes next.')
lessons = [
    ('01', 'Prove the need. Then test the demand.', 'The survey establishes need. Willingness to pay is our next question.'),
    ('02', 'Design for faculty, not just students.', 'We chose a web dashboard, reusable setup and automatic reporting.'),
    ('03', 'Classroom conditions are the next test.', 'The connected demo works. Now measure device accuracy and real use.'),
]
for i, (n, heading, body) in enumerate(lessons):
    y = 2.11 + i * 1.21
    text(s, n, .73, y, .52, .36, 23, BLUE, True)
    text(s, heading, 1.39, y + .03, 6.97, .43, 18.5, INK, True)
    text(s, body, 1.39, y + .55, 6.86, .55, 16.5, MUTED)
box(s, 9.01, 2.1, 3.63, 3.73, PALE, rounded=True)
label(s, 'Next: a focused pilot', 9.28, 2.39, 3.02)
text(s, 'One course.\nOne faculty member.', 9.28, 2.81, 3.01, .85, 22, INK, True)
for i, (heading, body) in enumerate([
    ('Check-in reliability', 'Success rate + correction requests'),
    ('Faculty effort', 'Session setup + reporting time'),
    ('Price hypothesis', 'A clear offer + measured interest'),
]):
    y = 3.98 + i * .52
    text(s, heading, 9.28, y, 3.03, .26, 14.5, INK, True)
    text(s, body, 9.28, y + .28, 3.03, .21, 10.8, MUTED)
box(s, .7, 6.18, 11.95, .66, INK, rounded=True)
text(s, 'Success is not more features. It is a record both sides can trust.', .95, 6.36, 11.48, .35, 20, WHITE, True)
notes(s, '5. Learnings, decisions and future strategy', '1 minute 40 seconds',
"""End with what changed in our thinking. First, a strong problem survey is not proof of a paid business. We have to test willingness to pay and the access policy separately. Second, teachers need less work, not another system that adds steps. That informed the faculty web dashboard and automatic reporting. Third, working frontend screens and server checks do not replace a real classroom pilot.

Concrete product decisions made during this MVP: faculty tools moved to a web dashboard; the price hypothesis changed from the earlier ₹19 proposal to ₹9; attendance was connected to a live backend while campus services remained interactive samples. Do not claim these were all measured market pivots—the link to research is strongest for attendance visibility and adoption simplicity.

Execution challenges included cloud-build queue delays and an upload DNS failure; the browser previews allowed interface work and backend testing to continue. Android packaging and real-device testing are separate from frontend readiness. In production, location spoofing, device identity, role/tenant authorization and privacy controls must be addressed. GPS plus rotating QR raises the effort of casual sharing; it does not guarantee elimination of proxies.

The proposed next step is deliberately narrow: one course, one faculty member, and an opt-in student group. Measure check-in success, corrections/disputes, and faculty setup/reporting time. Then test the pricing proposition. Only after these results should the team decide how to scale to institutional deployment and turn sample campus workflows into approved integrations.

Close with: 'We are not claiming that the business is proven. We have evidence that the problem is real, an MVP that connects both sides of the record, and a specific pilot to test what remains uncertain.' Leave time for questions. The suggested slide timings total about 8 minutes 45 seconds, leaving a buffer within the 10-minute limit.""")


def render_preview(index, scene):
    canvas = Image.new('RGB', (round(W * DPI), round(H * DPI)), '#' + BG)
    draw = ImageDraw.Draw(canvas)
    for item in scene:
        x, y, w, h = item['rect']
        bounds = [round(x * DPI), round(y * DPI), round((x + w) * DPI), round((y + h) * DPI)]
        if item['kind'] == 'box':
            kwargs = {'fill': '#' + item['color']}
            if item.get('border'):
                kwargs.update(outline='#' + item['border'], width=1)
            if item.get('rounded'):
                draw.rounded_rectangle(bounds, radius=max(3, round(min(w, h) * DPI * .12)), **kwargs)
            else:
                draw.rectangle(bounds, **kwargs)
        elif item['kind'] == 'picture':
            image = Image.open(item['path']).convert('RGB').resize((round(w * DPI), round(h * DPI)), Image.Resampling.LANCZOS)
            canvas.paste(image, (bounds[0], bounds[1]))
        elif item['kind']=='stroke':
            x1,y1,x2,y2=item['points']
            draw.line((round(x1*DPI),round(y1*DPI),round(x2*DPI),round(y2*DPI)),fill='#'+item['color'],width=max(1,round(item['width']*DPI/72)))
        else:
            font = ImageFont.truetype(str(BOLD if item['bold'] else REGULAR), max(1, round(item['size'] * DPI / 72)))
            width, lines = w * DPI, []
            for paragraph in item['text'].split('\n'):
                line = ''
                for word in paragraph.split():
                    attempt = (line + ' ' + word).strip()
                    if line and draw.textlength(attempt, font=font) > width:
                        lines.append(line)
                        line = word
                    else:
                        line = attempt
                lines.append(line)
            step = item['size'] * DPI / 72 * 1.13
            if len(lines) * step > h * DPI + 6:
                validation.append(f"Slide {index}: estimated text overflow: {item['text']!r}")
            for j, line in enumerate(lines):
                length = draw.textlength(line, font=font)
                xx = x * DPI + (width - length) / 2 if item['align'] == 'center' else (x + w) * DPI - length if item['align'] == 'right' else x * DPI
                draw.text((round(xx), round(y * DPI + j * step)), line, font=font, fill='#' + item['color'], anchor='lt')
    canvas.save(ASSETS / f'slide-{index:02d}-preview.png')
    return canvas


talk_tracks = [
"""Our starting point was simple: students should not have to guess whether they have enough attendance to sit an exam. When records are spread across paper, different QR systems and personal trackers, the student has to reconstruct the number. The teacher has to compile it again.

OneAttend brings those two sides together. Faculty maintain the shared attendance record, and students get a course-wise view that explains where they stand and what they need to do next.

The value is not just a faster scan. It is knowing early enough to act. If a student is below 75%, the app shows how many consecutive classes they need to attend. If they are above it, it shows the effect of missing future classes.

We are presenting an approved MVP-stage venture. The screenshot is our actual student frontend, using fictional records to demonstrate the experience.""",
"""We used the uploaded survey to check whether this was a real problem. It contains 300 student responses. We have used that verified number throughout the presentation.

189 students—63%—said they were unsure about meeting the 75% requirement near semester-end. 165—55%—found tracking their percentage across courses difficult or very difficult. Only 78 said they tracked regularly, which means 74% did not.

Those findings helped us decide what deserved attention. Uncertainty led to eligibility alerts and a recovery planner. Scattered records led to a single course-wise view. Irregular manual tracking reinforced the need for an automatic shared record.

Our team also received six faculty responses. Earlier discussions highlighted compilation effort and the importance of an easy-to-use system.

Most student responses were from IIT Patna, so this is useful campus discovery, not a representative national study. It tells us the problem matters. It does not yet tell us that students will pay.""",
"""This is the classroom flow we can demonstrate in the MVP. The teacher selects the classroom point on a map and opens attendance. The QR rotates every three seconds. A student scans it inside the selected 50-metre boundary.

The backend checks the QR signature and expiry, the student identifier, the location distance and whether that student has already checked in. When the teacher closes the session, students without a check-in are absent. The teacher can then review shortages, correct a record with a reason, and export the report.

We moved faculty tools to a web dashboard because their work involves batches, tables and reports—not just scanning. The student interface is Android-first.

The live backend has passed signing, duplicate and geofence smoke checks. Those tests used synthetic coordinates; a real classroom phone test is still the next step. The 152 identities in the screenshot are fictional demonstration records, not acquired users.

The individual contribution panel is where each team member will briefly explain their actual work. Campus services demonstrate the interface, while attendance is the connected core.""",
"""Our proposed model keeps classroom check-in free. The student plan is nine rupees per month for attendance records, eligibility and recovery planning, trends and what-if analysis. Campus services also remain free.

We originally wrote nineteen rupees in an earlier canvas. Nine rupees is the revised hypothesis for this MVP—not a price proven by customer purchases. We still need to test whether the value is clear enough for students to pay, and whether the access policy is acceptable to them.

For institutes, the proposed licence is linked to enrolled student count and supports faculty reporting and shared records. An institutional pilot price has not been fixed yet.

The prototype uses free-tier infrastructure, but that is not the same as a costless production service. Before scaling, we need to measure database use, hosting, security, maintenance and support per active student.

Our next commercial experiment is a transparent offer: show the nine-rupee plan, define who saw it, record interest, and then test genuine willingness to pay.""",
"""Three things became clearer as we built the MVP.

First, proving a problem and proving a paid business are different jobs. The survey gives us evidence of uncertainty. Pricing needs a separate experiment.

Second, the product has to work for faculty as well as students. A useful student dashboard depends on a record that teachers can manage without adding another layer of work. That is why we chose reusable session setup and automatic reporting.

Third, classroom conditions are the next test. The connected demo works, but GPS behaviour, correction requests and real faculty effort cannot be judged only from screens or backend tests. Location checks also do not guarantee that every proxy attempt is prevented.

Our next step is deliberately focused: one course, one faculty member, and an opt-in group of students. We will measure check-in reliability, corrections and reporting effort, then test the price hypothesis.

We are not trying to prove the venture by adding more features. We want to build a record that both sides can trust.""",
]

assert len(prs.slides) == 5
for slide, (heading, timing, detail), talk in zip(prs.slides, speaker_notes, talk_tracks):
    slide.notes_slide.notes_text_frame.text=f'{heading}\nSuggested time: {timing}\n\nSUGGESTED TALK TRACK\n{talk}\n\nSUPPORTING DETAIL / Q&A REMINDERS (not a script to read aloud)\n{detail}'
for i, slide in enumerate(prs.slides, 1):
    for shape in slide.shapes:
        assert shape.left >= 0 and shape.top >= 0, f'Slide {i}: negative shape position'
        assert shape.left + shape.width <= prs.slide_width + Inches(.01), f'Slide {i}: shape exceeds slide width'
        assert shape.top + shape.height <= prs.slide_height + Inches(.01), f'Slide {i}: shape exceeds slide height'
    assert slide.notes_slide.notes_text_frame.text.strip()

prs.save(PPTX)
images = [render_preview(i, scene) for i, scene in enumerate(scenes, 1)]
thumbs = []
for i, image in enumerate(images, 1):
    thumb = image.resize((800, 450), Image.Resampling.LANCZOS)
    thumbs.append(thumb)
contact = Image.new('RGB', (1600, 1350), '#D9E0E9')
for i, image in enumerate(thumbs):
    contact.paste(image, ((i % 2) * 800, (i // 2) * 450))
contact.save(ASSETS / 'deck-overview.png')

faq = """## Before submission — only your team can finish these items

1. Replace all seven **[role]** fields on slide 3 with genuine individual contributions. They are separate, editable text boxes.
2. Confirm the professor's approved MVP-stage scope covers the substitute business-model slide and survey-led validation. The guidelines mention initial interviews; 300 surveys are not 300 interviews.
3. Check the latest APK build status. Do not say Android installation or classroom GPS testing is completed until it is.
4. Review the deck in PowerPoint/Keynote on the presentation computer. The delivered file is PPTX, as required; do not submit only a PDF.
5. Screenshots show browser previews connected to the live demo backend and seeded records. The screenshot QR is static/expired. Open the live dashboard for a real scan.
6. Do not add a download QR until it points to a reachable published APK page. Localhost links do not work on other people's phones.

## Questions the professor may ask

**Why 300, not 320?** The uploaded workbook has 300 student response rows. We used the verifiable denominator.

**Are the 152 students customers?** No. They are fictional fixture identities used to demonstrate two batches, six courses, and twelve weeks of records.

**Does 63% prove people will buy the app?** No. It supports the uncertainty problem. The ₹9 offer and payment intent need separate testing.

**Why ₹9 when the earlier canvas said ₹19?** It is a revised product/pricing hypothesis, not a result from paid demand testing.

**Do you eliminate all proxy attendance?** No. The backend verifies QR signature/expiry, uniqueness and location distance. GPS can be spoofed and demo identities are selectable. Production needs authentication, device controls, abuse prevention and a privacy review.

**What happens when a QR changes while someone scans?** The code rotates every three seconds; the backend accepts the current or previous slot for a short grace window. Avoid claiming an exact three-second maximum lifetime.

**Have you tested the classroom location on actual Android phones?** Server smoke checks used synthetic coordinates, not a field test. Report real-device testing separately and update this answer if you complete it before presenting.

**What exactly works now?** Connected session creation/QR signing/check-in logic, duplicate and geofence checks, manual close, absence inference, audited corrections and analytics. Student/teacher UI is built. Campus services are interactive local sample workflows; payments and institutional approvals are not integrated.

**How do institutes pay?** The proposed model links licensing to enrolled student count. An institutional pilot quote is not established yet.

**Is charging for basic attendance visibility acceptable?** It is an access-policy risk to test, not a settled market result. Discuss student objections and institution-sponsored access before finalising the policy.

**What is the next experiment?** One course with one faculty member and opt-in students; track check-in success, correction requests and teacher effort, then test a transparent pricing proposition.
"""
lines = ['# OneAttend — Presenter Notes', '', '**Five slides · Suggested speaking time: 8 minutes 45 seconds · MVP-stage scope**', '']
for (heading, timing, content), talk in zip(speaker_notes, talk_tracks):
    lines.extend([f'## {heading}', f'**Time: {timing}**', '', '### Suggested talk track', '', talk, '', '### Supporting detail and Q&A reminders — do not read these aloud', '', content, ''])
lines.extend([faq, '\n## Screenshot replacement\n\nThe six source PNGs are in `OneAttend_Presentation_Assets`. In PowerPoint, right-click an embedded screenshot and choose **Change Picture**. Preserve the caption stating whether the image uses fictional records. All slide text is editable.\n'])
NOTES.write_text('\n'.join(lines), encoding='utf8')
(ASSETS / 'verified-evidence.json').write_text(json.dumps({'studentSurvey': stats, 'facultyResponses': {'count': 6, 'basis': 'Team-reported; faculty dataset not supplied'}, 'stage': 'Professor-approved MVP stage', 'screenshots': 'Authentic browser previews; fictional seeded student records', 'individualContributions': 'Editable placeholders; team must supply actual roles', 'previewValidation': validation}, indent=2), encoding='utf8')
print(f'Created {PPTX}')
print(f'Created {NOTES}')
print(f'Preview assets: {ASSETS}')
print(f'Layout warnings: {len(validation)}')
for warning in validation:
    print(warning)
with ZipFile(OUT / 'OneAttend_Presentation_Package.zip', 'w', compression=ZIP_DEFLATED) as package:
    package.write(PPTX,PPTX.name)
    package.write(NOTES,NOTES.name)
    for file in sorted(ASSETS.glob('*')):
        if file.suffix.lower() in ('.png','.json'):
            package.write(file,'OneAttend_Presentation_Assets/'+file.name)
print('Packaged PPTX, notes, screenshots and slide previews into OneAttend_Presentation_Package.zip')
