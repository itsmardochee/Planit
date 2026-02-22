import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
import authEN from './locales/en/auth.json';
import homeEN from './locales/en/home.json';
import workspaceEN from './locales/en/workspace.json';
import boardEN from './locales/en/board.json';
import listsEN from './locales/en/lists.json';
import modalsEN from './locales/en/modals.json';
import cardsEN from './locales/en/cards.json';
import notificationsEN from './locales/en/notifications.json';
import activityEN from './locales/en/activity.json';

import commonFR from './locales/fr/common.json';
import dashboardFR from './locales/fr/dashboard.json';
import authFR from './locales/fr/auth.json';
import homeFR from './locales/fr/home.json';
import workspaceFR from './locales/fr/workspace.json';
import boardFR from './locales/fr/board.json';
import listsFR from './locales/fr/lists.json';
import modalsFR from './locales/fr/modals.json';
import cardsFR from './locales/fr/cards.json';
import notificationsFR from './locales/fr/notifications.json';
import activityFR from './locales/fr/activity.json';

const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    auth: authEN,
    home: homeEN,
    workspace: workspaceEN,
    board: boardEN,
    lists: listsEN,
    modals: modalsEN,
    cards: cardsEN,
    notifications: notificationsEN,
    activity: activityEN,
  },
  fr: {
    common: commonFR,
    dashboard: dashboardFR,
    auth: authFR,
    home: homeFR,
    workspace: workspaceFR,
    board: boardFR,
    lists: listsFR,
    modals: modalsFR,
    cards: cardsFR,
    notifications: notificationsFR,
    activity: activityFR,
  },
};

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Fallback language
    defaultNS: 'common', // Default namespace
    ns: [
      'common',
      'dashboard',
      'auth',
      'home',
      'workspace',
      'board',
      'lists',
      'modals',
      'cards',
      'notifications',
      'activity',
    ],

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
