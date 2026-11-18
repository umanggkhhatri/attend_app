# Tonight’s build and tomorrow’s demo

## What is ready without accounts

The student UI, faculty dashboard, sample records, local campus workflows, membership demo, analytics and report exports. Real phone-to-dashboard syncing needs Supabase configuration. An APK needs an Expo/EAS build account or a local Android toolchain.

## Supabase (free project)

1. Create a **separate demo project**, not a project with real student data.
2. Run `supabase/demo.sql` in the SQL editor. It creates the demo APIs and seeds 12 weeks of fictitious attendance.
3. Copy `apps/web/.env.example` to `apps/web/.env.local` and `apps/mobile/.env.example` to `apps/mobile/.env`.
4. Add the project URL and publishable/anon key to both. Do not use a service-role key.
5. Restart the web and Expo processes. Confirm both display a live connection.

The frontend polls scoped snapshots every four seconds. QR validity is checked using the **database clock**, not the student phone clock. Three-second slots accept the current or previous slot. QR signing secrets never leave the backend.

## Android APK

Run these commands from `apps/mobile`:

```sh
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile preview
```

If EAS asks to generate an Android signing keystore, allow it for this new demo app. The preview profile builds an installable APK, not an AAB. Use EAS's free quota where available; queue duration and current account limits are not guaranteed.

**Configure Supabase before building.** `EXPO_PUBLIC_*` values are compiled into the app. If the build service does not receive the ignored `.env` file, add both variables to the EAS preview environment first. Never expose secret keys in public environment variables.

After the build finishes, download and install it on an actual Android 14+ phone. Exporting the Android JavaScript bundle is **not** the same as building or testing an APK.

## Hosting and QR downloads

Build the dashboard with `npm run build:web`. Deploy `apps/web/dist` to a static host with an SPA fallback to `index.html`. Set the web Supabase environment variables in the host before building.

Upload the verified APK to a reachable HTTPS URL (for example, a GitHub release asset after explicit approval to publish). Set `VITE_APK_URL` to that download URL and rebuild the dashboard. `/download` displays a QR for its own hosted download page and a button for the APK. Without an APK URL, it correctly says the build is not published.

Do not present a QR pointing to `localhost`; other phones cannot reach it. Keep the APK download QR separate from attendance QR codes.

## Five-minute presentation

1. Open the faculty dashboard and select FAC001 / Operating Systems.
2. Show combined AI + CS records, the shortage filter and CSV export.
3. Start a session. Use **Find my area**, then click the classroom location on the map. The radius is 50 metres.
4. On the Android phone, select a fictitious student and open **Check in**. Wait for GPS readiness before scanning.
5. Show the new check-in in the faculty dashboard. Close the session; unchecked students are absent.
6. Open student attendance, explain the ₹9/month concept, and unlock with **student123**. Show recovery planning, course comparisons and the calendar.
7. Submit a sample hostel complaint or join a sample cab ride. Explain these are interactive frontend workflows, not live institutional integrations.

## Before presenting

- Test with the actual phone, room and Wi-Fi/hotspot.
- Verify map tiles load and GPS finds the correct side of the 50m boundary.
- Indoor GPS can be inaccurate. A location within 50m is required; accuracy over 100m is rejected. Do not silently bypass a failed check-in.
- Enable Android camera and foreground-location permissions.
- Keep the faculty dashboard open while a session is running so the QR stays fresh.
- Select different fictitious students for multiple phones. Duplicate check-ins do not count twice.
- Verify APK install warnings and download size on a second device.
- Retain the interactive student browser preview as a UI fallback, not as proof of native GPS correctness.

## Honest boundaries

This prototype demonstrates the product and selected live flows. It does not include real payment collection, tenant isolation, authenticated teacher/student roles, device attestation, leave-policy decisions, institutional approval routing, ERP integration, real messaging or guaranteed proxy prevention. Anonymous demo APIs are unsuitable for production. The institute and student data are fictitious.

The backend tests execute PostgreSQL logic using PGlite with an explicit crypto shim. The actual HMAC-SHA256 extension and device networking still need verification in the configured Supabase project.

The latest dependency audit reports three moderate entries tracing to an upstream build-tool glob-matching advisory (`minimatch` via Expo fingerprinting). No forced Expo downgrade is applied because it would break the tested SDK combination; review updated upstream patches before production.
