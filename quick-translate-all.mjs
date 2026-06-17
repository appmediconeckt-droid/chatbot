import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');
const API = 'http://localhost:5001/api/translate/text';

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// Language code mapping - full code to short code for MyMemory
const langMap = {
  'ta-IN': 'ta', 'mr-IN': 'mr', 'te-IN': 'te', 'kn-IN': 'kn', 'ml-IN': 'ml',
  'gu-IN': 'gu', 'pa-IN': 'pa', 'ur-IN': 'ur', 'as-IN': 'as', 'or-IN': 'or',
  'bn-IN': 'bn', 'af-ZA': 'af', 'am-ET': 'am', 'bg-BG': 'bg', 'cs-CZ': 'cs',
  'da-DK': 'da', 'el-GR': 'el', 'en-GB': 'en', 'en-IN': 'en', 'fa-IR': 'fa',
  'fi-FI': 'fi', 'fil-PH': 'fil', 'ha-NG': 'ha', 'he-IL': 'he', 'hu-HU': 'hu',
  'id-ID': 'id', 'it-IT': 'it', 'ms-MY': 'ms', 'nl-NL': 'nl', 'no-NO': 'no',
  'pl-PL': 'pl', 'pt-PT': 'pt', 'ro-RO': 'ro', 'si-LK': 'si', 'sk-SK': 'sk',
  'sv-SE': 'sv', 'sw-KE': 'sw', 'tr-TR': 'tr', 'uk-UA': 'uk', 'vi-VN': 'vi',
  'yo-NG': 'yo', 'zu-ZA': 'zu', 'ar-SA': 'ar', 'fr-FR': 'fr', 'de-DE': 'de',
  'es-ES': 'es', 'ja-JP': 'ja', 'ko-KR': 'ko', 'pt-BR': 'pt', 'ru-RU': 'ru',
  'th-TH': 'th', 'zh-CN': 'zh', 'zh-TW': 'zh', 'ne-NP': 'ne'
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function translate(text, targetLang) {
  try {
    const shortLang = langMap[targetLang] || targetLang.split('-')[0];
    const res = await axios.post(API, { text, to: shortLang, from: 'en' }, { timeout: 12000 });
    return res.data?.translatedText || text;
  } catch (e) {
    return text;
  }
}

async function processLanguage(langCode, index, total) {
  const keys = Object.keys(enTranslations);
  const result = {};
  process.stdout.write(`[${index}/${total}] ${langCode}: `);

  let translated = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const text = enTranslations[key];
    const trans = await translate(text, langCode);
    result[key] = trans;
    if (trans !== text) translated++;
    if ((i + 1) % 100 === 0) process.stdout.write('.');
    await sleep(20);
  }

  fs.writeFileSync(
    path.join(LOCALES_DIR, `${langCode}.json`),
    JSON.stringify(result, null, 2)
  );
  console.log(` ✅ (${translated}/${keys.length})`);
}

async function main() {
  console.log('⚡ QUICK TRANSLATION - All 56 Languages\n');
  const allLangs = Object.keys(langMap);

  for (let i = 0; i < allLangs.length; i++) {
    await processLanguage(allLangs[i], i + 1, allLangs.length);
    await sleep(2000);
  }

  console.log('\n🎉 ALL LANGUAGES TRANSLATED!');
}

main().catch(console.error);
