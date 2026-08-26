import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import enUS from './locales/en-US.json';
import landingHiIN from './locales/landing-hi-IN.json';
import { translations as localeTranslations } from './locales';
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
// Keep every shipped locale available synchronously. Previously only English
// was present on the first render and the selected locale arrived through a
// lazy import later. That left already-mounted dashboard tabs (and notably the
// Wallet sidebar item) rendering the English fallback after a language change.
const DEFAULT_TRANSLATIONS = {
  ...localeTranslations,
  'en-US': enUS,
  'hi-IN': {
    ...(localeTranslations['hi-IN'] || {}),
    ...landingHiIN,
  },
};
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
  if (!lang) return DEFAULT_TRANSLATIONS['en-US'];
  return {
    ...(DEFAULT_TRANSLATIONS[lang] || DEFAULT_TRANSLATIONS['en-US']),
    ...(STATIC_LANDING_TRANSLATIONS[lang] || {}),
  };
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
  // New dashboard labels can reuse equivalent keys that already exist in all
  // locale files. This keeps the UI localized even if the translation API is
  // slow or unavailable.
  consultants: ["consultants", "counselor.title", "counselor"],
  wallet: ["wallet", "dashboard.wallet"],
  mental_health_experts: ["mental_health_experts", "counselor.title", "counselor"],
  find_your: ["find_your", "select_counselor"],
  your_wallet: ["your_wallet", "wallet"],
  wallet_tracking_subtitle: ["wallet_tracking_subtitle", "transaction_history", "call_history"],
  wallet_transaction_history: ["wallet_transaction_history", "transaction_history", "call_history"],
  total_spent: ["total_spent", "total_spent_this_month"],
  wallet_transaction_summary: ["wallet_transaction_summary", "transaction_history"],
  search_transactions: ["search_transactions", "search"],
  transaction_details: ["transaction_details", "transaction_history"],
  category: ["category", "type"],
  loading_transaction_history: ["loading_transaction_history", "loading"],
  available_balance: ["available_balance", "wallet"],
  credits: ["credits", "amount"],
  spent: ["spent", "total_spent_this_month", "amount"],
  completed: ["completed", "status"],
  enter_amount: ["enter_amount", "amount"],
  custom_amount: ["custom_amount", "amount"],
  secure_encryption: ["secure_encryption", "security", "privacy"],
  premium_health: ["premium_health", "wallet"],
  proceed_to_pay: ["proceed_to_pay", "add_money"],
  new: ["new"],
  book_counselor_subtitle: ["book_counselor_subtitle", "select_counselor"],
  recommended_for_you: ["recommended_for_you", "select_counselor"],
  available_counselors: ["available_counselors", "online_counselors"],
  see_all: ["see_all", "view_all_requests"],
  no_counselors_found: ["no_counselors_found", "error_load_counselors"],
  adjust_search_filters: ["adjust_search_filters", "search_counselors"],
  chat_session: ["chat_session", "chat"],
  wallet_balance: ["wallet_balance", "wallet"],
  show_less: ["show_less", "view_details"],
  unread: ["unread", "settings.notification"],
  archived: ["archived", "transaction_history", "call_history"],
  transaction_history: ["transaction_history", "call_history"],
  view_history: ["view_history", "transaction_history", "call_history"],
  nearby: ["nearby", "location"],
  top_rated: ["top_rated", "rating"],
  therapist: ["therapist", "counselor.title", "counselor"],
  unavailable: ["unavailable", "counselor_unavailable", "status"],
  book: ["book_appointment", "counselor.bookAppointment", "book"],
  appointments_subtitle: ["appointments_subtitle", "appointments_timeline", "appointments"],
  confirmed: ["confirmed", "appointment_confirmation", "status"],
  upcoming: ["upcoming", "appointment.upcoming", "appointments"],
  view_details: ["view_details", "appointment_details"],
  years: ["years", "experience"],
  track_call_records: ["track_call_records", "call_history"],
  yesterday: ["yesterday", "past"],
  incoming: ["incoming", "call_history"],
  outgoing: ["outgoing", "call_history"],
  calls: ["calls", "call_history"],
  video_call: ["video_call", "call_history"],
  voice_call: ["voice_call", "call_history"],
  search_settings: ["search_settings", "settings"],
  protected: ["protected", "security", "privacy"],
  account_authentication_active: ["account_authentication_active", "account", "security"],
  profile_protection_enabled: ["profile_protection_enabled", "profile", "privacy"],
  update_location: ["update_location", "location"],
  update_current_password: ["update_current_password", "change_password", "current_password"],
  app_lock: ["app_lock", "security"],
  app_lock_description: ["app_lock_description", "privacy"],
  "settings.security": ["settings.security", "security", "privacy"],
  security: ["security", "privacy"],
  login: ["login", "account"],
  change_password: ["change_password", "current_password", "password"],
  add_password: ["add_password", "password"],
  notifications: ["notifications", "settings.notification"],
  manage_reminders: ["manage_reminders", "settings.notification"],
  mark_all_read: ["mark_all_read", "mark_as_read", "settings.notification"],
  mark_as_read: ["mark_as_read", "settings.notification"],
  chats: ["chats", "chat"],
  wallet_payments: ["wallet_payments", "wallet"],
  personal_information: ["personal_information", "profile"],
  blood_group: ["blood_group", "medical_details", "profile"],
  address: ["address", "location"],
  city: ["city", "location"],
  state: ["state", "location"],
  pincode: ["pincode", "location"],
  country: ["country", "location"],
  relation: ["relation", "emergency_contact", "profile"],
  help_support_subtitle: ["help_support_subtitle", "help_support"],
  how_can_we_help: ["how_can_we_help", "help_support"],
  popular_questions: ["popular_questions", "help_support"],
  no_help_articles: ["no_help_articles", "help_support"],
  need_immediate_help: ["need_immediate_help", "emergency"],
  medical_emergency_notice: ["medical_emergency_notice", "emergency"],
  emergency_contact: ["emergency_contact", "emergency"],
  crisis_resources: ["crisis_resources", "emergency"],
  emergency: ["emergency", "help_support"],
  time: ["time", "date"],
  terms_of_service: ["terms_of_service", "help_support"],
  privacy_policy: ["privacy_policy", "privacy"],
  privacy_policy_subtitle: ["privacy_policy_subtitle", "privacy"],
  data_is_secure: ["data_is_secure", "privacy", "security"],
  data_collection: ["data_collection", "privacy"],
  information_collected: ["information_collected", "privacy"],
  purpose: ["purpose", "privacy"],
  data_collection_purpose: ["data_collection_purpose", "privacy"],
  interactions_encrypted: ["interactions_encrypted", "security", "privacy"],
  quick_actions: ["quick_actions", "settings"],
  security_settings: ["security_settings", "security"],
  delete_account: ["delete_account", "account"],
  your_privacy_checklist: ["your_privacy_checklist", "privacy_checklist", "privacy"],
  need_privacy_help: ["need_privacy_help", "help_support", "privacy"],
  privacy_support_description: ["privacy_support_description", "help_support", "privacy"],
  contact_support: ["contact_support", "help_support"],
  privacy_settings: ["privacy_settings", "privacy", "settings"],
  all: ["all", "view_all_requests"],
  pending: ["pending", "status"],
  past: ["past", "call_history"],
  today: ["today", "date"],
  patient: ["patient", "profile"],
  patients: ["patients", "profile"],
  type: ["type", "category"],
  status: ["status"],
  sessions: ["sessions", "appointments"],
  recent_sessions: ["recent_sessions", "sessions", "appointments"],
  weekly_overview: ["weekly_overview", "appointments"],
  upcoming_appointments: ["upcoming_appointments", "appointments"],
  recent_messages: ["recent_messages", "messages", "chat"],
  messages: ["messages", "chat"],
  view_all: ["view_all", "view_all_requests"],
  details: ["details", "view_details"],
  schedule: ["schedule", "appointments"],
  todays_schedule: ["todays_schedule", "appointments"],
  new_session: ["new_session", "sessions", "appointments"],
  total_patients: ["total_patients", "patients", "profile"],
  todays_sessions: ["todays_sessions", "sessions", "appointments"],
  monthly_earnings: ["monthly_earnings", "earnings", "wallet"],
  filter_by_date: ["filter_by_date", "date"],
  pinned: ["pinned", "messages", "chat"],
  sign_out: ["sign_out", "logout"],
  add_password_by_otp: ["add_password_by_otp", "add_password", "password"],
  add_notes: ["add_notes", "notes"],
  invoice: ["invoice", "wallet"],
  reports: ["reports", "view_details"],
  new_patient: ["new_patient", "patient", "profile"],
  scheduled: ["scheduled", "appointments"],
  in_progress: ["in_progress", "status"],
  in_person: ["in_person", "appointments"],
  password_security: ["password_security", "security", "password"],
  verification_code: ["verification_code", "otp"],
  verifying: ["verifying", "loading"],
  verify_otp: ["verify_otp", "otp"],
  otp_verified: ["otp_verified", "verified"],
  new_password: ["new_password", "password"],
  confirm_password: ["confirm_password", "password"],
  minimum_8_characters: ["minimum_8_characters", "password"],
  strong_password: ["strong_password", "password", "security"],
  save_changes: ["save_changes", "save"],
  from_date: ["from_date", "date"],
  to_date: ["to_date", "date"],
  maximum: ["maximum", "amount"],
  accept_request: ["accept_request", "accept"],
  reject_request: ["reject_request", "reject"],
  accept_request_confirmation: ["accept_request_confirmation", "request_sent", "chat"],
  reject_request_confirmation: ["reject_request_confirmation", "request_sent", "chat"],
  accepting: ["accepting", "accept", "loading"],
  rejecting: ["rejecting", "reject", "loading"],
  recent: ["recent", "last_message", "chat"],
  search_conversations: ["search_conversations", "search_chats", "search"],
  search_patients: ["search_patients", "search", "patients", "profile"],
  good_morning: ["good_morning", "dashboard.welcome"],
  good_afternoon: ["good_afternoon", "dashboard.welcome"],
  good_evening: ["good_evening", "dashboard.welcome"],
  age_not_provided: ["age_not_provided", "profile.years", "profile"],
  gender_not_provided: ["gender_not_provided", "profile.selectGender", "profile"],
  male: ["male", "profile.male"],
  female: ["female", "profile.female"],
  other: ["other", "profile.other"],
  general: ["general", "profile"],
  normal: ["normal", "status"],
  urgent: ["urgent", "emergency"],
  follow_up: ["follow_up", "appointments"],
  counselling_sessions_overview: ["counselling_sessions_overview", "sessions", "appointments"],
  showing_for: ["showing_for", "date"],
  view_tomorrow: ["view_tomorrow", "upcoming", "date"],
  day_summary: ["day_summary", "sessions"],
  total_sessions: ["total_sessions", "sessions"],
  remaining: ["remaining", "pending", "status"],
  system_normal: ["system_normal", "normal", "status"],
  video_session: ["video_session", "video_call", "sessions"],
  returning_patient: ["returning_patient", "patient", "profile"],
  earnings_overview: ["earnings_overview", "earnings", "wallet"],
  total_earning: ["total_earning", "earnings", "wallet"],
  withdraw: ["withdraw", "wallet", "amount"],
  withdrawable: ["withdrawable", "available_balance", "wallet"],
  recent_transactions: ["recent_transactions", "transaction_history", "wallet"],
  earning_history: ["earning_history", "transaction_history", "earnings"],
  earning_records: ["earning_records", "transaction_history", "earnings"],
  user_session: ["user_session", "sessions", "patient"],
  gross: ["gross", "amount"],
  your_earning: ["your_earning", "earnings", "wallet"],
  earning_status: ["earning_status", "status"],
  payout: ["payout", "wallet"],
  available: ["available", "available_balance", "wallet"],
  anonymous_user: ["anonymous_user", "profile"],
  counselor_share: ["counselor_share", "earnings", "counselor"],
  platform_commission: ["platform_commission", "earnings", "wallet"],
  withdrawal_requests: ["withdrawal_requests", "wallet"],
  withdrawal_status_description: ["withdrawal_status_description", "status", "wallet"],
  bank_account: ["bank_account", "account", "wallet"],
  standard: ["standard", "status"],
  standard_processing: ["standard_processing", "status"],
  approved: ["approved", "completed", "status"],
  paid: ["paid", "completed", "status"],
  payment_processing: ["payment_processing", "pending", "status"],
  payout_type: ["payout_type", "type", "wallet"],
  no_withdrawable_balance: ["no_withdrawable_balance", "available_balance", "wallet"],
};

