# Afinah multilingual voice prototype

Review-only prototype, prepared November 23, 2026 (America/New_York). No deployment,
paid provider, production configuration, account, task or database changes.

## Run locally

Prerequisite: Node.js 22 or newer. From this branch's repository root:

```sh
node prototypes/voice/serve.mjs
```

Open http://127.0.0.1:4178/ on **the same computer**. No npm install or credentials
are needed for this local preview. A phone cannot use another computer's localhost;
phone testing requires an explicitly approved HTTPS preview deployment.

1. Type a message and select **Send reviewed text** to try the text demo immediately.
2. Choose a conversation language. This clears an unsent draft and stops active work.
3. Read the speech-processing disclosure, then check session consent.
4. Tap **Start microphone** and, if you choose to, allow microphone access in your browser.
5. Speak one short message. Once recognition ends, edit the draft and send it.
6. A localized demo reply appears. With consent and a matching local voice, it is
   read aloud. If automatic playback is blocked, tap **Read reply aloud**.
7. **Stop** cancels capture, pending response and speech. It keeps existing text.
   **Mute microphone & voice** does the same and blocks voice until unmuted.
   Unmuting does not restart the microphone. **Delete session** also clears the
   transcript, draft and consent. Every new page load starts without consent.

Listening is single-turn, never continuous or automatically restarted. Capture
ends after at most 45 seconds; response generation times out after 20 seconds;
playback is canceled after 60 seconds. Stop discards pending recognition results.
Hiding the page stops work; leaving the page clears its session.

## What the prototype does

- Calls browser `SpeechRecognition` / `webkitSpeechRecognition` for speech-to-text.
- Calls `speechSynthesis` for replies, requiring an exact locale-matching voice
  advertised by the browser as local. Remote TTS and wrong-locale substitutions
  are not silently used. English defaults to `en-US`.
- Offers English (US), Spanish (Spain), French (France), Portuguese (Brazil),
  German (Germany), Arabic (Saudi Arabia), and Hindi (India) demo replies.
- Keeps speech and response providers replaceable, with no vendor SDK or API key.
- Requires transcript review and explicit submission before responding.
- Retains at most 40 message entries and a 4,000-character draft in page memory.
  No localStorage, sessionStorage, IndexedDB, cookies, service worker, analytics,
  recorder or audio-upload code is used by the prototype.
- Uses the existing `src/core/voice.js` consent plan. That plan remains unchanged
  and still reports `provider-adapter-required`; production runtime voice has not
  been activated. Only this prototype instantiates the concrete adapter.

The **local demo responder** reflects the reviewed text and asks one fixed
productivity question in the selected language. It is not a conversational model,
translator, medical/psychological assessment, or connection to planning tasks.
Interface labels and error guidance are currently English; only demo conversation
copy is localized. Adding a language option does not certify STT/TTS support.

## Privacy and user control

Raw-audio recording and sensitive inference are disabled, with no enable switch.
The application never receives an audio blob or attempts to infer identity,
emotion, disability, mental health, or medical status from speech characteristics.
Only text explicitly submitted by the user reaches the local demo responder.

**Browser-native does not mean offline or entirely local.** Recognition may send
audio to the browser vendor. Its processing/retention is outside this page's
control and is disclosed before consent. This build does not enable experimental
`processLocally`, download recognition packs, or claim vendor zero retention.
Synthesis uses only voices marked `localService === true`; that is a browser
declaration, not an independent network audit of the operating system.

Deletion clears application references and visible text; it is not guaranteed
secure memory erasure and cannot delete the vendor's prior processing. Cancel
requests stop browser APIs and detach listeners; physical microphone shutdown
still requires checking the browser/OS indicator on actual devices. A browser or
OS accessibility service may process visible text independently.

Late recognition, playback and responder callbacks are invalidated after stop,
mute, consent withdrawal, language switching and deletion. Even a provider that
ignores cancellation cannot append a late response to this session. Future
providers must actually release capture resources as part of their contract.

## Provider contract

`VoiceSession` in `src/core/voice-session.js` depends on:

```js
const provider = {
  listen({ locale, onStart, onTranscript, onEnd, onError }) {
    // Explicitly start one capture. Send only final transcript text.
    // onError receives a stable non-sensitive code, not raw provider diagnostics.
    // Return synchronously, even when recognition will complete asynchronously.
    return () => { /* abort capture, release tracks and detach listeners */ };
  },
  speak({ text, locale, onEnd, onError }) {
    // Start one reply; signal completion or a stable error code.
  },
  cancelSpeech() { /* cancel active and queued output, detach listeners */ }
};
const respond = async ({ text, locale, signal }) => {
  // Only reviewed text is supplied. Honor AbortSignal. Return a text string.
  // Add authorization and policy checks before any task writes or external call.
};
```

`BrowserSpeechProvider.capabilities(locale)` reports interfaces and exact local
voice availability, while leaving recognition language support unverified. Voice
lists can load asynchronously; the UI listens for `voiceschanged`, and playback
checks the inventory again each time. No voice pack installs occur automatically.

To add a demo language, extend `LANGUAGES` in `demo-responder.js` with reviewed
localized copy and tests. The controller accepts canonical BCP-47 language tags,
independently of this seven-language UI list. A production provider must publish
its own tested language/device matrix; do not silently translate or switch locales.

## Verification

```sh
npm test
npm install --ignore-scripts --package-lock=false
npm run check
```

