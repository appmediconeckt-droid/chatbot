import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const USER_LANG_KEY = 'userLang';
const COUNSELOR_LANG_KEY = 'counselorLang';

export const SUPPORTED_LANGUAGES = [
  // Priority Languages
  { code: 'en', label: 'English', region: 'priority' },
  { code: 'hi', label: 'हिन्दी (Hindi)', region: 'priority' },

  // World Languages
  { code: 'zh', label: '中文 (Chinese)', region: 'world' },
  { code: 'es', label: 'Español (Spanish)', region: 'world' },
  { code: 'fr', label: 'Français (French)', region: 'world' },
  { code: 'ar', label: 'العربية (Arabic)', region: 'world' },
  { code: 'pt', label: 'Português (Portuguese)', region: 'world' },
  { code: 'ru', label: 'Русский (Russian)', region: 'world' },
  { code: 'ja', label: '日本語 (Japanese)', region: 'world' },
  { code: 'de', label: 'Deutsch (German)', region: 'world' },
  { code: 'de-CH', label: 'Deutsch - Schweiz (German - Switzerland)', region: 'world' },
  { code: 'th', label: 'ไทย (Thai)', region: 'world' },
  { code: 'ko', label: '한국어 (Korean)', region: 'world' },

  // Indian & South Asian Languages
  { code: 'ta', label: 'தமிழ் (Tamil)', region: 'indian' },
  { code: 'te', label: 'తెలుగు (Telugu)', region: 'indian' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', region: 'indian' },
  { code: 'ml', label: 'മലയാളം (Malayalam)', region: 'indian' },
  { code: 'bn', label: 'বাংলা (Bengali)', region: 'indian' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', region: 'indian' },
  { code: 'mr', label: 'मराठी (Marathi)', region: 'indian' },
  { code: 'ur', label: 'اردو (Urdu)', region: 'indian' },
  { code: 'ne', label: 'नेपाली (Nepali)', region: 'indian' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [userLang, setUserLangState] = useState(
    () => localStorage.getItem(USER_LANG_KEY) || 'en'
  );
  const [counselorLang, setCounselorLangState] = useState(
    () => localStorage.getItem(COUNSELOR_LANG_KEY) || 'en'
  );

  const setUserLang = useCallback((lang) => {
    localStorage.setItem(USER_LANG_KEY, lang);
    setUserLangState(lang);
  }, []);

  const setCounselorLang = useCallback((lang) => {
    localStorage.setItem(COUNSELOR_LANG_KEY, lang);
    setCounselorLangState(lang);
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
  console.log('🔄 User Translation Updated:', ctx.userLang);
  return { t: makeT(ctx.userLang), lang: ctx.userLang, setLang: ctx.setUserLang };
}

export function useCounselorTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useCounselorTranslation must be used within LanguageProvider');
  console.log('🔄 Counselor Translation Updated:', ctx.counselorLang);
  return { t: makeT(ctx.counselorLang), lang: ctx.counselorLang, setLang: ctx.setCounselorLang };
}