const getSemanticAliases = (key) => {
  const normalized = String(key || "").toLocaleLowerCase();
  if (normalized.startsWith("sessions.")) {
    if (/no.?sessions|empty/.test(normalized)) return ["no_sessions_for_date", "sessions"];
    if (/refresh/.test(normalized)) return ["refresh_messages", "sessions"];
    if (/view.?details|details|reason|notes/.test(normalized)) return ["view_details", "appointments"];
    if (/conduct|start/.test(normalized)) return ["start_video_call", "sessions"];
    if (/patient|profile/.test(normalized)) return ["patient", "profile"];
    if (/filter|date/.test(normalized)) return ["date", "sessions"];
    if (/close/.test(normalized)) return ["close", "sessions"];
    return ["sessions", "appointments"];
  }
  if (normalized.startsWith("support.")) {
    if (/wallet|payment/.test(normalized)) return ["wallet"];
    if (/appointment|book|reschedule/.test(normalized)) return ["appointments"];
    if (/security|password|fraud|verification/.test(normalized)) return ["security"];
    if (/email/.test(normalized)) return ["email"];
    if (/minute|hour|within|available247/.test(normalized)) return ["time"];
    if (/call/.test(normalized)) return ["call_history"];
    if (/chat|assistant|instant/.test(normalized)) return ["chat"];
    if (/search/.test(normalized)) return ["search"];
    return ["help_support"];
  }
  if (normalized.startsWith("privacy.")) {
    if (/wallet|payment|transaction/.test(normalized)) return ["wallet"];
    if (/appointment|session/.test(normalized)) return ["appointments"];
    if (/chat|call|conversation/.test(normalized)) return ["chat"];
    if (/profile|detail/.test(normalized)) return ["profile"];
    if (/password|otp|security|encrypt|secure/.test(normalized)) return ["security"];
    if (/download|record|data/.test(normalized)) return ["privacy"];
    return ["privacy"];
  }
  return [];
};

