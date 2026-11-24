import { VoiceSession } from '../../src/core/voice-session.js';
import { BrowserSpeechProvider } from '../../src/adapters/browser-speech.js';
import { LANGUAGES, demoRespond } from './demo-responder.js';

const byId = id => document.getElementById(id);
const provider = new BrowserSpeechProvider(window);
const errors = {
  'consent-required': 'Enable session consent before using voice. You can still type.',
  muted: 'Voice is muted. Unmute, then tap Start microphone when you are ready.',
  'not-allowed': 'Microphone permission was denied. Change the site permission in your browser, or type below.',
  'service-not-allowed': 'Your browser has blocked its speech service. You can type below.',
  'audio-capture': 'No usable microphone was found. Check the microphone or type below.',
  network: 'The browser speech service could not connect. Try again when ready, or type below.',
  'no-speech': 'No speech was detected. Tap Start microphone to try again, or type.',
  aborted: 'Listening was interrupted. Tap Start microphone when ready.',
  'language-not-supported': 'The speech service does not support this language here. Choose another or use text.',
  'language-unavailable': 'This language is unavailable in the speech service. Text still works.',
  'recognition-unavailable': 'Speech recognition is unavailable in this browser. Please use text.',
  'secure-context-required': 'Microphone use requires HTTPS or localhost. Text remains available.',
  'local-voice-unavailable': 'No matching on-device voice is available yet. Enable a device voice for this language and tap Read reply aloud again. Your reply is below.',
  'synthesis-unavailable': 'Spoken playback is unavailable. Your reply is still readable below.',
  'playback-not-allowed': 'Playback was blocked. Tap Read reply aloud to try again.',
  'response-unavailable': 'The response could not finish. Your sent message remains in the transcript, and any draft is preserved for another try.',
  'capture-timeout': 'Listening stopped after 45 seconds. Review any captured text or tap Start microphone again.',
  'speech-timeout': 'Playback did not finish. Your reply is available as text.'
};
for (const language of LANGUAGES) {
  const option = document.createElement('option');
  option.value = language.locale; option.textContent = language.label;
  byId('language').append(option);
}
function capabilities(locale) {
  const c = provider.capabilities(locale);
  byId('capabilities').textContent = `Microphone interface: ${c.recognition ? 'available; language needs a device test' : 'unavailable'}. Matching local voice: ${c.localVoice ? 'available' : 'not currently available'}.`;
}
const session = new VoiceSession({ provider, respond: demoRespond, onChange: render });
function render(state) {
  byId('consent').checked = state.consent;
  byId('mute').setAttribute('aria-pressed', String(state.muted));
  byId('mute').textContent = state.muted ? 'Unmute microphone & voice' : 'Mute microphone & voice';
  const capturing = state.status === 'starting' || state.status === 'listening';
  byId('listen').disabled = !state.consent || state.muted || capturing;
  byId('read').disabled = !state.consent || state.muted || !state.messages.some(m => m.role === 'assistant');
  byId('send').disabled = !state.draft.trim();
  byId('draft').disabled = capturing;
  if (byId('draft').value !== state.draft) byId('draft').value = state.draft;
  byId('draft').lang = state.locale;
  byId('language').value = state.locale;
  const statuses = { idle: 'Ready · Microphone off', starting: 'Starting microphone…',
    listening: 'Listening · Microphone active', responding: 'Preparing response · Microphone off',
    speaking: 'Reading reply · Microphone off' };
  byId('status').textContent = state.muted ? 'Muted · Microphone and voice off' : statuses[state.status];
  byId('error').hidden = !state.error;
  byId('error').textContent = errors[state.error] || (state.error ? 'Speech service interrupted or unavailable. Your text remains available; retry when ready.' : '');
  const items = state.messages.map(message => {
    const item = document.createElement('li'); item.dataset.role = message.role;
    const label = document.createElement('strong'); label.textContent = message.role === 'user' ? 'You' : 'Afinah · local demo';
    const body = document.createElement('span'); body.textContent = message.text;
    body.lang = message.locale; body.dir = 'auto';
    item.append(label, body); return item;
  });
  byId('transcript').replaceChildren(...items);
  byId('empty').hidden = items.length > 0;
  capabilities(state.locale);
}
byId('consent').addEventListener('change', e => session.setConsent(e.target.checked));
byId('language').addEventListener('change', e => session.setLocale(e.target.value));
byId('listen').addEventListener('click', () => session.startListening());
byId('stop').addEventListener('click', () => session.stop());
byId('mute').addEventListener('click', () => session.setMuted(!session.state.muted));
byId('read').addEventListener('click', () => session.readReply());
byId('draft').addEventListener('input', e => session.editDraft(e.target.value));
byId('review-form').addEventListener('submit', e => { e.preventDefault(); void session.submit({ speak: byId('auto-read').checked }); });
byId('delete').addEventListener('click', () => { session.deleteSession(); byId('draft').focus(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) session.stop(); });
window.addEventListener('pagehide', () => session.deleteSession());
window.speechSynthesis?.addEventListener('voiceschanged', () => capabilities(session.state.locale));
render(session.snapshot());
