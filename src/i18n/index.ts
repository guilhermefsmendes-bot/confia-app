import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import pt from "../locales/pt.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";

/*
 * CONFIA — IDIOMA AUTOMÁTICO
 *
 * Prioridade:
 *
 * 1. escolha manual guardada
 * 2. idioma do dispositivo
 * 3. inglês como fallback internacional
 *
 * A CONFIA suporta apenas PT / EN / ES / FR.
 */

export const CONFIA_SUPPORTED_LANGUAGES = [
  "pt",
  "en",
  "es",
  "fr",
] as const;

export type ConfiaLanguage =
  (typeof CONFIA_SUPPORTED_LANGUAGES)[number];

export const getSupportedDeviceLanguage = (): ConfiaLanguage => {
  const deviceLanguage =
    typeof navigator !== "undefined"
      ? navigator.language?.split("-")[0]?.toLowerCase()
      : "";

  return CONFIA_SUPPORTED_LANGUAGES.includes(
    deviceLanguage as ConfiaLanguage
  )
    ? (deviceLanguage as ConfiaLanguage)
    : "en";
};

const getInitialLanguage = (): ConfiaLanguage => {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("confia_language");

    if (
      saved &&
      saved !== "auto" &&
      CONFIA_SUPPORTED_LANGUAGES.includes(
        saved as ConfiaLanguage
      )
    ) {
      return saved as ConfiaLanguage;
    }
  }

  return getSupportedDeviceLanguage();
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    supportedLngs: [...CONFIA_SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
