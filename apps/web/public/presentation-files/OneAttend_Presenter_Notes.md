# OneAttend — Presenter Notes

**Five slides · Suggested speaking time: 8 minutes 45 seconds · MVP-stage scope**

## 1. Problem, opportunity and venture overview
**Time: 1 minute 15 seconds**

### Suggested talk track

Our starting point was simple: students should not have to guess whether they have enough attendance to sit an exam. When records are spread across paper, different QR systems and personal trackers, the student has to reconstruct the number. The teacher has to compile it again.

OneAttend brings those two sides together. Faculty maintain the shared attendance record, and students get a course-wise view that explains where they stand and what they need to do next.

The value is not just a faster scan. It is knowing early enough to act. If a student is below 75%, the app shows how many consecutive classes they need to attend. If they are above it, it shows the effect of missing future classes.

We are presenting an approved MVP-stage venture. The screenshot is our actual student frontend, using fictional records to demonstrate the experience.

### Supporting detail and Q&A reminders — do not read these aloud

Start with a simple observation: students should not have to guess whether they can sit an exam. Today, attendance may sit in paper registers, individual teacher QR systems, and personal trackers. That creates two jobs: students keep trying to reconstruct their percentage, and faculty compile records again.

OneAttend is our MVP response: a shared faculty-managed record, plus a student view that explains what to do next. The main value is not merely taking a scan. It is making attendance understandable early enough to act.

Point to the screenshot. It is a real screenshot of the student frontend connected to our live demo backend. The displayed student and records are deliberately fictional; they are not evidence of users acquired. The interface is Android-first, but the screenshot is from its browser preview. The Android APK was queued at preparation time; verify its current status before presenting.

The professor approved an MVP-stage presentation. Do not call this a completed institutional launch or claim paying customers. Campus features include timetable, cab sharing, gate passes, hostel complaints, lost and found, announcements, calendar, leave/corrections, mess feedback and directory. These are sample workflows; attendance is the live connected core.

## 2. Customer discovery and market validation
**Time: 1 minute 50 seconds**

### Suggested talk track

We used the uploaded survey to check whether this was a real problem. It contains 300 student responses. We have used that verified number throughout the presentation.

189 students—63%—said they were unsure about meeting the 75% requirement near semester-end. 165—55%—found tracking their percentage across courses difficult or very difficult. Only 78 said they tracked regularly, which means 74% did not.

Those findings helped us decide what deserved attention. Uncertainty led to eligibility alerts and a recovery planner. Scattered records led to a single course-wise view. Irregular manual tracking reinforced the need for an automatic shared record.

Our team also received six faculty responses. Earlier discussions highlighted compilation effort and the importance of an easy-to-use system.

Most student responses were from IIT Patna, so this is useful campus discovery, not a representative national study. It tells us the problem matters. It does not yet tell us that students will pay.

### Supporting detail and Q&A reminders — do not read these aloud

We initially discussed a larger response count, but the uploaded spreadsheet contains exactly 300 completed student rows. We use that verified count rather than overstating the sample.

The three percentages come directly from the workbook: 189 answered yes to uncertainty about meeting 75%; 105 said tracking across courses is difficult and 60 said very difficult, giving 165; only 78 tracked regularly, so the remaining 222 did not. The original 63% draft figure is now supported by the uploaded data.

221 respondents identified their college as IITP. The remaining respondents listed several other colleges, with spelling variants. This was an exploratory convenience sample, not a representative national study. Say '300 survey responses', not '300 interviews' or '300 acquired customers'.

The team reports six faculty responses. Earlier course submissions describe manual compilation and concerns about technical ease of use. No faculty-response spreadsheet was uploaded, so do not quote a faculty percentage or claim all six said the same thing.

Explain the product decisions using the arrows: uncertainty led to threshold/recovery tools; scattered records led to a course-wise view; irregular manual tracking reinforced automatic shared records. The evidence establishes the problem, but not willingness to pay or product-market fit.

