import { voiceSessionPlan } from './voice.js';

export const VOICE_PRIVACY = Object.freeze({
  rawAudioRecording: false, sensitiveInference: false, persistence: 'memory-only'
});

export function normalizeLocale(locale) {
  if (typeof locale !== 'string' || !locale.trim()) throw new Error('invalid-language');
  try { return Intl.getCanonicalLocales(locale)[0]; }
  catch { throw new Error('invalid-language'); }
}

// Provider-independent state machine. Providers may never auto-restart capture.
// Audio stays inside the speech adapter; only reviewed text reaches respond().
export class VoiceSession {
  constructor({ provider, respond, locale = 'en-US', onChange = () => {}, responseTimeoutMs = 20000 }) {
    this.provider = provider;
    this.respond = respond;
    this.onChange = onChange;
    this.responseTimeoutMs = responseTimeoutMs;
    this.epoch = 0;
    this.state = { locale: normalizeLocale(locale), consent: false, muted: false,
      status: 'idle', draft: '', messages: [], error: null, privacy: VOICE_PRIVACY };
  }
  snapshot() { return structuredClone(this.state); }
  emit() { this.onChange(this.snapshot()); }
  update(values) { Object.assign(this.state, values); this.emit(); }
  invalidate() {
    ++this.epoch; // Invalidate callbacks BEFORE abort, which may invoke callbacks synchronously.
    this.pending?.abort(); this.pending = null;
    const cancel = this.cancelCapture; this.cancelCapture = null;
    try { cancel?.(); } catch { /* Text remains usable even if a provider fails to cancel. */ }
    try { this.provider.cancelSpeech(); } catch { /* Never block privacy controls. */ }
  }
  stop() { this.invalidate(); this.update({ status: 'idle', error: null }); }
  setConsent(consent) {
    this.invalidate();
    this.update({ consent: consent === true, status: 'idle', error: null });
  }
  setMuted(muted) {
    this.invalidate();
    this.update({ muted: Boolean(muted), status: 'idle', error: null });
  }
  setLocale(locale) {
    const canonical = normalizeLocale(locale); // Invalid input must not alter a running session.
    this.invalidate();
    this.update({ locale: canonical, draft: '', status: 'idle', error: null });
  }
  editDraft(text) { this.update({ draft: String(text).slice(0, 4000) }); }
  voiceAllowed() {
    const plan = voiceSessionPlan({ consent: this.state.consent, locale: this.state.locale });
    if (!plan.ok) { this.update({ error: plan.reason }); return false; }
    if (this.state.muted) { this.update({ error: 'muted' }); return false; }
    return true;
  }
  fail(code) {
    this.invalidate();
    this.update({ status: 'idle', error: code || 'service-unavailable' });
  }
  startListening() {
    if (!this.voiceAllowed()) return false;
    this.invalidate();
    const token = this.epoch;
    this.update({ status: 'starting', error: null });
    try {
      const cancel = this.provider.listen({
        locale: this.state.locale,
        onStart: () => { if (token === this.epoch) this.update({ status: 'listening' }); },
        onTranscript: text => {
          if (token === this.epoch) this.update({ draft: String(text).slice(0, 4000) });
        },
        onEnd: () => {
          if (token === this.epoch) {
            this.cancelCapture = null;
            ++this.epoch;
            this.update({ status: 'idle' });
          }
        },
        onError: code => { if (token === this.epoch) this.fail(code); }
      });
      // Some providers invoke callbacks before returning their cancel function.
      if (token === this.epoch) this.cancelCapture = cancel;
      else cancel?.();
      return true;
    } catch (error) { if (token === this.epoch) this.fail(error.message); return false; }
  }
  async submit({ speak = true } = {}) {
    const text = this.state.draft.trim();
    if (!text) return false;
    this.invalidate();
    const token = this.epoch;
    const locale = this.state.locale;
    const pending = new AbortController(); this.pending = pending;
    let timer;
    this.update({ status: 'responding', error: null, draft: '',
      messages: [...this.state.messages, { role: 'user', text, locale }].slice(-40) });
    try {
      const canceled = new Promise((_, reject) => {
        pending.signal.addEventListener('abort', () => reject(new Error('response-canceled')), { once: true });
        timer = setTimeout(() => pending.abort(), this.responseTimeoutMs);
      });
      const answer = await Promise.race([this.respond({ text, locale, signal: pending.signal }), canceled]);
      if (token !== this.epoch) return false;
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('response-unavailable');
      this.pending = null;
      this.update({ status: 'idle', messages: [...this.state.messages,
        { role: 'assistant', text: answer.slice(0, 4000), locale }].slice(-40) });
      if (speak && this.state.consent && !this.state.muted) this.readReply();
      return true;
    } catch {
      if (token === this.epoch) {
        this.pending = null;
        this.update({ status: 'idle', error: 'response-unavailable', draft: this.state.draft || text });
      }
      return false;
    } finally { clearTimeout(timer); }
  }
  readReply() {
    if (!this.voiceAllowed()) return false;
    const message = this.state.messages.findLast(m => m.role === 'assistant');
    if (!message) return false;
    this.invalidate();
    const token = this.epoch;
    this.update({ status: 'speaking', error: null });
    try {
      this.provider.speak({ text: message.text, locale: message.locale,
        onEnd: () => { if (token === this.epoch) { ++this.epoch; this.update({ status: 'idle' }); } },
        onError: code => { if (token === this.epoch) this.fail(code); }
      });
      return true;
    } catch (error) { if (token === this.epoch) this.fail(error.message); return false; }
  }
  deleteSession() {
    this.invalidate();
    this.update({ consent: false, muted: false, status: 'idle', draft: '', messages: [], error: null });
  }
}
