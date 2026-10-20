import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/*
 * CONFIA — carregamento de idiomas sob procura.
 * Mantém os quatro idiomas, mas não inclui os quatro dicionários no bundle
 * inicial. O idioma selecionado e o inglês (fallback) são carregados à parte.
 */
export const CONFIA_SUPPORTED_LANGUAGES = ["pt", "en", "es", "fr"] as const;
export type ConfiaLanguage = (typeof CONFIA_SUPPORTED_LANGUAGES)[number];

const localeLoaders: Record<ConfiaLanguage, () => Promise<{ default: Record<string, unknown> }>> = {
  pt: () => import("../locales/pt.json"),
  en: () => import("../locales/en.json"),
  es: () => import("../locales/es.json"),
  fr: () => import("../locales/fr.json"),
};

const loadedLanguages = new Set<ConfiaLanguage>();
const loadingLanguages = new Map<ConfiaLanguage, Promise<void>>();

export const getSupportedDeviceLanguage = (): ConfiaLanguage => {
  const deviceLanguage = typeof navigator !== "undefined"
    ? navigator.language?.split("-")[0]?.toLowerCase()
    : "";
  return CONFIA_SUPPORTED_LANGUAGES.includes(deviceLanguage as ConfiaLanguage)
    ? (deviceLanguage as ConfiaLanguage)
    : "en";
};

export const getInitialLanguage = (): ConfiaLanguage => {
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("confia_language");
    if (saved && saved !== "auto" && CONFIA_SUPPORTED_LANGUAGES.includes(saved as ConfiaLanguage)) {
      return saved as ConfiaLanguage;
    }
  }
  return getSupportedDeviceLanguage();
};

// Inicializa o motor sem importar os ficheiros JSON. O bootstrap carrega os
// recursos necessários antes de montar a interface, evitando mostrar chaves.
export const i18nReady = i18n.use(initReactI18next).init({
  resources: {},
  lng: getInitialLanguage(),
  fallbackLng: "en",
  supportedLngs: [...CONFIA_SUPPORTED_LANGUAGES],
  nonExplicitSupportedLngs: true,
  interpolation: { escapeValue: false },
});

export async function ensureLanguageLoaded(language: ConfiaLanguage): Promise<void> {
  if (loadedLanguages.has(language)) return;
  const existing = loadingLanguages.get(language);
  if (existing) return existing;

  const pending = i18nReady
    .then(() => localeLoaders[language]())
    .then(({ default: translation }) => {
      i18n.addResourceBundle(language, "translation", translation, true, true);
      loadedLanguages.add(language);
    })
    .finally(() => loadingLanguages.delete(language));
  loadingLanguages.set(language, pending);
  return pending;
}

export default i18n;
