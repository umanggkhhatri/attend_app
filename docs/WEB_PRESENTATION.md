# OneAttend presentation website

Open **http://localhost:5173/presentation** after `npm run web`. This address works on the development computer; it is not a public share link.

## Delivery

- Nine focused slides: venture, verified survey, discovery, connected attendance, student analytics, faculty tools, campus services, business model and learnings/pilot.
- A five-slide condensed mode retains the core rubric sections. The uploaded guidelines specify five slides and PPTX; keep the downloadable PPTX backup unless the professor approves website delivery.
- Local, high-resolution screenshots can be enlarged. The screenshot QR codes are static/expired, not classroom check-in codes.
- The final slide includes the completed Android build's download QR. It links to one particular Expo-hosted version, with the listed build expiry of 2 December 2026.
- No revenue figures, acquired-customer claims or invented individual contributions are included.

## Controls

| Key                 | Action                      |
| ------------------- | --------------------------- |
| Left / right arrows | Previous / next slide       |
| 1–9                 | Jump to a slide             |
| Home / End          | First / last slide          |
| F                   | Fullscreen                  |
| N                   | Speaker notes               |
| G                   | Screenshot gallery          |
| T                   | Start/pause rehearsal timer |
| Escape              | Close an overlay            |

Use the **Team** button to add genuine individual contributions. They are saved in browser local storage, not to a shared account or back into the PPTX. Fill these before presenting.

The interactive student example uses a fictional 14/24 record. Sixteen consecutive additional attended classes produce 30/40, exactly 75%. It does not modify the attendance database.

## Evidence and assets

The website contains only aggregate research evidence: 300 student responses, 63% uncertain about eligibility, 55% reporting difficult/very-difficult tracking, and 74% not tracking regularly. 221 responses were from IIT Patna. The six faculty responses are team-reported. Participation in the survey is not customer acquisition or willingness to pay.

`apps/web/public/presentation-media/` contains screenshot assets and aggregate JSON. `presentation-files/` contains the five-slide PPTX backup and detailed talk tracks. No raw survey spreadsheet or private environment file is published.

Regenerate website assets, if needed, with `node scripts/presentation-web-assets.mjs`. This reads the locally captured galleries and existing presentation exports in the parent folder; it does not run attendance sessions.

## Verify and host

```sh
npm run typecheck
npm run test:ui
npm run build:web
```

Deploy `apps/web/dist` using the included Netlify or Vercel configuration. The host must route `/presentation` to the SPA while serving `/presentation-media/*` and `/presentation-files/*` as static files. The website content is independent of live Supabase queries; the actual faculty demo still needs its normal environment configuration.

Optionally configure `VITE_STUDENT_DEMO_URL` for a hosted student browser preview. On localhost, the help panel links to the local preview at port 4174. Hosted presentation users always have the APK link available.

## Cleanup boundary

The working repository was checkpointed and pushed before redesign. Uploaded course documents, raw survey data, screenshot galleries and presentation exports were not deleted. Generated build/test folders are candidates for a separately approved cleanup; they should not be confused with source files, native customisations, or the APK itself.
