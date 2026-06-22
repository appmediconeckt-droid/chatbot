import axios from 'axios';
import { API_BASE_URL } from '../axiosConfig';

const CACHE_PREFIX = 'translation_cache_';
const CACHE_VERSION = 'v2';

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
    return String(lang || 'en-US').split('-')[0].toLowerCase();
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

    // English is the default message language. Do not send an auto-detect to
    // English request: some providers return their validation message instead
    // of the original text when both languages are effectively English.
    const targetLanguageCode = this.getShortLang(targetLang);
    const sourceLanguageCode = this.getShortLang(sourceLang);
    if (
      targetLanguageCode === 'en' ||
      (sourceLang !== 'auto' && targetLanguageCode === sourceLanguageCode)
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
      const endpoints = [
        `${API_BASE_URL}/translate/text`,
        `${API_BASE_URL}/api/translate/text`,
      ];

      for (const endpoint of endpoints) {
        try {
          res = await axios.post(endpoint, payload);
          break;
        } catch (error) {
          lastError = error;
          const status = error?.response?.status;
          if (status && status !== 404) break;
        }
      }

      if (!res) throw lastError;

      let translated = res.data?.translatedText || res.data?.text || text;

      if (translated === text) {
        translated = await this.fetchPublicFallbackTranslation(text, targetLang);
      }

      if (translated === text && this.looksLikeRomanHindi(text)) {
        const normalizedText = this.normalizeHinglishText(text);
        if (normalizedText && normalizedText !== text.toLowerCase()) {
          translated = await this.fetchPublicFallbackTranslation(normalizedText, targetLang);
        }
      }

      // Cache the result
      if (translated && translated !== text) {
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

      return translated;
    } catch (err) {
      console.error('Translation API error:', err);
      return text;
    }
  }

  async fetchPublicFallbackTranslation(text, targetLang) {
    const target = this.getShortLang(targetLang);
    if (!target || !text || !text.trim()) return text;

    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`Autodetect|${target}`)}`;
      const response = await axios.get(myMemoryUrl, { timeout: 8000 });
      const translated = response.data?.responseData?.translatedText;
      if (translated && translated.toLowerCase() !== text.toLowerCase()) {
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

  async translateBatch(texts, targetLang, sourceLang = 'auto') {
    const results = await Promise.all(
      texts.map(text => this.translate(text, targetLang, sourceLang))
    );
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
