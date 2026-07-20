import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./en.json";
import translationVI from "./vi.json";

// Translation resources
const resources = {
  en: {
    translation: translationEN,
  },
  vi: {
    translation: translationVI,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: "en",
    lng: window.localStorage.getItem("scholartrend.language") || "en",

    // Debug in development
    debug: false,

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Detection options
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "scholartrend.language",
    },
  });

export default i18n;
