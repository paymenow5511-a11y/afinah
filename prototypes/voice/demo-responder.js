export const LANGUAGES = Object.freeze([
  { locale: 'en-US', label: 'English (United States)', prompt: 'What is one small step you would like to take next?', heard: 'You shared:' },
  { locale: 'es-ES', label: 'Español (España)', prompt: '¿Cuál es un pequeño paso que te gustaría dar ahora?', heard: 'Has compartido:' },
  { locale: 'fr-FR', label: 'Français (France)', prompt: 'Quelle petite étape aimeriez-vous entreprendre maintenant ?', heard: 'Vous avez partagé :' },
  { locale: 'pt-BR', label: 'Português (Brasil)', prompt: 'Qual pequeno passo você gostaria de dar agora?', heard: 'Você compartilhou:' },
  { locale: 'de-DE', label: 'Deutsch (Deutschland)', prompt: 'Welchen kleinen Schritt möchten Sie als Nächstes machen?', heard: 'Sie haben mitgeteilt:' },
  { locale: 'ar-SA', label: 'العربية (السعودية)', prompt: 'ما الخطوة الصغيرة التي ترغب في اتخاذها الآن؟', heard: 'لقد شاركت:' },
  { locale: 'hi-IN', label: 'हिन्दी (भारत)', prompt: 'अब आप कौन सा छोटा कदम उठाना चाहेंगे?', heard: 'आपने बताया:' }
]);

// Intentionally bounded local demo, not a model, translator, diagnosis or task writer.
// The transport/controller accepts any BCP-47 locale; demo copy is explicitly limited.
export function demoRespond({ text, locale }) {
  const language = LANGUAGES.find(item => item.locale === locale);
  if (!language) throw new Error('demo-language-unavailable');
  return `${language.heard} ${text}\n\n${language.prompt}`;
}
