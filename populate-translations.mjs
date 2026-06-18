import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE_URL = 'https://s5jl7g4z-5001.inc1.devtunnels.ms';
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');

// Read English translations
const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// Language codes
const languages = [
  'hi-IN', 'ar-SA', 'zh-CN', 'zh-TW', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR',
  'pt-PT', 'pt-BR', 'ru-RU', 'es-ES', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
  'fil-PH', 'bn-IN', 'ta-IN', 'te-IN', 'ml-IN', 'kn-IN', 'mr-IN', 'gu-IN',
  'pa-IN', 'ur-IN', 'ne-NP', 'tr-TR', 'pl-PL', 'uk-UA', 'fa-IR', 'he-IL',
  'cs-CZ', 'sk-SK', 'hu-HU', 'ro-RO', 'bg-BG', 'el-GR', 'nl-NL', 'sv-SE',
  'da-DK', 'fi-FI', 'no-NO', 'it-IT', 'af-ZA', 'sw-KE', 'am-ET', 'ha-NG', 'yo-NG', 'zu-ZA'
];

async function translateText(text, targetLang) {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/translate/text`, {
      text: text,
      to: targetLang,
      from: 'en-US',
    });
    return res.data?.translatedText || text;
  } catch (err) {
    console.error(`Failed to translate to ${targetLang}:`, err.message);
    return text;
  }
}

async function populateLanguageFile(langCode) {
  console.log(`📝 Translating to ${langCode}...`);

  const existingPath = path.join(LOCALES_DIR, `${langCode}.json`);
  let existingData = {};

  // Load existing translations if file exists
  if (fs.existsSync(existingPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(existingPath, 'utf-8'));
    } catch (e) {
      console.warn(`Could not parse existing ${langCode}.json`);
    }
  }

  const translations = {};
  let count = 0;

  for (const [key, enText] of Object.entries(enTranslations)) {
    // Skip if already has a non-English translation
    if (existingData[key] && existingData[key] !== enText) {
      translations[key] = existingData[key];
      continue;
    }

    // Translate from English
    const translatedText = await translateText(enText, langCode);
    translations[key] = translatedText;
    count++;

    // Add delay to avoid rate limiting
    if (count % 10 === 0) {
      console.log(`  ✓ ${count} keys translated`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Save to file
  fs.writeFileSync(existingPath, JSON.stringify(translations, null, 2), 'utf-8');
  console.log(`✅ ${langCode}.json updated with ${count} translations\n`);
}

async function main() {
  console.log('🚀 Starting translation population...\n');

  for (const lang of languages) {
    await populateLanguageFile(lang);
    await new Promise(resolve => setTimeout(resolve, 300)); // Delay between languages
  }

  console.log('✅ All language files populated!');
}

main().catch(console.error);
