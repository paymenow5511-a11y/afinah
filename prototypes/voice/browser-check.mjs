// Optional browser regression suite. Requires Playwright + its Chromium browser.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright` : 'playwright');
const port = '4189';
const server = spawn(process.execPath, [new URL('./serve.mjs', import.meta.url).pathname], {
  env: { ...process.env, AFINAH_VOICE_PORT: port }, stdio: ['ignore', 'pipe', 'inherit']
});
let browser;
const results = [];
const check = (name, detail) => { results.push({ name, detail }); console.log(`PASS: ${name}${detail ? ` — ${detail}` : ''}`); };
try {
  await once(server.stdout, 'data');
  browser = await chromium.launch({ headless: true,
    ...(process.env.AFINAH_CHROMIUM_PATH ? { executablePath: process.env.AFINAH_CHROMIUM_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  const url = `http://127.0.0.1:${port}/`;
  await page.goto(url);
  await page.locator('#capabilities').waitFor();
  const native = await page.evaluate(() => ({
    recognitionExposed: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    synthesisExposed: Boolean(window.speechSynthesis), voices: window.speechSynthesis?.getVoices().length || 0,
    secure: window.isSecureContext, userAgent: navigator.userAgent
  }));
  console.log(`NATIVE FEATURE OBSERVATION (not live audio verification): ${JSON.stringify(native)}`);
  assert.equal(await page.locator('#listen').isDisabled(), true);
  await page.locator('#draft').fill('Make time for a walk'); await page.locator('#send').click();
  assert.match(await page.locator('#transcript').innerText(), /one small step/);
  check('Native browser text flow without voice consent');
  for (const [locale, expected] of [['es-ES', 'pequeño paso'], ['fr-FR', 'petite étape'], ['pt-BR', 'pequeno passo'],
    ['de-DE', 'kleinen Schritt'], ['ar-SA', 'الخطوة الصغيرة'], ['hi-IN', 'छोटा कदम']]) {
    await page.selectOption('#language', locale);
    await page.locator('#draft').fill('My goal · هدفي'); await page.locator('#send').click();
    assert.ok((await page.locator('#transcript li').last().innerText()).includes(expected));
  }
  check('All seven localized text flows and Unicode rendering');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  check('390px mobile layout without horizontal overflow');
  await page.setViewportSize({ width: 1280, height: 900 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  check('1280px desktop layout without horizontal overflow');
  await page.selectOption('#language', 'en-US');
  await page.locator('#draft').fill('<img src=x onerror="window.injected=true">'); await page.locator('#send').click();
  assert.equal(await page.locator('#transcript img').count(), 0);
  assert.equal(await page.evaluate(() => window.injected), undefined);
  check('Transcript is rendered as text, not executable HTML');
  await page.evaluate(() => {
    localStorage.setItem('afinah-planner-regression-sentinel', '{"task":"untouched"}');
    sessionStorage.setItem('other-app', 'untouched');
  });
  await page.locator('#delete').click();
  assert.equal(await page.locator('#transcript li').count(), 0);
  assert.equal(await page.locator('#consent').isChecked(), false);
  assert.equal(await page.evaluate(() => localStorage.getItem('afinah-planner-regression-sentinel')), '{"task":"untouched"}');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('other-app')), 'untouched');
  await page.reload(); assert.equal(await page.locator('#transcript li').count(), 0);
  assert.equal(await page.locator('#consent').isChecked(), false);
  check('Delete and reload clear voice state while preserving unrelated storage');
  assert.equal(requests.some(request => !request.startsWith(`http://127.0.0.1:${port}/`)), false);
  assert.equal(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length)), 0);
  check('Text flow makes no external requests and registers no service worker');
  const headers = await page.request.get(url);
  assert.match(headers.headers()['content-security-policy'], /connect-src 'none'/);
  assert.equal((await page.request.get(`${url}package.json`)).status(), 404);
  check('Preview restricts file serving and sets security headers');

  // Deterministic native-API fixtures verify browser wiring; they are NOT real STT/TTS.
  const fixture = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await fixture.addInitScript(() => {
    window.fixture = { recognitions: [], spoken: [], canceled: 0 };
    class Recognition {
      constructor() { window.fixture.recognitions.push(this); }
      start() { queueMicrotask(() => this.onstart?.()); }
      abort() { this.aborted = true; }
    }
    Object.defineProperty(window, 'SpeechRecognition', { value: Recognition });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } } });
    Object.defineProperty(window, 'speechSynthesis', { value: {
      getVoices: () => [{ lang: 'en-US', localService: true }, { lang: 'es-ES', localService: true }],
      speak(utterance) { window.fixture.spoken.push(utterance); }, cancel() { ++window.fixture.canceled; }, addEventListener() {}
    } });
  });
  const voice = await fixture.newPage(); voice.on('pageerror', error => errors.push(error.message));
  await voice.goto(url); await voice.locator('#consent').check();
  assert.equal(await voice.evaluate(() => fixture.recognitions.length), 0);
  await voice.locator('#listen').click();
  await voice.waitForFunction(() => document.getElementById('status').textContent.includes('active'));
  await voice.evaluate(() => {
    const r = fixture.recognitions[0];
    r.onresult({ results: [Object.assign([{ transcript: 'Recognized draft' }], { isFinal: true })] });
    r.onend();
  });
  assert.equal(await voice.locator('#draft').inputValue(), 'Recognized draft');
  assert.equal(await voice.locator('#transcript li').count(), 0);
  await voice.locator('#draft').fill('Reviewed message'); await voice.locator('#send').click();
  assert.equal(await voice.evaluate(() => fixture.spoken.length), 1);
  assert.equal(await voice.evaluate(() => fixture.spoken[0].lang), 'en-US');
  check('Fixture: consent, explicit activation, review and spoken response wiring');
  await voice.locator('#listen').click(); await voice.selectOption('#language', 'es-ES');
  assert.equal(await voice.evaluate(() => fixture.recognitions.at(-1).aborted), true);
  await voice.locator('#listen').click(); assert.equal(await voice.evaluate(() => fixture.recognitions.at(-1).lang), 'es-ES');
  await voice.evaluate(() => fixture.recognitions.at(-1).onerror({ error: 'not-allowed' }));
  assert.match(await voice.locator('#error').innerText(), /permission was denied/);
  await voice.locator('#draft').fill('Texto de respaldo'); await voice.locator('#send').click();
  assert.equal(await voice.evaluate(() => fixture.spoken.at(-1).lang), 'es-ES');
  check('Fixture: language change, microphone denial and text recovery');
  await voice.locator('#mute').click(); assert.equal(await voice.locator('#listen').isDisabled(), true);
  await voice.locator('#mute').click(); assert.equal(await voice.evaluate(() => fixture.recognitions.length), 3);
  await voice.locator('#stop').click(); await voice.locator('#delete').click();
  assert.equal(await voice.locator('#transcript li').count(), 0);
  assert.equal(await voice.locator('#consent').isChecked(), false);
  check('Fixture: mute, stop and session deletion');

  const unavailable = await browser.newContext();
  await unavailable.addInitScript(() => {
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined });
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined });
    Object.defineProperty(window, 'speechSynthesis', { value: undefined });
  });
  const fallback = await unavailable.newPage(); await fallback.goto(url);
  await fallback.locator('#consent').check(); await fallback.locator('#listen').click();
  assert.match(await fallback.locator('#error').innerText(), /unavailable/);
  await fallback.locator('#draft').fill('Still works'); await fallback.locator('#send').click();
  assert.equal(await fallback.locator('#transcript li').count(), 2);
  check('Missing native services retain a working text conversation');
  assert.deepEqual(errors, []);
  console.log(`Browser checks passed: ${results.length}. Real microphone recognition and audible output were NOT tested.`);
} finally {
  await browser?.close(); server.kill();
}