The test command itself uses built-in Node modules and does not require install.
`npm run check` is the existing Worker **dry run**, not a deployment. See
[TEST-RESULTS.md](./TEST-RESULTS.md) for results and execution limits.

The included browser regression script needs Playwright and Chromium in the
developer's test environment. It does not belong in production assets:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node prototypes/voice/browser-check.mjs
```

If using a preinstalled Chromium, set `AFINAH_CHROMIUM_PATH` to that executable.
The suite starts its own loopback server on port 4189. It separates real browser
text checks from injected speech fixtures. Neither fixtures nor feature detection
establish actual speech recognition or audible playback.

## Proposed integration and approval boundary

This branch adds only these paths:

| Path | Purpose |
| --- | --- |
| `src/core/voice-session.js` | Consent-gated session controller and cancellation |
| `src/adapters/browser-speech.js` | Native browser speech implementation |
| `prototypes/voice/` | Standalone UI, local preview server, browser checks, documentation |
| `test/voice-session.test.js` | Controller and privacy regression tests |
| `test/browser-speech.test.js` | Native API adapter regression tests using test doubles |

Base: `afinah-core-engine` at `96160f8105607b302802173d38bfcda9c79c2b7f` (PR #3).
Planning branch inspected separately: `feat/android-todo-pwa` at
`6a0bda468974f771bb18d61870eca9aa9bc5c312` (PR #4). Both PRs were open at inspection.
This proposal does not merge those branches. No existing tracked file is changed.
Website entrypoints, Worker routes, deployment workflows, security headers,
authentication, planner assets, offline service worker and local task keys remain
unchanged. The prototype is not linked from or served by the production Worker.

**Before any deployment:** obtain the owner's explicit approval for a separate
HTTPS test origin and its exact host/project configuration, access restrictions,
cost limit (no paid services), file allowlist and rollback. Do not point the
existing Afinah domain at this prototype. The preview server's security policy is
isolated and does not replace the site's existing policy. A hosted preview must
serve only the UI and its four imported modules, keep no-store headers and block
framing; do not expose this repository root or test files. Browser vendor speech
traffic is not proven blocked by the page's `connect-src 'none'` policy.

After device acceptance, integrating into the planner is a separate reviewed
change: reconcile the open branches, add an opt-in voice view behind existing
authorization, route only reviewed text through authorized action handlers,
preserve the planner's storage and service-worker versioning, and rerun its tests
plus real-device offline/update checks. Do not connect voice directly to task
writes or sensitive-domain tools without their existing consent/capability gates.

Rollback for this proposal: close the draft PR/remove the development branch;
there are no production effects. For any future test deployment, remove the
separate preview deployment and revoke any added provider credentials. Production
rollback must be specified with the later production proposal.

## Exact remaining prerequisites

| Capability | Present implementation | Still required |
| --- | --- | --- |
| Text conversation | Local deterministic replies in seven languages | Browser UI suite and accessibility review on target devices |
| Microphone / STT | Native browser adapter and error handling | HTTPS/localhost, compatible browser, user permission, working microphone, supported recognition language/service; actual speech trials |
| Spoken replies | Exact matching local browser/OS voice | Installed/enabled local voice for each locale, device volume, browser playback allowance; audible trials and stop-indicator checks |
| Offline recognition | Not enabled or claimed | Explicitly designed on-device provider, supported browser/platform, language packs and offline verification |
| Broader language coverage | Extensible provider and locale contracts | Provider language catalog, native-speaker review, per-language recognition/playback tests and UI localization |
| Android installed planner / iOS / desktop | Browser-independent controller | Separate Chrome/PWA/Safari/WebView device testing; native bridges/permissions where Web Speech is unavailable |
| Live coaching / natural conversation | Local fixed prompt only | Approved responder/model, safety boundaries, authorization, server-side credentials if external, retention/cost controls and language-quality validation |
| External STT/TTS | No external adapter or service enabled | Named provider decision, explicit consent disclosure, server-side short-lived authorization, credentials, cost cap and deletion/retention contract; explicit approval before paid enablement |
| Planner actions / account sync | Not connected | Authorized action integration, branch reconciliation, storage regressions, authentication and production approval |

## Device acceptance checklist (not yet executed)

Use fresh consent and harmless test phrases; never sensitive personal data.
Record device/OS/browser/version, locale, voice name, date and actual result.

- English, Spanish and at least one non-Latin language: activate mic, speak,
  verify recognized words, edit, send, hear correct-language reply.
- Deny permission, remove microphone access, disable network, and try an
  unsupported locale: each must retain usable text input and show a useful error.
- Stop while starting/listening/speaking; verify the actual OS mic indicator turns
  off, no late text appears, and no listening restarts without another tap.
- Mute/unmute, switch language during listening and during response, revoke
  consent, hide tab, reload and delete: no stale audio or transcript reappears.
- Delete voice session and update/reopen planner: original tasks, notes, goals,
  recurring routines and offline data remain unchanged.
- Keyboard-only, screen reader and narrow phone layout: labels, focus order,
  status messages, RTL text, controls and transcript review remain usable.

## Technical references

- [SpeechRecognition and browser-managed processing](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Local synthesis voice declaration](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)
- [Abort recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/abort)
- [Cancel synthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/cancel)

Documentation checked November 23, 2026. These APIs describe implementation
options; they do not establish successful operation on a user's device.
