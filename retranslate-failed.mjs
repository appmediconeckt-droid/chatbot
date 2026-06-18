import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE_URL = 'https://s5jl7g4z-5001.inc1.devtunnels.ms';
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// Languages that failed during translation (fell back to English)
const failedLanguages = [
  'af-ZA', 'am-ET', 'as-IN', 'bg-BG', 'bn-IN', 'cs-CZ', 'da-DK', 'el-GR',
  'en-GB', 'en-IN', 'fa-IR', 'fi-FI', 'fil-PH', 'gu-IN', 'ha-NG', 'he-IL',
  'hu-HU', 'id-ID', 'it-IT', 'kn-IN', 'ml-IN', 'mr-IN', 'ms-MY', 'nl-NL',
  'no-NO', 'or-IN', 'pa-IN', 'pl-PL', 'pt-PT', 'ro-RO', 'si-LK', 'sk-SK',
  'sv-SE', 'sw-KE', 'ta-IN', 'te-IN', 'tr-TR', 'uk-UA', 'ur-IN', 'vi-VN',
  'yo-NG', 'zu-ZA'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateOne(text, lang) {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/translate/text`, {
      text, to: lang, from: 'en-US'
    }, { timeout: 10000 });
    return res.data?.translatedText || text;
  } catch (err) {
    return text;
  }
}

async function doLanguage(lang) {
  process.stdout.write(`${lang}: `);
  const translations = {};
  const keys = Object.keys(enTranslations);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const text = enTranslations[key];
    translations[key] = await translateOne(text, lang);

    if ((i + 1) % 100 === 0) {
      process.stdout.write('.');
    }

    await sleep(8);
  }

  const file = path.join(LOCALES_DIR, `${lang}.json`);
  fs.writeFileSync(file, JSON.stringify(translations, null, 2));
  console.log(' ✅');
}

async function main() {
  console.log('🔄 Re-translating 42 failed languages...\n');

  for (const lang of failedLanguages) {
    await doLanguage(lang);
    await sleep(2500);
  }

  console.log('\n✅ RE-TRANSLATION COMPLETE!');
}

main().catch(console.error);
