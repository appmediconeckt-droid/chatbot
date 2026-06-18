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
  'ml-IN': 'ml',
  'gu-IN': 'gu',
  'en-GB': 'en',
  'en-IN': 'en',
  'fil-PH': 'fil',
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function translate(text, targetLang) {
  try {
    const shortLang = langMap[targetLang] || targetLang.split('-')[0];
    const res = await axios.post(API, { text, to: shortLang, from: 'en' }, { timeout: 20000 });
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

    if ((i + 1) % 50 === 0) process.stdout.write('.');

    await sleep(3500);
  }

  fs.writeFileSync(
    path.join(LOCALES_DIR, `${langCode}.json`),
    JSON.stringify(result, null, 2)
  );
  console.log(` ✅ (${translated}/${keys.length})`);

  if (index < total) {
    await sleep(5000);
  }
}

async function main() {
  console.log('🚀 FINAL 5 LANGUAGES\n');
  console.log('Languages: ml-IN, gu-IN, en-GB, en-IN, fil-PH\n');

  const allLangs = Object.keys(langMap);

  for (let i = 0; i < allLangs.length; i++) {
    await processLanguage(allLangs[i], i + 1, allLangs.length);
  }

  console.log('\n🎉 ALL 56 LANGUAGES COMPLETE!');
}

main().catch(console.error);
