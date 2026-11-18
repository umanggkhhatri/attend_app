import { mkdir, readFile, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const gallery = resolve(root, 'artifacts/team-screenshots');
const media = resolve(root, 'apps/web/public/presentation-media');
const downloads = resolve(root, 'apps/web/public/presentation-files');
const manifest = JSON.parse(await readFile(resolve(gallery, 'manifest.json'), 'utf8'));
await Promise.all([mkdir(media, { recursive: true }), mkdir(downloads, { recursive: true })]);
for (const image of manifest.screenshots) {
  const folder = image.group === 'student' ? 'student' : 'faculty-admin';
  await mkdir(resolve(media, folder), { recursive: true });
  await copyFile(resolve(gallery, folder, image.file), resolve(media, folder, image.file));
}
await writeFile(resolve(media, 'gallery.json'), JSON.stringify(manifest, null, 2));
await copyFile(
  resolve(root, '../OneAttend_Presentation_Assets/faculty-live-session.png'),
  resolve(media, 'faculty-admin/11-live-session-panel.png'),
);
await copyFile(
  resolve(root, '../OneAttend_MVP_Final.pptx'),
  resolve(downloads, 'OneAttend_MVP_Final.pptx'),
);
await copyFile(
  resolve(root, '../OneAttend_Presenter_Notes.md'),
  resolve(downloads, 'OneAttend_Presenter_Notes.md'),
);
await writeFile(
  resolve(media, 'research-evidence.json'),
  JSON.stringify(
    {
      source: 'Uploaded survey.xlsx; 300 completed student responses',
      sample: {
        students: 300,
        iitPatna: 221,
        otherColleges: 79,
        sampling: 'Exploratory convenience sample, not nationally representative',
      },
      uncertainty: {
        question:
          'Towards the end of the semester, are you ever unsure if you have enough attendance to not fall short of the 75% criteria?',
        yes: 189,
        no: 111,
        denominator: 300,
        percentage: 63,
      },
      difficulty: {
        question:
          'How difficult is it for you to know your current attendance percentage across all 5–7 courses?',
        difficult: 105,
        veryDifficult: 60,
        neutral: 79,
        veryEasy: 56,
        denominator: 300,
        combinedPercentage: 55,
      },
      tracking: {
        question: 'Do you currently keep a track of your attendance?',
        regularly: 78,
        sometimes: 76,
        rarely: 60,
        no: 86,
        denominator: 300,
        nonRegularPercentage: 74,
      },
      faculty: { responses: 6, basis: 'Team-reported; no faculty dataset supplied' },
      limits: [
        'Survey responses are not customer acquisition.',
        'Problem evidence is not payment validation.',
        '152 demo student identities are fictional fixtures.',
      ],
    },
    null,
    2,
  ),
);
console.log(
  `Prepared ${manifest.screenshots.length} gallery screenshots plus the live-session panel, aggregate evidence and PPTX backup.`,
);
