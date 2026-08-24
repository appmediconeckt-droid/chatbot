import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import enUS from './locales/en-US.json';
import landingHiIN from './locales/landing-hi-IN.json';
import { translationService } from './translationService';

const USER_LANG_KEY = 'userLang';
const COUNSELOR_LANG_KEY = 'counselorLang';
// Public/landing pages have no role yet, so they get their own scope. Picking a
// language before signing in also seeds both portals, so the choice carries over.
const SITE_LANG_KEY = 'siteLang';

export const SUPPORTED_LANGUAGES = [
  // ──── TOP PRIORITY ────
  { code: 'en-US', label: 'English', name: 'English' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', name: 'हिंदी' },

  // ──── ALL OTHER LANGUAGES (ALPHABETICAL) ────
  { code: 'af-ZA', label: 'Afrikaans', name: 'Afrikaans' },
  { code: 'am-ET', label: 'አማርኛ (Amharic)', name: 'አማርኛ' },
  { code: 'ar-SA', label: 'العربية (Arabic)', name: 'العربية' },
  { code: 'as-IN', label: 'অসমীয়া (Assamese)', name: 'অসমীয়া' },
  { code: 'bg-BG', label: 'Български (Bulgarian)', name: 'Български' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)', name: 'বাংলা' },
  { code: 'cs-CZ', label: 'Čeština (Czech)', name: 'Čeština' },
  { code: 'da-DK', label: 'Dansk (Danish)', name: 'Dansk' },
  { code: 'de-DE', label: 'Deutsch (German)', name: 'Deutsch' },
  { code: 'el-GR', label: 'Ελληνικά (Greek)', name: 'Ελληνικά' },
  { code: 'en-GB', label: 'English (UK)', name: 'English (UK)' },
  { code: 'en-IN', label: 'English (India)', name: 'English (India)' },
  { code: 'es-ES', label: 'Español (Spanish)', name: 'Español' },
  { code: 'fa-IR', label: 'فارسی (Persian)', name: 'فارسی' },
  { code: 'fil-PH', label: 'Filipino', name: 'Filipino' },
  { code: 'fi-FI', label: 'Suomi (Finnish)', name: 'Suomi' },
  { code: 'fr-FR', label: 'Français (French)', name: 'Français' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', name: 'ગુજરાતી' },
  { code: 'ha-NG', label: 'Hausa', name: 'Hausa' },
  { code: 'he-IL', label: 'עברית (Hebrew)', name: 'עברית' },
  { code: 'hu-HU', label: 'Magyar (Hungarian)', name: 'Magyar' },
  { code: 'id-ID', label: 'Bahasa Indonesia', name: 'Bahasa Indonesia' },
  { code: 'it-IT', label: 'Italiano (Italian)', name: 'Italiano' },
  { code: 'ja-JP', label: '日本語 (Japanese)', name: '日本語' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)', name: 'ಕನ್ನಡ' },
  { code: 'ko-KR', label: '한국어 (Korean)', name: '한국어' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)', name: 'മലയാളം' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', name: 'मराठी' },
  { code: 'ms-MY', label: 'Bahasa Melayu', name: 'Bahasa Melayu' },
  { code: 'ne-NP', label: 'नेपाली (Nepali)', name: 'नेपाली' },
  { code: 'nl-NL', label: 'Nederlands (Dutch)', name: 'Nederlands' },
  { code: 'no-NO', label: 'Norsk (Norwegian)', name: 'Norsk' },
  { code: 'or-IN', label: 'ଓଡ଼ିଆ (Odia)', name: 'ଓଡ଼ିଆ' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)', name: 'ਪੰਜਾਬੀ' },
  { code: 'pl-PL', label: 'Polski (Polish)', name: 'Polski' },
  { code: 'pt-BR', label: 'Português (Brasil)', name: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portuguese)', name: 'Português' },
  { code: 'ro-RO', label: 'Română (Romanian)', name: 'Română' },
  { code: 'ru-RU', label: 'Русский (Russian)', name: 'Русский' },
  { code: 'si-LK', label: 'සිංහල (Sinhala)', name: 'සිංහල' },
  { code: 'sk-SK', label: 'Slovenčina (Slovak)', name: 'Slovenčina' },
  { code: 'sv-SE', label: 'Svenska (Swedish)', name: 'Svenska' },
  { code: 'sw-KE', label: 'Kiswahili (Swahili)', name: 'Kiswahili' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', name: 'தமிழ்' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', name: 'తెలుగు' },
  { code: 'th-TH', label: 'ไทย (Thai)', name: 'ไทย' },
  { code: 'tr-TR', label: 'Türkçe (Turkish)', name: 'Türkçe' },
  { code: 'uk-UA', label: 'Українська (Ukrainian)', name: 'Українська' },
  { code: 'ur-IN', label: 'اردو (Urdu)', name: 'اردو' },
  { code: 'vi-VN', label: 'Tiếng Việt (Vietnamese)', name: 'Tiếng Việt' },
  { code: 'yo-NG', label: 'Yorùbá (Yoruba)', name: 'Yorùbá' },
  { code: 'zh-CN', label: '中文简体 (Chinese Simplified)', name: '简体中文' },
  { code: 'zh-TW', label: '中文繁體 (Chinese Traditional)', name: '繁體中文' },
  { code: 'zu-ZA', label: 'isiZulu (Zulu)', name: 'isiZulu' },
];

const LanguageContext = createContext(null);
const DEFAULT_TRANSLATIONS = { 'en-US': enUS };
const localeLoaders = import.meta.glob([
  './locales/*.json',
  '!./locales/en-US.json',
  '!./locales/landing-*.json',
]);
const STATIC_LANDING_TRANSLATIONS = {
  'hi-IN': landingHiIN,
};
const missingTranslationRequests = new Map();

// Map old language codes to new ones for backward compatibility
const LANGUAGE_CODE_MAP = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'ar': 'ar-SA',
  'bn': 'bn-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'mr': 'mr-IN',
  'ne': 'ne-NP',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'ur': 'ur-IN',
  'as': 'as-IN',
  'or': 'or-IN',
  'pa': 'pa-IN',
  'zh': 'zh-CN',
  'pt': 'pt-PT',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'ru': 'ru-RU',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'th': 'th-TH',
  'vi': 'vi-VN',
  'id': 'id-ID',
  'ms': 'ms-MY',
};

