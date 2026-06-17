import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');
const API_BASE_URL = 'https://s5jl7g4z-5001.inc1.devtunnels.ms';

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// Remaining languages (prioritized by user request)
const remaining = [
  'ne-NP', 'th-TH', 'vi-VN', 'id-ID', 'ta-IN', 'te-IN', 'ml-IN', 'kn-IN',
  'bn-IN', 'gu-IN', 'mr-IN', 'pa-IN', 'ur-IN', 'pl-PL', 'cs-CZ', 'tr-TR',
  'he-IL', 'fa-IR', 'uk-UA', 'ro-RO', 'el-GR', 'hu-HU', 'sk-SK', 'bg-BG'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateOne(text, lang) {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/translate/text`, {
      text, to: lang, from: 'en-US'
    }, { timeout: 5000 });
    return res.data?.translatedText || text;
  } catch (err) {
    return text;
  }
}

async function doLanguage(lang) {
  console.log(`📝 ${lang}...`);
  const translations = {};
  const keys = Object.keys(enTranslations);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const text = enTranslations[key];
    translations[key] = await translateOne(text, lang);

    if ((i + 1) % 100 === 0) {
      process.stdout.write('.');
    }

    // Small delay between requests
    await sleep(50);
  }

  const file = path.join(LOCALES_DIR, `${lang}.json`);
  fs.writeFileSync(file, JSON.stringify(translations, null, 2));
  console.log(' ✅');
}

async function main() {
  console.log('🔄 Batch translating remaining languages...\n');

  for (const lang of remaining) {
    await doLanguage(lang);
    await sleep(1000); // Pause between languages
  }

  console.log('\n✅ Complete!');
}

main().catch(console.error);
