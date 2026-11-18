# OneAttend

An Android student app and a faculty web dashboard. Independent campus brand; charcoal/blue design. **Presentation prototype, not a production attendance system.**

## Structure
- `apps/mobile` — Expo Android app
- `apps/web` — React faculty dashboard and APK download page
- `packages/core` — deterministic sample data, attendance analytics, Supabase gateway
- `supabase/demo.sql` — server-validated QR demo backend

## Start
```sh
npm install
npm run web
npm run mobile
```

Without Supabase configuration, both apps run with sample records. Local preview sessions are device-local; they do not sync across devices. Campus-service actions are sample workflows, not real approvals or bookings.

## Live demo setup
Create a free Supabase project. Run `supabase/demo.sql` in its SQL editor. Copy each app's `.env.example` to `.env.local` (web) / `.env` (mobile), add the project URL and publishable/anon key, and restart. Never put a service-role key in either app.

This backend is **demo-only**: identities are selected, not authenticated, and anonymous callers can control demo sessions and read fictitious records. Use a separate project with no real student data. Production requires authenticated tenant/teacher/student authorization, abuse controls, device attestation and a privacy review. Client GPS is not proof against spoofing.

Only attendance check-in is free. Attendance visibility/analytics show a ₹9/month membership; `student123` is a visibly labelled demo unlock, not a payment integration.

## Verify
```sh
npm test
npm run typecheck
npm run build:web
```