function normalizeLanguageCode(code) {
  if (!code) return 'en-US';
  // If it's an old code, map it to new code
  if (LANGUAGE_CODE_MAP[code]) {
    return LANGUAGE_CODE_MAP[code];
  }
  // If it's already a full code, return as is
  return code;
}

async function loadLocaleMessages(lang) {
  if (!lang || DEFAULT_TRANSLATIONS[lang]) {
    return DEFAULT_TRANSLATIONS[lang] || DEFAULT_TRANSLATIONS['en-US'];
  }

  try {
    const loader = localeLoaders[`./locales/${lang}.json`];
    if (!loader) return DEFAULT_TRANSLATIONS['en-US'];

    const module = await loader();
    const localeMessages = {
      ...(module.default || {}),
      ...(STATIC_LANDING_TRANSLATIONS[lang] || {}),
    };
    return localeMessages;
  } catch (error) {
    console.warn(`[i18n] Unable to load locale ${lang}:`, error);
    return DEFAULT_TRANSLATIONS['en-US'];
  }
}

async function translateMissingMessages(lang, localeMessages, onProgress) {
  const normalizedLang = normalizeLanguageCode(lang);
  if (normalizedLang === 'en-US') return {};

  // Several older locale files contain a complete key set but leave some
  // values copied verbatim from English. Treat those values as untranslated,
  // just like absent/blank keys, so every supported language benefits from
  // newly added menus, pages, cards, and modals without per-language patches.
  const missingEntries = Object.entries(enUS).filter(([key, englishValue]) => {
    if (!englishValue || typeof englishValue !== 'string') return false;
    const localizedValue = localeMessages?.[key];
    if (!localizedValue || typeof localizedValue !== 'string') return true;
    return localizedValue.trim().toLocaleLowerCase()
      === englishValue.trim().toLocaleLowerCase();
  });
  if (!missingEntries.length) return {};

  const requestKey = `${normalizedLang}:${missingEntries.map(([key]) => key).join('|')}`;
  if (!missingTranslationRequests.has(requestKey)) {
    missingTranslationRequests.set(
      requestKey,
      translationService.translateBatch(
        missingEntries.map(([, value]) => value),
        normalizedLang,
        'en-US',
        (updates) => {
          if (typeof onProgress !== 'function') return;
          const partialMessages = Object.fromEntries(
            updates.flatMap(({ index, original, translated }) => (
              translated && translated !== original
                ? [[missingEntries[index][0], translated]]
                : []
            )),
          );
          if (Object.keys(partialMessages).length) onProgress(partialMessages);
        },
      ).then((translatedValues) => Object.fromEntries(
        missingEntries.flatMap(([key, originalValue], index) => {
          const translatedValue = translatedValues[index];
          return translatedValue && translatedValue !== originalValue
            ? [[key, translatedValue]]
            : [];
        }),
      )).finally(() => missingTranslationRequests.delete(requestKey)),
    );
  }

  return missingTranslationRequests.get(requestKey);
}

