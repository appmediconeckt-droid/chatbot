// Run from chatbot-frontend. Sends only strings in source code, never user data.
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const base = 'src/Component/DoctorDashboard';
const values = new Set();
const add = value => {
 if (typeof value !== 'string') return;
 value = value.trim().replace(/\s+/g, ' ');
 if (/[a-z]/i.test(value) && !/https?:|className|\.jsx?$|^[./#]|\b(?:SELECT|INSERT|UPDATE)\b/.test(value)) values.add(value);
};
const files = fs.readdirSync(base, { recursive: true }).filter(f => f.endsWith('.jsx')).map(f => path.join(base, f));
files.push('src/Component/common/LocationSelect.jsx', 'src/Component/common/ProfileCompletion.jsx', 'src/Component/Receptionist/PatientVitals.jsx', 'src/Component/DoctorDashboard/doctorRoutes.js');
for (const file of files) {
 const ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
 function walk(node, parent) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'StringLiteral' && parent?.type !== 'ImportDeclaration') {
   // Include UI copy in JSX, validation messages, status maps and option arrays.
   // Exclude machine identifiers, API paths and CSS selectors.
   if (/\s/.test(node.value) || /^[A-Z][a-z]+(?:[A-Z][a-z]+)?$/.test(node.value) || parent?.type === 'JSXAttribute') {
    if (!['className', 'id', 'type', 'name', 'href', 'src', 'accept', 'as', 'key'].includes(parent?.name?.name)) add(node.value);
   }
  }
  if (node.type === 'JSXText') add(node.value);
  if (node.type === 'TemplateLiteral') {
   const text = node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? `{${i}}` : '')).join('');
   if (/\s/.test(text) && !/[<>=]|\b(?:px|rgba|className)\b/.test(text)) add(text);
  }
  for (const [key, value] of Object.entries(node)) {
   if (['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
   if (Array.isArray(value)) value.forEach(v => walk(v, node));
   else if (value && typeof value === 'object') walk(value, node);
  }
 }
 walk(ast);
}
for (const key of Object.keys(JSON.parse(fs.readFileSync('src/i18n/locales/doctor-hi-IN.json', 'utf8')))) add(key);
const texts = [...values].sort();
const languages = [...fs.readFileSync('src/i18n/LanguageContext.jsx', 'utf8').matchAll(/\{ code: '([^']+)'/g)].map(m => m[1]).filter(l => !l.startsWith('en'));
const output = 'src/i18n/locales/doctor-copy.json';
let catalog = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : {};
fs.writeFileSync('src/i18n/locales/doctor-source.json', JSON.stringify(texts, null, 2) + '\n');
if (process.argv.includes('--extract-only')) { console.log(`${texts.length} UI strings, ${languages.length} languages`); process.exit(); }
const targets = { 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'he-IL': 'iw', 'fil-PH': 'tl' };
const jobs = [];
for (const lang of languages) {
 catalog[lang] ||= {};
 const missing = texts.filter(text => !catalog[lang][text]);
 let chunk = [], length = 0;
 for (const text of missing) {
  if (chunk.length && (length + text.length > 2800 || chunk.length >= 30)) { jobs.push({ lang, texts: chunk }); chunk = []; length = 0; }
  chunk.push(text); length += text.length + 18;
 }
 if (chunk.length) jobs.push({ lang, texts: chunk });
}
let next = 0, complete = 0, failed = 0;
const persist = () => fs.writeFileSync(output, JSON.stringify(catalog, null, 2) + '\n');
async function translate(text, lang) {
 const url = new URL('https://translate.googleapis.com/translate_a/single');
 for (const [key, value] of Object.entries({ client: 'gtx', sl: 'en', tl: targets[lang] || lang.split('-')[0], dt: 't', q: text })) url.searchParams.set(key, value);
 for (let attempt = 0; attempt < 3; attempt++) {
  try {
   const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
   if (!response.ok) throw new Error(`HTTP ${response.status}`);
   const data = await response.json();
   if (!Array.isArray(data[0])) throw new Error('Invalid translation');
   return data[0].map(s => s[0] || '').join('');
  } catch (error) { if (attempt === 2) throw error; await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); }
 }
}
async function worker() {
 while (next < jobs.length) {
  const job = jobs[next++];
  try {
   const packed = job.texts.map((text, i) => `${i ? `\nZXQ${i}QXZ\n` : ''}${text}`).join('');
   const result = await translate(packed, job.lang);
   const parts = result.split(/\s*ZXQ\s*\d+\s*QXZ\s*/i);
   for (let start = 0; start < job.texts.length; start += 4) {
    await Promise.all(job.texts.slice(start, start + 4).map(async (text, offset) => {
    const i = start + offset;
    let translated = parts.length === job.texts.length ? parts[i].trim() : await translate(text, job.lang);
    // A translated template must retain every interpolation token.
    if ([...text.matchAll(/\{\d+\}/g)].some(([token]) => !translated.includes(token))) translated = await translate(text.replace(/\{(\d+)\}/g, 'ZXV$1VXZ'), job.lang).then(s => s.replace(/ZXV\s*(\d+)\s*VXZ/gi, '{$1}'));
    if ([...text.matchAll(/\{\d+\}/g)].some(([token]) => !translated.includes(token))) {
     translated = (await Promise.all(text.split(/(\{\d+\})/g).map(async part => {
      if (/^\{\d+\}$/.test(part) || !/[a-z]/i.test(part)) return part;
      return `${part.match(/^\s*/)[0]}${(await translate(part.trim(), job.lang)).trim()}${part.match(/\s*$/)[0]}`;
     }))).join('');
    }
    if (!translated || [...text.matchAll(/\{\d+\}/g)].some(([token]) => !translated.includes(token))) throw new Error('Lost template tokens');
    catalog[job.lang][text] = translated;
    }));
   }
  } catch (error) { failed++; console.log(`${job.lang}: ${error.message}`); }
  complete++;
  if (complete % 20 === 0 || complete === jobs.length) { persist(); console.log(`${complete}/${jobs.length} batches; ${failed} failed`); }
 }
}
console.log(`${texts.length} UI strings; ${languages.length} languages; ${jobs.length} batches`);
Promise.all(Array.from({ length: 12 }, worker)).then(() => { persist(); if (failed) process.exitCode = 1; });
