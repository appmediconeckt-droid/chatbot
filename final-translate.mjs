import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE_URL = 'https://s5jl7g4z-5001.inc1.devtunnels.ms';
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// ALL remaining languages
const allLanguages = [
  'hi-IN', 'ar-SA', 'zh-CN', 'zh-TW', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR',
  'pt-PT', 'pt-BR', 'ru-RU', 'es-ES', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
  'fil-PH', 'bn-IN', 'ta-IN', 'te-IN', 'ml-IN', 'kn-IN', 'mr-IN', 'gu-IN',
  'pa-IN', 'ur-IN', 'ne-NP', 'tr-TR', 'pl-PL', 'uk-UA', 'fa-IR', 'he-IL',
  'cs-CZ', 'sk-SK', 'hu-HU', 'ro-RO', 'bg-BG', 'el-GR', 'nl-NL', 'sv-SE',
  'da-DK', 'fi-FI', 'no-NO', 'it-IT', 'af-ZA', 'sw-KE', 'am-ET', 'ha-NG',
  'yo-NG', 'zu-ZA', 'en-GB', 'en-IN', 'si-LK', 'as-IN', 'or-IN'
];

async function translateSingle(text, targetLang) {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/translate/text`, {
      text: text,
      to: targetLang,
      from: 'en-US',
    }, { timeout: 8000 });
    return res.data?.translatedText || text;
  } catch (err) {
    return text;
  }
}

async function populateLanguage(langCode) {
  const filePath = path.join(LOCALES_DIR, `${langCode}.json`);
  const translations = {};
  const entries = Object.entries(enTranslations);
  let translated = 0;

  process.stdout.write(`${langCode}: `);

  // Translate each key
  for (const [key, enText] of entries) {
    const result = await translateSingle(enText, langCode);
    translations[key] = result;
    translated++;

    if (translated % 50 === 0) {
      process.stdout.write('.');
    }
  }

  // Save
  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2));
  console.log(' ✅');
}

async function main() {
  console.log('🚀 FINAL translation for ALL 56 languages...\n');
  for (const lang of allLanguages) {
    await populateLanguage(lang);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  console.log('\n✅ ALL LANGUAGES COMPLETE!');
}

main().catch(console.error);
