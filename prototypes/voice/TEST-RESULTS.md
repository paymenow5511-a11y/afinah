# Verification report

Run date: November 23, 2026 (America/New_York). Runtime: Node.js v24.22.3.

| Check | Result | What it establishes |
| --- | --- | --- |
| Voice branch `npm test` | **55 passed, 0 failed** | 43 new controller/adapter tests plus 12 existing core tests |
| Existing `npm run check` | **Passed** | Wrangler 4.167.0 bundled the unchanged Worker in dry-run mode; 10.70 KiB upload estimate, no bindings, no deployment |
| Planning branch build | **Passed** | Existing PR #4 assets built in a separate detached checkout; 14 assets packaged |
| Planning branch `npm test` | **25 passed, 0 failed** | Existing tasks, notes, deleted-task recovery, goals, recurring schedules, calendar and Worker regression tests |
| Existing tracked source files | **Unchanged** | Prototype is additive; no website, planner, auth, storage, workflow, dependency manifest or deployment config edits |
| Browser regression suite | **Blocked before execution** | Bundled Playwright browser missing; system Chromium could not launch because socket creation was not permitted |
| Connected-browser preview attempt | **Blocked** | Browser could not reach the local preview; browser policy prevented further access. No browser assertion is counted as passed |
| Real microphone / recognition accuracy | **Not verified** | Requires supported browser/device, microphone permission, language service and harmless spoken test phrases |
| Audible output / physical mic shutdown | **Not verified** | Requires a real device with matching local voices, playback permission and observation of the OS indicator |
| Android installed PWA, iOS/Safari, other browsers, accessibility | **Not verified** | Requires the device acceptance checklist in README |

## Regression coverage

- Consent must be strictly true; consent alone never starts recording/listening.
- Explicit activation, final transcripts, review/edit/send, text-only replies.
- Locale canonicalization and switching; old callbacks cannot restore old-language text.
- Stop, mute, consent withdrawal, deletion and new requests cancel in-flight work.
- Unmuting and natural recognition completion never restart capture.
- Late native results and async responses are ignored after cancellation or deletion.
- Permission denial, missing microphones, no speech, network failures, unsupported
  languages, blocked services, absent native interfaces and insecure contexts.
- Provider start failures, synchronous callbacks, delayed/empty/failed voice
  inventories, exact local-voice selection, playback errors and capture/response/
  playback deadlines.
- A failed response preserves a new draft typed while waiting.
- Seven localized demo responses and Unicode; replay retains the reply's locale.
- Raw recording/inference disabled, memory-only bounded transcript, deletion and
  snapshot isolation.

Speech tests use injected JavaScript doubles. They verify requests, state changes,
error handling and cleanup, **not** that a browser vendor recognizes actual audio
or that a person hears a response. The supplied browser-check script also labels
its speech fixtures separately; it has not completed here.

The planning tests ran on PR #4 commit
`6a0bda468974f771bb18d61870eca9aa9bc5c312`, separately from this prototype. They
establish the checked-out baseline passes; they do not establish a completed voice
integration or inspect the founder's actual phone data. No real user task data
was loaded, changed or deleted.

The initial planner test invocation lacked generated assets. After running its
existing install/build steps, all 25 tests passed. Browser failures remained
environment blockers, not passing results. No deployment or paid activation was
attempted.