Proposed pilot acquisition: recruit one faculty champion for one course and onboard an opt-in student cohort. This is the next step, not an activity already completed. If asked about the guidelines' 20-interview requirement, do not relabel surveys as interviews; explain the actual research conducted and the approved MVP-stage scope.

## 3. MVP execution, resources and individual contributions
**Time: 2 minutes 25 seconds**

### Suggested talk track

This is the classroom flow we can demonstrate in the MVP. The teacher selects the classroom point on a map and opens attendance. The QR rotates every three seconds. A student scans it inside the selected 50-metre boundary.

The backend checks the QR signature and expiry, the student identifier, the location distance and whether that student has already checked in. When the teacher closes the session, students without a check-in are absent. The teacher can then review shortages, correct a record with a reason, and export the report.

We moved faculty tools to a web dashboard because their work involves batches, tables and reports—not just scanning. The student interface is Android-first.

The live backend has passed signing, duplicate and geofence smoke checks. Those tests used synthetic coordinates; a real classroom phone test is still the next step. The 152 identities in the screenshot are fictional demonstration records, not acquired users.

The individual contribution panel is where each team member will briefly explain their actual work. Campus services demonstrate the interface, while attendance is the connected core.

### Supporting detail and Q&A reminders — do not read these aloud

Walk through the classroom flow rather than reading every feature. The teacher chooses the classroom point on a map and opens the session. The displayed QR rotates every three seconds. The student frontend requests actual foreground GPS and submits the scan to the backend. The server validates the QR signature, expiry, student identifier and 50m boundary, and prevents duplicate check-ins. Closing a session marks students without a check-in absent through the shared record; cancelled sessions do not count.

The current implementation uses an Expo/React Native student frontend, a React faculty web dashboard and Supabase. The backend has been tested against the actual Supabase project for HMAC signing, accepted synthetic-location check-in, duplicate prevention and rejection outside the geofence. This is a server smoke test, not proof of in-class GPS accuracy. Fifteen automated tests passed during implementation. Native Android project generation and JavaScript export succeeded; actual phone installation and a classroom pilot remain distinct checks.

QR timing detail for questions: the current and previous three-second slots are accepted to tolerate scanning/network delays. Rotation every three seconds is not a claim that every token lives for exactly three seconds.

The screenshot shows the real faculty interface and a demonstration session. Its QR is static and expired—use the live dashboard for the demonstration. 152 students, six courses and 12 teaching weeks are seeded fixture records, not customers or field-use results.

Day-to-day faculty workflow: choose course, set/open session, display QR, monitor check-ins, close, inspect shortages, correct with a reason, and export. The prototype's selectable identities are not production authentication. Real deployment needs authenticated institute/teacher/student roles, device and abuse controls, and a privacy review.

The team must complete all seven individual roles in the editable sidebar. Do not invent contributions. Suggested length is one or two honest words; fuller detail belongs in the oral explanation. Current labels are deliberately placeholders: Umang Khatri; Aatiksh Shukla; Shivang Karthikey; Aniket Kumar; Arpan Kumar; Charu Garg; Aakash Kushwaha.

## 4. Proposed pricing, business model and viability
**Time: 1 minute 35 seconds**

### Suggested talk track

Our proposed model keeps classroom check-in free. The student plan is nine rupees per month for attendance records, eligibility and recovery planning, trends and what-if analysis. Campus services also remain free.

We originally wrote nineteen rupees in an earlier canvas. Nine rupees is the revised hypothesis for this MVP—not a price proven by customer purchases. We still need to test whether the value is clear enough for students to pay, and whether the access policy is acceptable to them.

For institutes, the proposed licence is linked to enrolled student count and supports faculty reporting and shared records. An institutional pilot price has not been fixed yet.

The prototype uses free-tier infrastructure, but that is not the same as a costless production service. Before scaling, we need to measure database use, hosting, security, maintenance and support per active student.

Our next commercial experiment is a transparent offer: show the nine-rupee plan, define who saw it, record interest, and then test genuine willingness to pay.

### Supporting detail and Q&A reminders — do not read these aloud

