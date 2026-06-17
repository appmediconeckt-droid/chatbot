import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE_URL = 'https://s5jl7g4z-5001.inc1.devtunnels.ms';
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');

const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en-US.json'), 'utf-8');
const enTranslations = JSON.parse(enContent);

// Only remaining languages
const languages = ['ko-KR', 'ja-JP', 'zh-CN', 'zh-TW', 'fr-FR', 'ru-RU', 'es-ES', 'pt-BR'];

async function translateBatch(texts, targetLang) {
  try {
    // Combine texts for batch translation
    const batchText = texts.join(' ||| ');
    const res = await axios.post(`${API_BASE_URL}/api/translate/text`, {
      text: batchText,
      to: targetLang,
      from: 'en-US',
    }, { timeout: 10000 });

    const translated = res.data?.translatedText || batchText;
    return translated.split(' ||| ').map(t => t.trim());
  } catch (err) {
    console.error(`Batch translation failed for ${targetLang}:`, err.message);
    return texts; // Return original if translation fails
  }
}

async function populateLanguage(langCode) {
  console.log(`\n🌐 ${langCode}...`);

  const filePath = path.join(LOCALES_DIR, `${langCode}.json`);
  let existing = {};

  try {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {}

  const translations = {};
  const entries = Object.entries(enTranslations);

  // Translate in batches of 20
  for (let i = 0; i < entries.length; i += 20) {
    const batch = entries.slice(i, i + 20);
    const keys = batch.map(([k]) => k);
    const texts = batch.map(([, v]) => v);

    const translated = await translateBatch(texts, langCode);

    batch.forEach(([key], idx) => {
      translations[key] = translated[idx] || texts[idx];
    });

    if ((i + 20) % 100 === 0) process.stdout.write('.');
  }

  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2));
  console.log(' ✅');
}

async function main() {
  console.log('⚡ Quick translation for remaining languages...');
  for (const lang of languages) {
    await populateLanguage(lang);
  }
  console.log('\n✅ Done!');
}

main();
