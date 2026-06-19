import axios from 'axios';
import { API_BASE_URL } from '../axiosConfig';

const CACHE_PREFIX = 'translation_cache_';
const CACHE_VERSION = 'v1';

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
    return `${CACHE_PREFIX}${sourceLang}_${targetLang}_${hash}`;
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

  async translate(text, targetLang, sourceLang = 'auto') {
    if (!text || !text.trim()) return text;
    if (sourceLang !== 'auto' && targetLang === sourceLang) return text;

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
      const res = await axios.post(`${API_BASE_URL}/translate/text`, {
        text,
        to: targetLang,
        ...(sourceLang && sourceLang !== 'auto' ? { from: sourceLang } : {}),
      });

      const translated = res.data?.translatedText || res.data?.text || text;

      // Cache the result
      this.cache.set(cacheKey, translated);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(translated));
      } catch (err) {
        if (err.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old cache...');
          this.clearOldCache();
        }
      }

      return translated;
    } catch (err) {
      console.error('Translation API error:', err);
      return text;
    }
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
