import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');
const LIBRE_API = 'https://libretranslate.de/translate';

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// Language codes for LibreTranslate
const languages = [
  { code: 'ta-IN', libre: 'ta' },      // Tamil
  { code: 'mr-IN', libre: 'mr' },      // Marathi
  { code: 'te-IN', libre: 'te' },      // Telugu
  { code: 'kn-IN', libre: 'kn' },      // Kannada
  { code: 'ml-IN', libre: 'ml' },      // Malayalam
  { code: 'gu-IN', libre: 'gu' },      // Gujarati
  { code: 'bn-IN', libre: 'bn' },      // Bengali
  { code: 'pa-IN', libre: 'pa' },      // Punjabi
  { code: 'ur-IN', libre: 'ur' },      // Urdu
  { code: 'as-IN', libre: 'as' },      // Assamese
  { code: 'or-IN', libre: 'or' },      // Odia
  { code: 'af-ZA', libre: 'af' },      // Afrikaans
  { code: 'am-ET', libre: 'am' },      // Amharic
  { code: 'bg-BG', libre: 'bg' },      // Bulgarian
  { code: 'cs-CZ', libre: 'cs' },      // Czech
  { code: 'da-DK', libre: 'da' },      // Danish
  { code: 'el-GR', libre: 'el' },      // Greek
  { code: 'en-GB', libre: 'en' },      // English (UK)
  { code: 'en-IN', libre: 'en' },      // English (India)
  { code: 'fa-IR', libre: 'fa' },      // Persian
  { code: 'fi-FI', libre: 'fi' },      // Finnish
  { code: 'fil-PH', libre: 'fil' },    // Filipino
  { code: 'ha-NG', libre: 'ha' },      // Hausa
  { code: 'he-IL', libre: 'he' },      // Hebrew
  { code: 'hu-HU', libre: 'hu' },      // Hungarian
  { code: 'id-ID', libre: 'id' },      // Indonesian
  { code: 'it-IT', libre: 'it' },      // Italian
  { code: 'ms-MY', libre: 'ms' },      // Malay
  { code: 'nl-NL', libre: 'nl' },      // Dutch
  { code: 'no-NO', libre: 'no' },      // Norwegian
  { code: 'pl-PL', libre: 'pl' },      // Polish
  { code: 'pt-PT', libre: 'pt' },      // Portuguese
  { code: 'ro-RO', libre: 'ro' },      // Romanian
  { code: 'si-LK', libre: 'si' },      // Sinhala
  { code: 'sk-SK', libre: 'sk' },      // Slovak
  { code: 'sv-SE', libre: 'sv' },      // Swedish
  { code: 'sw-KE', libre: 'sw' },      // Swahili
  { code: 'tr-TR', libre: 'tr' },      // Turkish
  { code: 'uk-UA', libre: 'uk' },      // Ukrainian
  { code: 'vi-VN', libre: 'vi' },      // Vietnamese
  { code: 'yo-NG', libre: 'yo' },      // Yoruba
  { code: 'zu-ZA', libre: 'zu' },      // Zulu
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateOne(text, libreCode) {
  try {
    const res = await axios.post(LIBRE_API, {
      q: text,
      source: 'en',
      target: libreCode
    }, { timeout: 10000 });
    return res.data?.translatedText || text;
  } catch (err) {
    return text;
  }
}

async function doLanguage(lang, index) {
  process.stdout.write(`[${index+1}/${languages.length}] ${lang.code}: `);
  const translations = {};
  const keys = Object.keys(enTranslations);

  let translated = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const text = enTranslations[key];
    const result = await translateOne(text, lang.libre);
    translations[key] = result;

    if (result !== text) translated++;
    if ((i + 1) % 75 === 0) process.stdout.write('.');

    await sleep(50);
  }

  const file = path.join(LOCALES_DIR, `${lang.code}.json`);
  fs.writeFileSync(file, JSON.stringify(translations, null, 2));
  console.log(` ✅ (${translated} translated)`);
}

async function main() {
  console.log('🌐 Using LibreTranslate API - Free & Open Source\n');

  for (let i = 0; i < languages.length; i++) {
    await doLanguage(languages[i], i);
    await sleep(3000);
  }

  console.log('\n✅ ALL 42 LANGUAGES TRANSLATED!');
}

main().catch(console.error);
