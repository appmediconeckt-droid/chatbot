import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './locales/index.js';

const USER_LANG_KEY = 'userLang';
const COUNSELOR_LANG_KEY = 'counselorLang';

export const SUPPORTED_LANGUAGES = [
  // Priority Languages - Use full codes to match translations object
  { code: 'en-US', label: 'English', name: 'English' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', name: 'हिंदी' },

  // English Variants
  { code: 'en-GB', label: 'English (UK)', name: 'English (UK)' },
  { code: 'en-IN', label: 'English (India)', name: 'English (India)' },

  // World Languages
  { code: 'ar-SA', label: 'العربية (Arabic)', name: 'العربية' },
  { code: 'zh-CN', label: '中文简体 (Chinese Simplified)', name: '简体中文' },
  { code: 'zh-TW', label: '中文繁體 (Chinese Traditional)', name: '繁體中文' },
  { code: 'fr-FR', label: 'Français (French)', name: 'Français' },
  { code: 'de-DE', label: 'Deutsch (German)', name: 'Deutsch' },
  { code: 'ja-JP', label: '日本語 (Japanese)', name: '日本語' },
  { code: 'ko-KR', label: '한국어 (Korean)', name: '한국어' },
  { code: 'pt-PT', label: 'Português (Portuguese)', name: 'Português' },
  { code: 'pt-BR', label: 'Português (Brasil)', name: 'Português (Brasil)' },
  { code: 'ru-RU', label: 'Русский (Russian)', name: 'Русский' },
  { code: 'es-ES', label: 'Español (Spanish)', name: 'Español' },
  { code: 'th-TH', label: 'ไทย (Thai)', name: 'ไทย' },

  // Indian & South Asian Languages
  { code: 'bn-IN', label: 'বাংলা (Bengali)', name: 'বাংলা' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', name: 'ગુજરાતી' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)', name: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)', name: 'മലയാളം' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', name: 'मराठी' },
  { code: 'ne-NP', label: 'नेपाली (Nepali)', name: 'नेपाली' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', name: 'தமிழ்' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', name: 'తెలుగు' },
  { code: 'ur-IN', label: 'اردو (Urdu)', name: 'اردو' },
  { code: 'as-IN', label: 'অসমীয়া (Assamese)', name: 'অসমীয়া' },
  { code: 'or-IN', label: 'ଓଡ଼ିଆ (Odia)', name: 'ଓଡ଼ିଆ' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)', name: 'ਪੰਜਾਬੀ' },
  { code: 'si-LK', label: 'සිංහල (Sinhala)', name: 'සිංහල' },

  // Southeast Asian Languages
  { code: 'id-ID', label: 'Bahasa Indonesia', name: 'Bahasa Indonesia' },
  { code: 'ms-MY', label: 'Bahasa Melayu', name: 'Bahasa Melayu' },
  { code: 'vi-VN', label: 'Tiếng Việt (Vietnamese)', name: 'Tiếng Việt' },
  { code: 'fil-PH', label: 'Filipino', name: 'Filipino' },

  // Middle Eastern Languages
  { code: 'fa-IR', label: 'فارسی (Persian)', name: 'فارسی' },
  { code: 'he-IL', label: 'עברית (Hebrew)', name: 'עברית' },
  { code: 'tr-TR', label: 'Türkçe (Turkish)', name: 'Türkçe' },

  // European Languages
  { code: 'uk-UA', label: 'Українська (Ukrainian)', name: 'Українська' },
  { code: 'pl-PL', label: 'Polski (Polish)', name: 'Polski' },
  { code: 'cs-CZ', label: 'Čeština (Czech)', name: 'Čeština' },
  { code: 'sk-SK', label: 'Slovenčina (Slovak)', name: 'Slovenčina' },
  { code: 'hu-HU', label: 'Magyar (Hungarian)', name: 'Magyar' },
  { code: 'ro-RO', label: 'Română (Romanian)', name: 'Română' },
  { code: 'bg-BG', label: 'Български (Bulgarian)', name: 'Български' },
  { code: 'el-GR', label: 'Ελληνικά (Greek)', name: 'Ελληνικά' },
  { code: 'nl-NL', label: 'Nederlands (Dutch)', name: 'Nederlands' },
  { code: 'sv-SE', label: 'Svenska (Swedish)', name: 'Svenska' },
  { code: 'da-DK', label: 'Dansk (Danish)', name: 'Dansk' },
  { code: 'fi-FI', label: 'Suomi (Finnish)', name: 'Suomi' },
  { code: 'no-NO', label: 'Norsk (Norwegian)', name: 'Norsk' },
  { code: 'it-IT', label: 'Italiano (Italian)', name: 'Italiano' },

  // African Languages
  { code: 'af-ZA', label: 'Afrikaans', name: 'Afrikaans' },
  { code: 'sw-KE', label: 'Kiswahili (Swahili)', name: 'Kiswahili' },
  { code: 'am-ET', label: 'አማርኛ (Amharic)', name: 'አማርኛ' },
  { code: 'ha-NG', label: 'Hausa', name: 'Hausa' },
  { code: 'yo-NG', label: 'Yorùbá (Yoruba)', name: 'Yorùbá' },
  { code: 'zu-ZA', label: 'isiZulu (Zulu)', name: 'isiZulu' },
];

const LanguageContext = createContext(null);

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

export function LanguageProvider({ children }) {
  const [userLang, setUserLangState] = useState(() => {
    const saved = localStorage.getItem(USER_LANG_KEY);
    const normalized = normalizeLanguageCode(saved);
    console.log(`[LanguageContext] Initialized userLang: ${saved} → ${normalized}`);
    return normalized;
  });

  const [counselorLang, setCounselorLangState] = useState(() => {
    const saved = localStorage.getItem(COUNSELOR_LANG_KEY);
    const normalized = normalizeLanguageCode(saved);
    console.log(`[LanguageContext] Initialized counselorLang: ${saved} → ${normalized}`);
    return normalized;
  });

  const setUserLang = useCallback((lang) => {
    const normalized = normalizeLanguageCode(lang);
    console.log(`[LanguageContext] 🌐 Changing userLang to: ${lang} → ${normalized}`);
    localStorage.setItem(USER_LANG_KEY, normalized);
    setUserLangState(normalized);
  }, []);

  const setCounselorLang = useCallback((lang) => {
    const normalized = normalizeLanguageCode(lang);
    console.log(`[LanguageContext] 🌐 Changing counselorLang to: ${lang} → ${normalized}`);
    localStorage.setItem(COUNSELOR_LANG_KEY, normalized);
    setCounselorLangState(normalized);
  }, []);

  return (
    <LanguageContext.Provider value={{ userLang, setUserLang, counselorLang, setCounselorLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

function makeT(lang) {
  return (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key;
}

export function useUserTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useUserTranslation must be used within LanguageProvider');
  return { t: makeT(ctx.userLang), lang: ctx.userLang, setLang: ctx.setUserLang };
}

export function useCounselorTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useCounselorTranslation must be used within LanguageProvider');
  return { t: makeT(ctx.counselorLang), lang: ctx.counselorLang, setLang: ctx.setCounselorLang };
}
