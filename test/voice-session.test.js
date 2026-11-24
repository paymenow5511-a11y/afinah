import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceSession, normalizeLocale } from '../src/core/voice-session.js';
import { LANGUAGES, demoRespond } from '../prototypes/voice/demo-responder.js';

function setup(overrides = {}) {
  const calls = { listens: [], speeches: [], canceled: 0, aborted: 0 };
  const provider = {
    listen(options) { calls.listens.push(options); return () => { ++calls.aborted; }; },
    speak(options) { calls.speeches.push(options); },
    cancelSpeech() { ++calls.canceled; }
  };
  const session = new VoiceSession({ provider, respond: demoRespond, ...overrides });
  return { session, provider, calls };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('construction and consent alone never activate the microphone', () => {
  const { session, calls } = setup();
  assert.equal(session.startListening(), false);
  assert.equal(session.state.error, 'consent-required');
  session.setConsent('yes'); assert.equal(session.startListening(), false);
  session.setConsent(true); assert.equal(calls.listens.length, 0);
  session.startListening(); assert.equal(calls.listens.length, 1);
});

test('reviewed text works without microphone consent or speech services', async () => {
  const { session, calls } = setup();
  session.editDraft('Plan my morning'); await session.submit();
  assert.match(session.state.messages[1].text, /one small step/);
  assert.equal(calls.listens.length, 0); assert.equal(calls.speeches.length, 0);
});

test('recognized text stays a draft until explicit submission', async () => {
  const { session, calls } = setup(); session.setConsent(true); session.startListening();
  calls.listens[0].onStart(); calls.listens[0].onTranscript('My next step');
  assert.equal(session.state.status, 'listening');
  assert.equal(session.state.messages.length, 0);
  calls.listens[0].onEnd(); session.editDraft('My reviewed next step'); await session.submit();
  assert.equal(session.state.messages[0].text, 'My reviewed next step');
  assert.equal(calls.speeches.length, 1);
});

test('switching language aborts old recognition and clears an unreviewed draft', () => {
  const { session, calls } = setup(); session.setConsent(true); session.startListening();
  const old = calls.listens[0]; old.onTranscript('old draft');
  session.setLocale('es-es'); old.onTranscript('late transcript'); old.onError('network');
  assert.equal(session.state.locale, 'es-ES'); assert.equal(session.state.draft, '');
  assert.equal(session.state.error, null); assert.equal(calls.aborted, 1);
  assert.equal(calls.listens.length, 1); session.startListening();
  assert.equal(calls.listens[1].locale, 'es-ES');
});

test('invalid locale preserves the current session', () => {
  const { session } = setup(); session.setConsent(true); session.startListening();
  assert.throws(() => session.setLocale('en_US'), /invalid-language/);
  assert.equal(session.state.status, 'starting'); assert.equal(normalizeLocale('hi-in'), 'hi-IN');
});

for (const action of ['stop', 'mute', 'revoke', 'delete', 'language']) {
  test(`${action} cancels work and rejects late results`, async () => {
    let resolve; let signal;
    const { session, calls } = setup({ respond: input => { signal = input.signal; return new Promise(r => { resolve = r; }); } });
    session.setConsent(true); session.startListening(); const old = calls.listens[0];
    old.onTranscript('reviewed'); const pending = session.submit();
    if (action === 'stop') session.stop();
    if (action === 'mute') session.setMuted(true);
    if (action === 'revoke') session.setConsent(false);
    if (action === 'delete') session.deleteSession();
    if (action === 'language') session.setLocale('fr-FR');
    assert.equal(signal.aborted, true);
    resolve('late response'); await pending;
    old.onTranscript('late text'); old.onEnd(); old.onError('network');
    assert.equal(session.state.draft, ''); assert.equal(session.state.status, 'idle');
    assert.equal(session.state.messages.filter(m => m.role === 'assistant').length, 0);
    assert.equal(calls.speeches.length, 0);
    if (action === 'delete') { assert.equal(session.state.messages.length, 0); assert.equal(session.state.consent, false); }
  });
}

test('mute stops both directions; unmute does not restart capture', async () => {
  const { session, calls } = setup(); session.setConsent(true); session.startListening();
  session.setMuted(true); assert.equal(calls.aborted, 1); assert.equal(session.startListening(), false);
  session.editDraft('Still type'); await session.submit(); assert.equal(calls.speeches.length, 0);
  session.setMuted(false); assert.equal(calls.listens.length, 1); assert.equal(calls.speeches.length, 0);
});

test('starting microphone interrupts playback and ignores stale speech events', async () => {
  const { session, calls } = setup(); session.setConsent(true); session.editDraft('Hello'); await session.submit();
  const old = calls.speeches[0]; session.startListening(); calls.listens[0].onStart();
  old.onEnd(); old.onError('late'); assert.equal(session.state.status, 'listening');
  assert.equal(session.state.error, null);
});

test('recognition errors retain text and allow manual retry', () => {
  const { session, calls } = setup(); session.setConsent(true); session.editDraft('Keep me');
  session.startListening(); calls.listens[0].onError('not-allowed');
  assert.equal(session.state.error, 'not-allowed'); assert.equal(session.state.draft, 'Keep me');
  assert.equal(session.state.status, 'idle'); assert.equal(calls.listens.length, 1);
  session.startListening(); assert.equal(calls.listens.length, 2);
});

test('synchronous provider failure and unavailable playback preserve text', async () => {
  const { session, provider } = setup(); session.setConsent(true);
  provider.listen = () => { throw new Error('recognition-unavailable'); };
  assert.equal(session.startListening(), false); assert.equal(session.state.error, 'recognition-unavailable');
  provider.speak = () => { throw new Error('synthesis-unavailable'); };
  session.editDraft('Hello'); await session.submit();
  assert.equal(session.state.messages.length, 2); assert.equal(session.state.error, 'synthesis-unavailable');
});

test('synchronous provider callbacks cannot leave a live capture handle', () => {
  const { session, provider } = setup(); let canceled = 0;
  provider.listen = options => { options.onError('audio-capture'); return () => ++canceled; };
  session.setConsent(true); session.startListening();
  assert.equal(canceled, 1); assert.equal(session.cancelCapture, null);
});

test('an unavailable responder restores the message for text retry', async () => {
  const { session } = setup({ respond: () => { throw new Error('offline'); } });
  session.editDraft('Keep this'); await session.submit();
  assert.equal(session.state.draft, 'Keep this'); assert.equal(session.state.error, 'response-unavailable');
});

test('hanging responders time out and preserve reviewed text', async () => {
  const { session } = setup({ respond: () => new Promise(() => {}), responseTimeoutMs: 5 });
  session.editDraft('Save for retry'); await session.submit();
  assert.equal(session.state.status, 'idle'); assert.equal(session.state.draft, 'Save for retry');
});

test('a failed response does not overwrite text typed while waiting', async () => {
  let reject;
  const { session } = setup({ respond: () => new Promise((_, r) => { reject = r; }) });
  session.editDraft('Sent message'); const pending = session.submit();
  session.editDraft('New unsent draft'); reject(new Error('offline')); await pending;
  assert.equal(session.state.draft, 'New unsent draft');
});

test('second submission interrupts the first response', async () => {
  const resolves = [];
  const { session } = setup({ respond: () => new Promise(r => resolves.push(r)) });
  session.editDraft('first'); const first = session.submit();
  session.editDraft('second'); const second = session.submit();
  resolves[1]('second reply'); await second; resolves[0]('first reply'); await first;
  assert.deepEqual(session.state.messages.filter(m => m.role === 'assistant').map(m => m.text), ['second reply']);
});

test('privacy flags, memory boundaries, transcript limit and deletion', async () => {
  const { session } = setup();
  assert.deepEqual(session.state.privacy, { rawAudioRecording: false, sensitiveInference: false, persistence: 'memory-only' });
  for (let i = 0; i < 25; i++) { session.editDraft(String(i)); await session.submit(); }
  assert.equal(session.state.messages.length, 40);
  const snapshot = session.snapshot(); snapshot.messages[0].text = 'changed';
  assert.notEqual(session.state.messages[0].text, 'changed');
  session.deleteSession(); await tick(); assert.equal(session.state.messages.length, 0);
});

test('all seven demo languages produce localized text and preserve Unicode', async () => {
  for (const language of LANGUAGES) {
    const { session } = setup({ locale: language.locale });
    session.editDraft('خطوة صغيرة · मेरा लक्ष्य'); await session.submit();
    assert.match(session.state.messages[1].text, /خطوة صغيرة/);
    assert.ok(session.state.messages[1].text.endsWith(language.prompt));
  }
  assert.throws(() => demoRespond({ text: 'Hi', locale: 'ja-JP' }), /demo-language-unavailable/);
});

test('replay uses the reply language even after changing the selection', async () => {
  const { session, calls } = setup(); session.setConsent(true); session.setLocale('es-ES');
  session.editDraft('Hola'); await session.submit({ speak: false });
  session.setLocale('en-US'); session.readReply(); assert.equal(calls.speeches[0].locale, 'es-ES');
});
