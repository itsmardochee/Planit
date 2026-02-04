import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
import authEN from './locales/en/auth.json';

import commonFR from './locales/fr/common.json';
import dashboardFR from './locales/fr/dashboard.json';
import authFR from './locales/fr/auth.json';

const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    auth: authEN,
  },
  fr: {
    common: commonFR,
    dashboard: dashboardFR,
    auth: authFR,
  },
};

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language
    defaultNS: 'common', // Default namespace
    ns: ['common', 'dashboard', 'auth'],

    interpolation: {
      escapeValue: false, // React already protects from XSS
    },

    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Keys or params to lookup language from
      lookupLocalStorage: 'i18nextLng',

      // Cache user language on
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
  });

export default i18n;
