import axios from 'axios';
import { API_BASE_URL } from '../axiosConfig';

const CACHE_PREFIX = 'translation_cache_';
const CACHE_VERSION = 'v4';
const TRANSLATION_ERROR_PATTERN = /please select two distinct languages|invalid language pair|translation failed|query length|quota exceeded|daily limit|too many requests|invalid target language|mymemory warning|used all available free|unsupported language/i;

class TranslationService {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
    this.loadCacheFromStorage();
  }

  loadCacheFromStorage() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          const data = JSON.parse(localStorage.getItem(key));
          this.cache.set(key, data);
        }
      });
    } catch (err) {
      console.warn('Failed to load translation cache:', err);
    }
  }

  getCacheKey(text, targetLang, sourceLang = 'auto') {
    const hash = this.simpleHash(text);
    return `${CACHE_PREFIX}${CACHE_VERSION}_${sourceLang}_${targetLang}_${hash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  getShortLang(lang) {
    const code = String(lang || 'en-US').replace('_', '-').toLowerCase();
    // These variants have different writing systems and must remain distinct.
    if (code === 'zh-tw' || code === 'zh-hant') return 'zh-TW';
    if (code === 'zh-cn' || code === 'zh-hans') return 'zh-CN';
    return code.split('-')[0];
  }

  translationEndpoints(action) {
    const base = API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    return [`${base}/api/translate/${action}`, `${base}/translate/${action}`];
  }

  validTranslation(original, translated) {
    return typeof translated === 'string' && translated.trim()
      && !TRANSLATION_ERROR_PATTERN.test(translated)
      && [...original.matchAll(/\{\d+\}/g)].every(([token]) => translated.includes(token));
  }

  cacheTranslation(text, targetLang, sourceLang, translated) {
    if (!this.validTranslation(text, translated) || translated === text) return;
    const key = this.getCacheKey(text, targetLang, sourceLang);
    this.cache.set(key, translated);
    try { localStorage.setItem(key, JSON.stringify(translated)); } catch { /* In-memory cache remains available. */ }
  }

  normalizeHinglishText(text) {
    let normalized = ` ${text.toLowerCase()} `;
    const replacements = [
      [/\bmain\b|\bmein\b|\bme\b/g, 'I'],
      [/\bhu\b|\bhoon\b/g, 'am'],
      [/\bthik\b|\btheek\b/g, 'fine'],
      [/\bkaise\b/g, 'how'],
      [/\bkaisa\b/g, 'how'],
      [/\baap\b|\btum\b|\btu\b/g, 'you'],
      [/\bkya\b/g, 'what'],
      [/\bkar\b/g, 'do'],
      [/\braha\b|\brahi\b|\brahe\b/g, 'doing'],
      [/\bnahi\b|\bnhi\b|\bnahin\b/g, 'not'],
      [/\bhaan\b|\bha\b|\bhan\b/g, 'yes'],
      [/\bachha\b|\baccha\b|\bachi\b/g, 'good'],
      [/\bmujhe\b|\bmuje\b/g, 'me'],
      [/\bmera\b|\bmeri\b|\bmere\b/g, 'my'],
      [/\bmessage\b|\bmessgae\b/g, 'message'],
    ];

    replacements.forEach(([pattern, replacement]) => {
      normalized = normalized.replace(pattern, replacement);
    });

    return normalized.replace(/\s+/g, ' ').trim();
  }

  looksLikeRomanHindi(text) {
    return /\b(main|mein|me|hu|hoon|thik|theek|kaise|kaisa|aap|tum|kya|nahi|nhi|haan|achha|mujhe|mera|meri|kar|raha|rahi)\b/i.test(text);
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    if (!text || !text.trim()) return text;

    // Auto-detected chat text must still be translated when English is the
    // selected target (for example Roman Hindi/Hinglish -> English). Only skip
    // when the caller explicitly confirms source and target are identical.
    const targetLanguageCode = this.getShortLang(targetLang);
    const sourceLanguageCode = this.getShortLang(sourceLang);
    if (
      sourceLang !== 'auto' && targetLanguageCode === sourceLanguageCode
    ) {
      return text;
    }

    const cacheKey = this.getCacheKey(text, targetLang, sourceLang);

    // Check in-memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        this.cache.set(cacheKey, data);
        return data;
      }
    } catch (err) {
      console.warn('Failed to read from cache:', err);
    }

    // Avoid duplicate API calls - return pending promise if already fetching
    if (this.pending.has(cacheKey)) {
      return this.pending.get(cacheKey);
    }

    // Fetch from Azure API
    const promise = this.fetchTranslation(text, targetLang, sourceLang, cacheKey);
    this.pending.set(cacheKey, promise);

    return promise.finally(() => {
      this.pending.delete(cacheKey);
    });
  }

  async fetchTranslation(text, targetLang, sourceLang, cacheKey) {
    try {
      const payload = {
        text,
        to: targetLang,
        targetLanguage: targetLang,
        ...(sourceLang && sourceLang !== 'auto'
          ? { from: sourceLang, sourceLanguage: sourceLang }
          : {}),
      };

      let res = null;
      let lastError = null;
      const endpoints = this.translationEndpoints('text');

      for (const endpoint of endpoints) {
        try {
          res = await axios.post(endpoint, payload, { timeout: 20000 });
          break;
        } catch (error) {
          lastError = error;
          const status = error?.response?.status;
          if (status && status !== 404) break;
        }
      }

      if (!res) throw lastError;

      let translated = res.data?.translatedText || res.data?.text || text;

      if (!this.validTranslation(text, translated)) {
        translated = text;
      }

      if (translated === text) {
        translated = await this.fetchPublicFallbackTranslation(text, targetLang, sourceLang);
      }

      if (translated === text && this.looksLikeRomanHindi(text)) {
        const normalizedText = this.normalizeHinglishText(text);
        if (normalizedText && normalizedText !== text.toLowerCase()) {
          translated = await this.fetchPublicFallbackTranslation(normalizedText, targetLang);
        }
      }

      // Cache the result
      if (this.validTranslation(text, translated) && translated !== text) {
        this.cache.set(cacheKey, translated);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(translated));
        } catch (err) {
          if (err.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, clearing old cache...');
            this.clearOldCache();
          }
        }
      }

      return this.validTranslation(text, translated) ? translated : text;
    } catch (err) {
      console.error('Translation API error:', err);
      const fallback = await this.fetchPublicFallbackTranslation(text, targetLang, sourceLang);
      return this.validTranslation(text, fallback) ? fallback : text;
    }
  }

  async fetchPublicFallbackTranslation(text, targetLang, sourceLang = 'auto') {
    const target = this.getShortLang(targetLang);
    if (!target || !text || !text.trim()) return text;

    try {
      const source = sourceLang === 'auto' ? 'Autodetect' : this.getShortLang(sourceLang);
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${source}|${target}`)}`;
      const response = await axios.get(myMemoryUrl, { timeout: 8000 });
      const translated = response.data?.responseData?.translatedText;
      if (
        this.validTranslation(text, translated) &&
        translated.toLowerCase() !== text.toLowerCase()
      ) {
        return translated;
      }
    } catch (error) {
      console.warn('MyMemory fallback translation failed:', error.message);
    }

    return text;
  }

  clearOldCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      this.cache.clear();
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }
  }

  async translateBatch(texts, targetLang, sourceLang = 'auto', onProgress) {
    if (!Array.isArray(texts) || !texts.length) return [];
    if (this.getShortLang(targetLang) === this.getShortLang(sourceLang)) return texts;
    const results = new Array(texts.length);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;
    texts.forEach((text, index) => {
      const cached = this.cache.get(this.getCacheKey(text, targetLang, sourceLang));
      if (this.validTranslation(text, cached)) {
        results[index] = cached;
        onProgress?.([{ index, original: text, translated: cached }]);
        return;
      }
      if (currentChunk.length >= 30 || (currentChunk.length && currentLength + text.length > 4000)) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentLength = 0;
      }
      currentChunk.push({ text, index });
      currentLength += text.length;
    });
    if (currentChunk.length) chunks.push(currentChunk);

    let nextChunk = 0;
    const worker = async () => {
      while (nextChunk < chunks.length) {
        const chunk = chunks[nextChunk++];
        let values;
        for (const endpoint of this.translationEndpoints('batch')) {
          try {
            const response = await axios.post(endpoint, {
              texts: chunk.map(({ text }) => text), to: targetLang,
              ...(sourceLang !== 'auto' ? { from: sourceLang } : {}),
            }, { timeout: 45000 });
            if (Array.isArray(response.data?.translatedTexts) && response.data.translatedTexts.length === chunk.length) values = response.data.translatedTexts;
            break;
          } catch (error) {
            if (error?.response?.status !== 404) break;
          }
        }
        // Unchanged batch output is a failure too. Previously the English
        // response retained all markers, so it was incorrectly accepted.
        for (let start = 0; start < chunk.length; start += 4) {
          await Promise.all(chunk.slice(start, start + 4).map(async ({ text, index }, offset) => {
            const value = values?.[start + offset];
            const translated = this.validTranslation(text, value) && value !== text
              ? value : await this.translate(text, targetLang, sourceLang);
            results[index] = this.validTranslation(text, translated) ? translated : text;
            this.cacheTranslation(text, targetLang, sourceLang, results[index]);
          }));
        }
        if (typeof onProgress === 'function') {
          onProgress(
            chunk.map(({ text, index }) => ({
              index,
              original: text,
              translated: results[index] || text,
            })),
          );
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(4, chunks.length) }, () => worker()));
    return results;
  }

  getCacheStats() {
    return {
      inMemory: this.cache.size,
      inLocalStorage: Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).length,
    };
  }
}

export const translationService = new TranslationService();