Keep this slide clearly in the MVP-stage frame. Check-in is free. The proposed ₹9 monthly student plan covers attendance visibility and deeper analytics. Campus-service interactions remain free sample workflows. The code student123 unlocks the demonstration; it is not a payment integration.

An earlier submission proposed ₹19 per month. The current ₹9 proposal is a revised hypothesis, not a price discovered from paying customers. The team wants institutional fees linked to enrolled student count, but has not provided a validated institutional quote, so no amount is invented.

There are two customer relationships to validate: students who value personal visibility, and institutes that value consistent records and faculty reporting. Before scaling, measure infrastructure cost per active student, faculty support effort and ongoing security/maintenance work. The prototype uses free tiers, which does not mean production is costless or that all team expenditure is known.

Proposed commercial experiment: present the actual ₹9 message transparently, define the reached-prospect denominator, record interest/signups, and then test real willingness to pay. Interest is not a purchase and should not be reported as conversion to paying customers. Institutional pilot pricing should be discussed separately.

No revenue figures, profit calculations, sales claims or assumed budgets are shown, as requested for the approved MVP-stage presentation. If questioned, explain that commercial results are outside the demonstrated stage; do not invent them.

Be ready for the access-policy question: making essential attendance visibility paid may face resistance. This should be tested before finalising policy. Institution-sponsored access is an option to discuss, not a policy already implemented. Avoid promising savings, adoption rates or sustainable margins before measuring them.

## 5. Learnings, decisions and future strategy
**Time: 1 minute 40 seconds**

### Suggested talk track

Three things became clearer as we built the MVP.

First, proving a problem and proving a paid business are different jobs. The survey gives us evidence of uncertainty. Pricing needs a separate experiment.

Second, the product has to work for faculty as well as students. A useful student dashboard depends on a record that teachers can manage without adding another layer of work. That is why we chose reusable session setup and automatic reporting.

Third, classroom conditions are the next test. The connected demo works, but GPS behaviour, correction requests and real faculty effort cannot be judged only from screens or backend tests. Location checks also do not guarantee that every proxy attempt is prevented.

Our next step is deliberately focused: one course, one faculty member, and an opt-in group of students. We will measure check-in reliability, corrections and reporting effort, then test the price hypothesis.

We are not trying to prove the venture by adding more features. We want to build a record that both sides can trust.

### Supporting detail and Q&A reminders — do not read these aloud

End with what changed in our thinking. First, a strong problem survey is not proof of a paid business. We have to test willingness to pay and the access policy separately. Second, teachers need less work, not another system that adds steps. That informed the faculty web dashboard and automatic reporting. Third, working frontend screens and server checks do not replace a real classroom pilot.

Concrete product decisions made during this MVP: faculty tools moved to a web dashboard; the price hypothesis changed from the earlier ₹19 proposal to ₹9; attendance was connected to a live backend while campus services remained interactive samples. Do not claim these were all measured market pivots—the link to research is strongest for attendance visibility and adoption simplicity.

Execution challenges included cloud-build queue delays and an upload DNS failure; the browser previews allowed interface work and backend testing to continue. Android packaging and real-device testing are separate from frontend readiness. In production, location spoofing, device identity, role/tenant authorization and privacy controls must be addressed. GPS plus rotating QR raises the effort of casual sharing; it does not guarantee elimination of proxies.

The proposed next step is deliberately narrow: one course, one faculty member, and an opt-in student group. Measure check-in success, corrections/disputes, and faculty setup/reporting time. Then test the pricing proposition. Only after these results should the team decide how to scale to institutional deployment and turn sample campus workflows into approved integrations.

Close with: 'We are not claiming that the business is proven. We have evidence that the problem is real, an MVP that connects both sides of the record, and a specific pilot to test what remains uncertain.' Leave time for questions. The suggested slide timings total about 8 minutes 45 seconds, leaving a buffer within the 10-minute limit.

## Before submission — only your team can finish these items

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


## Screenshot replacement

The six source PNGs are in `OneAttend_Presentation_Assets`. In PowerPoint, right-click an embedded screenshot and choose **Change Picture**. Preserve the caption stating whether the image uses fictional records. All slide text is editable.