export function LanguageProvider({ children }) {
  const siteLanguageRequestRef = useRef(0);
  const [userLang, setUserLangState] = useState(() => {
    const saved = localStorage.getItem(USER_LANG_KEY);
    const normalized = normalizeLanguageCode(saved);
    return normalized;
  });

  const [counselorLang, setCounselorLangState] = useState(() => {
    const saved = localStorage.getItem(COUNSELOR_LANG_KEY);
    const normalized = normalizeLanguageCode(saved);
    return normalized;
  });
  const [siteLang, setSiteLangState] = useState(() => {
    const saved = localStorage.getItem(SITE_LANG_KEY) || localStorage.getItem(USER_LANG_KEY);
    return normalizeLanguageCode(saved);
  });
  const [loadedTranslations, setLoadedTranslations] = useState(DEFAULT_TRANSLATIONS);

  const ensureLanguageLoaded = useCallback((lang) => {
    const normalized = normalizeLanguageCode(lang);
    const mergeLandingMessages = (landingMessages) => {
      if (!Object.keys(landingMessages).length) return;
      setLoadedTranslations((prev) => ({
        ...prev,
        [normalized]: {
          ...(prev[normalized] || {}),
          ...landingMessages,
        },
      }));
    };

    if (loadedTranslations[normalized]) {
      if (normalized !== 'en-US') {
        translateMissingMessages(
          normalized,
          loadedTranslations[normalized],
          mergeLandingMessages,
        ).then(mergeLandingMessages);
      }
      return;
    }

    loadLocaleMessages(normalized).then((messages) => {
      setLoadedTranslations((prev) => {
        if (prev[normalized]) return prev;
        return { ...prev, [normalized]: messages };
      });

      // Render the locale immediately, then fill only the missing landing keys
      // through the same translation API used by the rest of the application.
      if (normalized !== 'en-US') {
        translateMissingMessages(
          normalized,
          messages,
          mergeLandingMessages,
        ).then(mergeLandingMessages);
      }
    });
  }, [loadedTranslations]);

  useEffect(() => {
    ensureLanguageLoaded(userLang);
    ensureLanguageLoaded(counselorLang);
    ensureLanguageLoaded(siteLang);
  }, [counselorLang, ensureLanguageLoaded, siteLang, userLang]);

  const setUserLang = useCallback((lang) => {
    const normalized = normalizeLanguageCode(lang);
    localStorage.setItem(USER_LANG_KEY, normalized);
    setUserLangState(normalized);
  }, []);

  const setCounselorLang = useCallback((lang) => {
    const normalized = normalizeLanguageCode(lang);
    localStorage.setItem(COUNSELOR_LANG_KEY, normalized);
    setCounselorLangState(normalized);
  }, []);

  // Choosing a language on a public page also seeds both portals, so the
  // preference survives sign-up/login instead of resetting to English.
  const setSiteLang = useCallback(async (lang) => {
    const normalized = normalizeLanguageCode(lang);
    localStorage.setItem(SITE_LANG_KEY, normalized);
    localStorage.setItem(USER_LANG_KEY, normalized);
    localStorage.setItem(COUNSELOR_LANG_KEY, normalized);
    setUserLangState(normalized);
    setCounselorLangState(normalized);
    setSiteLangState(normalized);

    const requestId = ++siteLanguageRequestRef.current;
    if (normalized === 'en-US') return;

    try {
      const baseMessages = loadedTranslations[normalized]
        || await loadLocaleMessages(normalized);
      const landingMessages = await translateMissingMessages(
        normalized,
        baseMessages,
      );
      if (requestId !== siteLanguageRequestRef.current) return;

      setLoadedTranslations((prev) => ({
        ...prev,
        [normalized]: {
          ...baseMessages,
          ...landingMessages,
        },
      }));
    } catch (error) {
      // Do not undo the user's selection when the translation API is slow or
      // unavailable. Static messages remain usable and missing keys can retry.
      console.warn(`[i18n] Unable to prepare landing locale ${normalized}:`, error);
    }
  }, [loadedTranslations]);

  return (
    <LanguageContext.Provider
      value={{
        userLang,
        setUserLang,
        counselorLang,
        setCounselorLang,
        siteLang,
        setSiteLang,
        translations: loadedTranslations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

const TRANSLATION_KEY_ALIASES = {
  send_chat_request: ["send_chat_request", "counselor.messageCounselor"],
  request_sent: ["request_sent", "chat_request_sent"],
};

function makeT(lang, translations) {
  return (key) => {
    const lookupKeys = TRANSLATION_KEY_ALIASES[key] || [key];

    for (const lookupKey of lookupKeys) {
      if (translations[lang]?.[lookupKey]) {
        return translations[lang][lookupKey];
      }
    }

    for (const lookupKey of lookupKeys) {
      if (translations["en-US"]?.[lookupKey]) {
        return translations["en-US"][lookupKey];
      }
    }

    return key;
  };
}

export function useUserTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useUserTranslation must be used within LanguageProvider');
  return { t: makeT(ctx.userLang, ctx.translations), lang: ctx.userLang, setLang: ctx.setUserLang };
}

// For public pages (landing, signup, login) where no role is known yet.
export function useSiteTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useSiteTranslation must be used within LanguageProvider');
  return { t: makeT(ctx.siteLang, ctx.translations), lang: ctx.siteLang, setLang: ctx.setSiteLang };
}

export function useCounselorTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useCounselorTranslation must be used within LanguageProvider');
  return { t: makeT(ctx.counselorLang, ctx.translations), lang: ctx.counselorLang, setLang: ctx.setCounselorLang };
}

export function useUserApiTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useUserApiTranslation must be used within LanguageProvider');

  const translate = useCallback(async (text) => {
    return translationService.translate(text, ctx.userLang);
  }, [ctx.userLang]);

  return {
    translate,
    lang: ctx.userLang,
    setLang: ctx.setUserLang,
  };
}

export function useCounselorApiTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useCounselorApiTranslation must be used within LanguageProvider');

  const translate = useCallback(async (text) => {
    return translationService.translate(text, ctx.counselorLang);
  }, [ctx.counselorLang]);

  return {
    translate,
    lang: ctx.counselorLang,
    setLang: ctx.setCounselorLang,
  };
}
