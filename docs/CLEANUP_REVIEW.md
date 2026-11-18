# Cleanup review — nothing deleted yet

The repository was checkpointed and pushed before the presentation redesign. Cleanup requires confirmation of these exact paths; uploaded course work and deliverables are not included.

## Generated folders that can be recreated

| Candidate                   | Reason                                               | Current use                                                          |
| --------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/mobile/dist/`         | Old combined export from initial bundle verification | Not used by the current student preview or presentation              |
| `apps/mobile/dist-android/` | Generated Android JavaScript bundle, **not the APK** | Recreated by `npm run export:android -w @oneattend/mobile`           |
| `apps/mobile/dist-test/`    | Generated isolated browser-test fixture              | Rebuilt automatically by UI tests                                    |
| `test-results/`             | Playwright run output                                | Recreated by the next test run; preserve failure traces if debugging |

## Keep

- All application source, tests, lockfile and environment configuration.
- `apps/web/dist/`: the newly built website ready for hosting.
- `apps/mobile/dist-web/`: serves the active student preview at port 4174.
- `apps/mobile/android/`: generated native project; do not remove until any user/native edits are checked.
- `artifacts/`: team screenshot gallery, ZIP and presentation preview screenshots explicitly requested by the user.
- `apps/web/public/presentation-media/` and `presentation-files/`: required by the website.
- Existing PPTX, presenter notes, presentation ZIP, uploaded guidelines and original survey in the parent folder.
- `node_modules/`: required to continue running and testing the project tonight.

The four proposed generated paths can be removed without deleting source or the APK. This document is an approval list, not an instruction that already performed deletion.
