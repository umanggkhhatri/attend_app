# OneAttend MVP presentation

The requested deliverables are saved in the repository's parent folder:

- `OneAttend_MVP_Final.pptx` — five editable slides with speaker notes
- `OneAttend_Presenter_Notes.md` — natural talk tracks, evidence notes and Q&A preparation
- `OneAttend_Presentation_Assets/` — six original browser screenshots, five layout previews, a contact sheet and aggregate evidence
- `OneAttend_Presentation_Package.zip` — the presentation, notes and assets together

The deck follows the stricter five-slide limit across the uploaded guidelines and the professor-approved MVP-stage scope. It contains no sales or revenue figures. Student pricing is a proposed hypothesis, not commercial validation.

## Evidence

The uploaded `survey.xlsx` contains 300 response rows: 189 uncertain about eligibility (63%), 165 reporting difficult/very difficult course tracking (55%), and 222 not tracking regularly (74%). 221 respondents identified IITP as their college. The six faculty responses are team-reported; no faculty workbook was supplied.

Screenshots are authentic browser previews connected to the demo backend. The 152 student identities and historical records are fictitious fixtures, not acquired customers. The screenshot QR is static and expired.

## Required manual edit

Fill the seven **[role]** text fields on slide 3 with actual individual contributions before submitting. The team intentionally chose to add these manually. Do not invent work or treat the suggestions in the speaker notes as established contributions.

## Reproduce

From the repository root, with both frontends running and the demo Supabase project configured:

```sh
node scripts/presentation-capture.mjs
python -m pip install -r scripts/presentation-requirements.txt
python scripts/presentation.py
```

The capture script creates a demonstration attendance session only if none is already open for the course. It cancels only the session it created, preserving eligibility totals and existing user sessions. Do not use this script against a production project.

The earlier submissions and guidelines informed the narrative. At generation time, the script reads `survey.xlsx` and the captured screenshots from the repository's parent folder. It checks evidence counts and all slide bounds, and creates layout previews with Pillow. These previews are not PowerPoint-rendered screenshots. Open the actual PPTX on the presentation computer to check application/font rendering and use the embedded presenter notes. No PDF is required or supplied.
