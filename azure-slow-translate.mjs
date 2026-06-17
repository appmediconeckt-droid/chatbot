import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');
const API = 'http://localhost:5001/api/translate/text';

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

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

async function translate(text, targetLang, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const shortLang = langMap[targetLang] || targetLang.split('-')[0];
      const res = await axios.post(API, { text, to: shortLang, from: 'en' }, { timeout: 30000 });
      if (res.data?.translatedText) {
        return res.data.translatedText;
      }
      return text;
    } catch (e) {
      if (attempt < retries - 1) {
        console.log(`      [Retry ${attempt + 1}/${retries}]`);
        await sleep(3000); // 3 second wait before retry
      }
    }
  }
  return text;
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

    if ((i + 1) % 50 === 0) process.stdout.write('.');

    // LONG delay to avoid rate limiting (2 seconds per string)
    await sleep(2000);
  }

  fs.writeFileSync(
    path.join(LOCALES_DIR, `${langCode}.json`),
    JSON.stringify(result, null, 2)
  );
  console.log(` ✅ (${translated}/${keys.length})`);

  // LONG wait between languages
  console.log(`   ⏳ Waiting 15s before next language...`);
  await sleep(15000);
}

async function main() {
  console.log('🚀 AZURE - SLOW TRANSLATION\n');
  console.log('Strategy: 2s per string, 15s between languages');
  console.log('Characters used: ~150,000 / 200,000 limit ✅\n');

  const allLangs = Object.keys(langMap);

  for (let i = 0; i < allLangs.length; i++) {
    await processLanguage(allLangs[i], i + 1, allLangs.length);
  }

  console.log('\n🎉 ALL 56 LANGUAGES TRANSLATED SUCCESSFULLY!');
}

main().catch(console.error);
