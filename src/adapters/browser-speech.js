// No MediaRecorder, audio upload, credentials, telemetry or persistent storage.
// Native recognition may use the browser vendor's remote service.
export class BrowserSpeechProvider {
  constructor(host = globalThis, { captureTimeoutMs = 45000, speechTimeoutMs = 60000 } = {}) {
    this.host = host;
    this.captureTimeoutMs = captureTimeoutMs;
    this.speechTimeoutMs = speechTimeoutMs;
  }
  capabilities(locale) {
    let voices = [];
    try { voices = this.host.speechSynthesis?.getVoices() || []; }
    catch { /* A failed voice inventory must never prevent the text UI rendering. */ }
    return {
      recognition: Boolean(this.host.isSecureContext &&
        (this.host.SpeechRecognition || this.host.webkitSpeechRecognition)),
      recognitionLanguage: 'unverified-until-device-test',
      recognitionProcessing: 'browser-managed-may-be-remote',
      synthesis: Boolean(this.host.speechSynthesis && this.host.SpeechSynthesisUtterance),
      localVoice: voices.some(v => v.localService === true && v.lang.toLowerCase() === locale.toLowerCase()),
      rawAudioRecording: false, sensitiveInference: false
    };
  }
  listen({ locale, onStart, onTranscript, onEnd, onError }) {
    if (!this.host.isSecureContext) throw new Error('secure-context-required');
    const Recognition = this.host.SpeechRecognition || this.host.webkitSpeechRecognition;
    if (!Recognition) throw new Error('recognition-unavailable');
    const recognition = new Recognition();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let active = true;
    let timer;
    const cleanup = (abort) => {
      if (!active) return;
      active = false;
      this.host.clearTimeout(timer);
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      if (abort) { try { recognition.abort(); } catch { /* Already ended. */ } }
    };
    recognition.onstart = () => { if (active) onStart(); };
    recognition.onresult = event => {
      if (!active) return;
      const text = Array.from(event.results).filter(r => r.isFinal).map(r => r[0].transcript).join(' ');
      if (text.trim()) onTranscript(text);
    };
    recognition.onerror = event => {
      if (!active) return;
      cleanup(true); onError(event.error || 'recognition-failed');
    };
    recognition.onend = () => { if (active) { cleanup(false); onEnd(); } };
    timer = this.host.setTimeout(() => {
      if (active) { cleanup(true); onError('capture-timeout'); }
    }, this.captureTimeoutMs);
    try { recognition.start(); }
    catch (error) { cleanup(true); throw new Error(error.name === 'NotAllowedError' ? 'not-allowed' : 'recognition-failed'); }
    return () => cleanup(true);
  }
  speak({ text, locale, onEnd, onError }) {
    this.cancelSpeech();
    const synth = this.host.speechSynthesis;
    if (!synth || !this.host.SpeechSynthesisUtterance) throw new Error('synthesis-unavailable');
    // Require a matching local voice; never silently use a remote voice or wrong accent.
    const voice = synth.getVoices().find(v => v.localService === true && v.lang.toLowerCase() === locale.toLowerCase());
    if (!voice) throw new Error('local-voice-unavailable');
    const utterance = new this.host.SpeechSynthesisUtterance(text);
    utterance.lang = locale; utterance.voice = voice; utterance.rate = 1;
    let active = true;
    let timer;
    const cleanup = () => {
      if (!active) return;
      active = false; this.host.clearTimeout(timer);
      utterance.onend = utterance.onerror = null;
      this.cancelUtterance = null;
    };
    utterance.onend = () => { if (active) { cleanup(); onEnd(); } };
    utterance.onerror = event => { if (active) { cleanup(); onError(event.error ? `playback-${event.error}` : 'synthesis-failed'); } };
    this.cancelUtterance = cleanup;
    timer = this.host.setTimeout(() => {
      if (active) { this.cancelSpeech(); onError('speech-timeout'); }
    }, this.speechTimeoutMs);
    try { synth.speak(utterance); }
    catch { this.cancelSpeech(); throw new Error('synthesis-failed'); }
  }
  cancelSpeech() {
    this.cancelUtterance?.();
    this.host.speechSynthesis?.cancel();
  }
}
