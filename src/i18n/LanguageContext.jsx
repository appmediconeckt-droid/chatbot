import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const USER_LANG_KEY = 'userLang';
const COUNSELOR_LANG_KEY = 'counselorLang';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'mr', label: 'मराठी' },
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
