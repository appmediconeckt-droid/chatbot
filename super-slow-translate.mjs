import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE_URL = 'http://localhost:5001';
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// Prioritize languages mentioned by user
const languages = [
  'ta-IN', 'mr-IN', 'te-IN', 'kn-IN', 'ml-IN', 'gu-IN', 'bn-IN', 'pa-IN', 'ur-IN', 'as-IN', 'or-IN',
  'af-ZA', 'am-ET', 'bg-BG', 'cs-CZ', 'da-DK', 'el-GR', 'en-GB', 'en-IN', 'fa-IR', 'fi-FI',
  'fil-PH', 'ha-NG', 'he-IL', 'hu-HU', 'id-ID', 'it-IT', 'ms-MY', 'nl-NL', 'no-NO', 'pl-PL',
  'pt-PT', 'ro-RO', 'si-LK', 'sk-SK', 'sv-SE', 'sw-KE', 'tr-TR', 'uk-UA', 'vi-VN', 'yo-NG', 'zu-ZA'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateOne(text, lang) {
  try {
    // Convert full code (ta-IN) to short code (ta) for MyMemory API
    const shortLang = lang.split('-')[0];
    const res = await axios.post(`${API_BASE_URL}/api/translate/text`, {
      text, to: shortLang, from: 'en'
    }, { timeout: 15000 });
    const translated = res.data?.translatedText || text;
    return translated !== text ? translated : text;
  } catch (err) {
    console.log(`    [FAIL: ${lang}]`);
    return text;
  }
}

async function doLanguage(lang, index) {
  process.stdout.write(`[${index+1}/${languages.length}] ${lang}: `);
  const translations = {};
  const keys = Object.keys(enTranslations);

  let translated = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const text = enTranslations[key];
    const result = await translateOne(text, lang);
    translations[key] = result;

    if (result !== text) translated++;
    if ((i + 1) % 50 === 0) process.stdout.write('.');

    await sleep(15);
  }

  const file = path.join(LOCALES_DIR, `${lang}.json`);
  fs.writeFileSync(file, JSON.stringify(translations, null, 2));
  console.log(` ✅ (${translated} translated)`);
}

async function main() {
  console.log('🐢 SUPER-SLOW Translation Mode - Priority: Indian Languages First\n');

  for (let i = 0; i < languages.length; i++) {
    await doLanguage(languages[i], i);
    await sleep(5000);
  }

  console.log('\n✅ COMPLETE!');
}

main().catch(console.error);