const normalizeConsultantTerminology = (value) => {
  if (typeof value !== "string") return value;

  return value
    .replace(/\bCounsellors\b/g, "Consultants")
    .replace(/\bCounselors\b/g, "Consultants")
    .replace(/\bCounsellor\b/g, "Consultant")
    .replace(/\bCounselor\b/g, "Consultant")
    .replace(/\bcounsellors\b/g, "consultants")
    .replace(/\bcounselors\b/g, "consultants")
    .replace(/\bcounsellor\b/g, "consultant")
    .replace(/\bcounselor\b/g, "consultant");
};

function makeT(lang, translations) {
  return (key) => {
    const resolveLocalized = (lookupKey, visited = new Set()) => {
      if (visited.has(lookupKey)) return null;
      const nextVisited = new Set(visited).add(lookupKey);
      const localizedValue = translations[lang]?.[lookupKey];
      const englishValue = translations["en-US"]?.[lookupKey];
      const isEnglishCopy = lang !== "en-US"
        && typeof localizedValue === "string"
        && typeof englishValue === "string"
        && localizedValue.trim().toLocaleLowerCase()
          === englishValue.trim().toLocaleLowerCase();

      if (localizedValue && !isEnglishCopy) return localizedValue;

      const aliases = TRANSLATION_KEY_ALIASES[lookupKey]
        || getSemanticAliases(lookupKey);
      for (const alias of aliases) {
        const resolved = resolveLocalized(alias, nextVisited);
        if (resolved) return resolved;
      }
      return null;
    };

    const localized = resolveLocalized(key);
    if (localized) return normalizeConsultantTerminology(localized);

    const lookupKeys = TRANSLATION_KEY_ALIASES[key] || [key];

    for (const lookupKey of lookupKeys) {
      if (translations["en-US"]?.[lookupKey]) {
        return normalizeConsultantTerminology(translations["en-US"][lookupKey]);
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
    const translated = await translationService.translate(
      normalizeConsultantTerminology(text),
      ctx.userLang,
    );
    return normalizeConsultantTerminology(translated);
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
    const translated = await translationService.translate(
      normalizeConsultantTerminology(text),
      ctx.counselorLang,
    );
    return normalizeConsultantTerminology(translated);
  }, [ctx.counselorLang]);

  return {
    translate,
    lang: ctx.counselorLang,
    setLang: ctx.setCounselorLang,
  };
}
