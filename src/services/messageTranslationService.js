// Simple translation cache
const TRANSLATION_CACHE_KEY = 'messageTranslations_v2';

const getTranslationCache = () => {
  try {
    const cached = localStorage.getItem(TRANSLATION_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    return {};
  }
};

const saveTranslationCache = (cache) => {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving translation cache:', error);
  }
};

const getCacheKey = (text, targetLang) => {
  return `${text.slice(0, 30)}_${targetLang}`.replace(/\s+/g, '_');
};

// Language code mapping for APIs
const LANG_MAPPING = {
  'en': 'en',
  'hi': 'hi',
  'ta': 'ta',
  'te': 'te',
  'kn': 'kn',
  'ml': 'ml',
  'bn': 'bn',
  'gu': 'gu',
  'mr': 'mr'
};

// Translate using MyMemory API (most reliable free API)
const translateWithMyMemory = async (text, targetLang) => {
  if (!text || text.length < 2) return null;

  try {
    const encodedText = encodeURIComponent(text);
    const langCode = LANG_MAPPING[targetLang] || targetLang;

    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${langCode}`;

    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();

    if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      if (translated && translated.toLowerCase() !== text.toLowerCase()) {
        console.log('✓ MyMemory:', text.slice(0, 25), '→', translated.slice(0, 25));
        return translated;
      }
    }
  } catch (error) {
    console.warn('MyMemory API error:', error.message);
  }

  return null;
};

// Translate using Google Translate (fetch-based, no API key needed)
const translateWithGoogle = async (text, targetLang) => {
  if (!text || text.length < 2) return null;

  try {
    const langCode = LANG_MAPPING[targetLang] || targetLang;
    const encodedText = encodeURIComponent(text);

    // Using Google Translate API endpoint
    const url = `https://translate.google.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodedText}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 8000
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      const translated = data[0]
        .filter(item => Array.isArray(item) && item[0])
        .map(item => item[0])
        .join('');

      if (translated && translated.toLowerCase() !== text.toLowerCase()) {
        console.log('✓ Google:', text.slice(0, 25), '→', translated.slice(0, 25));
        return translated;
      }
    }
  } catch (error) {
    console.warn('Google Translate error:', error.message);
  }

  return null;
};

// Main translation function
export const translateMessage = async (text, targetLang) => {
  // Don't translate if English or empty
  if (!text || targetLang === 'en' || text.trim().length < 2) {
    return text;
  }

  const cache = getTranslationCache();
  const cacheKey = getCacheKey(text, targetLang);

  // Return cached translation
  if (cache[cacheKey]) {
    console.log('📦 Cached:', text.slice(0, 25));
    return cache[cacheKey];
  }

  try {
    console.log(`🔄 Translating to ${targetLang}:`, text.slice(0, 40));

    // Try MyMemory first (more reliable)
    let translated = await translateWithMyMemory(text, targetLang);

    // If MyMemory fails, try Google
    if (!translated) {
      console.log('⚠️ MyMemory failed, trying Google...');
      translated = await translateWithGoogle(text, targetLang);
    }

    // If we got a valid translation, cache and return it
    if (translated) {
      cache[cacheKey] = translated;
      saveTranslationCache(cache);
      return translated;
    }

    console.warn('⚠️ Translation failed for:', text.slice(0, 30));
  } catch (error) {
    console.error('❌ Translation error:', error.message);
  }

  // Return original text if translation fails
  return text;
};

export const clearTranslationCache = () => {
  localStorage.removeItem(TRANSLATION_CACHE_KEY);
  console.log('✅ Translation cache cleared');
};
