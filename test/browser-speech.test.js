import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserSpeechProvider } from '../src/adapters/browser-speech.js';

function setup() {
  const recognitions = []; const utterances = []; const timers = new Map();
  let nextTimer = 0; let cancellations = 0;
  class Recognition {
    constructor() { recognitions.push(this); this.aborted = 0; }
    start() { this.started = true; }
    abort() { ++this.aborted; }
  }
  const host = { isSecureContext: true, SpeechRecognition: Recognition,
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: { getVoices: () => [{ lang: 'en-US', localService: true }, { lang: 'es-ES', localService: true }],
      speak(utterance) { utterances.push(utterance); }, cancel() { ++cancellations; } }
  };
  const provider = new BrowserSpeechProvider(host);
  const events = [];
  const options = { locale: 'en-US', onStart: () => events.push('start'), onTranscript: text => events.push(text),
    onEnd: () => events.push('end'), onError: code => events.push(code) };
  return { host, provider, recognitions, utterances, timers, events, options, cancellations: () => cancellations };
}

test('feature detection does not instantiate or start speech', () => {
  const s = setup(); assert.equal(s.provider.capabilities('en-US').localVoice, true);
  assert.equal(s.provider.capabilities('ar-SA').localVoice, false); assert.equal(s.recognitions.length, 0);
  delete s.host.SpeechRecognition; assert.equal(s.provider.capabilities('en-US').recognition, false);
});

test('voice inventory failure does not break text capability rendering', () => {
  const s = setup(); s.host.speechSynthesis.getVoices = () => { throw new Error('service unavailable'); };
  assert.equal(s.provider.capabilities('en-US').localVoice, false);
});

test('secure context and unavailable speech fail without microphone access', () => {
  const s = setup(); s.host.isSecureContext = false;
  assert.throws(() => s.provider.listen(s.options), /secure-context-required/);
  s.host.isSecureContext = true; delete s.host.SpeechRecognition;
  assert.throws(() => s.provider.listen(s.options), /recognition-unavailable/);
  assert.equal(s.recognitions.length, 0);
});

test('prefixed recognition, locale and final-only review transcripts', () => {
  const s = setup(); s.host.webkitSpeechRecognition = s.host.SpeechRecognition; delete s.host.SpeechRecognition;
  s.provider.listen({ ...s.options, locale: 'es-ES' }); const r = s.recognitions[0];
  assert.equal(r.lang, 'es-ES'); assert.equal(r.continuous, false); assert.equal(r.interimResults, false);
  r.onstart(); r.onresult({ results: [Object.assign([{ transcript: 'Hola' }], { isFinal: true }),
    Object.assign([{ transcript: 'interim' }], { isFinal: false })] }); r.onend();
  assert.deepEqual(s.events, ['start', 'Hola', 'end']); assert.equal(s.timers.size, 0);
});

for (const code of ['not-allowed', 'audio-capture', 'network', 'no-speech', 'language-not-supported', 'service-not-allowed', 'aborted']) {
  test(`native ${code} stops capture without auto retry`, () => {
    const s = setup(); s.provider.listen(s.options); const r = s.recognitions[0];
    r.onerror({ error: code }); assert.deepEqual(s.events, [code]);
    assert.equal(r.aborted, 1); assert.equal(s.timers.size, 0); assert.equal(s.recognitions.length, 1);
  });
}

test('abort detaches listeners and ignores already queued native events', () => {
  const s = setup(); const cancel = s.provider.listen(s.options); const r = s.recognitions[0];
  const queued = r.onresult; const queuedStart = r.onstart;
  cancel(); queuedStart(); queued({ results: [Object.assign([{ transcript: 'late' }], { isFinal: true })] });
  cancel(); assert.equal(r.aborted, 1); assert.equal(r.onresult, null); assert.deepEqual(s.events, []);
});

test('capture deadline aborts a speech service that never finishes', () => {
  const s = setup(); s.provider.listen(s.options); [...s.timers.values()][0]();
  assert.deepEqual(s.events, ['capture-timeout']); assert.equal(s.recognitions[0].aborted, 1);
});

test('start throws permission denial and cleans up timers', () => {
  const s = setup(); s.host.SpeechRecognition.prototype.start = () => { throw Object.assign(new Error(), { name: 'NotAllowedError' }); };
  assert.throws(() => s.provider.listen(s.options), /not-allowed/); assert.equal(s.timers.size, 0);
});

test('speech uses an exact matching local voice', () => {
  const s = setup(); s.provider.speak({ ...s.options, text: 'Hola', locale: 'es-ES' });
  const u = s.utterances[0]; assert.equal(u.lang, 'es-ES'); assert.equal(u.voice.localService, true);
  u.onend(); assert.deepEqual(s.events, ['end']); assert.equal(s.timers.size, 0);
});

test('remote voices and wrong accents do not silently substitute', () => {
  const s = setup(); s.host.speechSynthesis.getVoices = () => [
    { lang: 'en-US', localService: false }, { lang: 'en-GB', localService: true }];
  assert.throws(() => s.provider.speak({ ...s.options, text: 'Hello' }), /local-voice-unavailable/);
  assert.equal(s.utterances.length, 0);
});

test('empty then asynchronously loaded voice lists are reevaluated on retry', () => {
  const s = setup(); s.host.speechSynthesis.getVoices = () => [];
  assert.throws(() => s.provider.speak({ ...s.options, text: 'Hi' }), /local-voice-unavailable/);
  s.host.speechSynthesis.getVoices = () => [{ lang: 'en-US', localService: true }];
  s.provider.speak({ ...s.options, text: 'Hi' }); assert.equal(s.utterances.length, 1);
});

test('cancel invalidates queued playback events', () => {
  const s = setup(); s.provider.speak({ ...s.options, text: 'Hi' }); const oldEnd = s.utterances[0].onend;
  s.provider.cancelSpeech(); oldEnd(); assert.equal(s.timers.size, 0); assert.deepEqual(s.events, []);
});

test('playback permission failures are distinguished from microphone denial', () => {
  const s = setup(); s.provider.speak({ ...s.options, text: 'Hi' });
  s.utterances[0].onerror({ error: 'not-allowed' });
  assert.deepEqual(s.events, ['playback-not-allowed']); assert.equal(s.timers.size, 0);
});

test('playback timeout cancels queued speech and returns to text', () => {
  const s = setup(); s.provider.speak({ ...s.options, text: 'Hi' }); [...s.timers.values()][0]();
  assert.deepEqual(s.events, ['speech-timeout']); assert.equal(s.timers.size, 0);
});

test('unavailable or throwing synthesis fails cleanly', () => {
  const s = setup(); s.host.speechSynthesis.speak = () => { throw new Error('unavailable'); };
  assert.throws(() => s.provider.speak({ ...s.options, text: 'Hi' }), /synthesis-failed/);
  assert.equal(s.timers.size, 0); delete s.host.speechSynthesis;
  assert.throws(() => s.provider.speak({ ...s.options, text: 'Hi' }), /synthesis-unavailable/);
});
