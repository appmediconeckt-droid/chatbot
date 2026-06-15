#!/usr/bin/env node
/**
 * Script to split translations.js into separate language files
 * Creates /src/i18n/locales/{lang}.json for each language
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the translations from the current file
import { translations } from '../src/i18n/translations.js';

// Create locales directory if it doesn't exist
const localesDir = path.join(__dirname, '../src/i18n/locales');
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

// Get en-US as the base (it has all keys)
const baseTranslations = translations['en-US'] || {};

// Process each language
Object.entries(translations).forEach(([lang, langTranslations]) => {
  // Merge with base for languages that have partial translations
  const fullTranslations = {
    ...baseTranslations,
    ...langTranslations
  };

  // Write to JSON file
  const filePath = path.join(localesDir, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(fullTranslations, null, 2));
  console.log(`✅ Created: ${lang}.json (${Object.keys(fullTranslations).length} keys)`);
});

console.log(`\n✅ Successfully split all translations into ${Object.keys(translations).length} language files!`);
console.log(`📁 Files created in: ${localesDir}`);
