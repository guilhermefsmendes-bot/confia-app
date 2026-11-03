import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const CONFIA_SUPPORTED_LANGUAGES = ["pt", "en", "es", "fr"] as const;
export type ConfiaLanguage = (typeof CONFIA_SUPPORTED_LANGUAGES)[number];
export type FeatureNamespace = "habits" | "innerCanvas" | "companion" | "patternsNew";

type LocaleModule = { default: Record<string, unknown> };
const localeLoaders: Record<ConfiaLanguage, () => Promise<LocaleModule>> = {
  pt: () => import("../locales/pt.json"),
  en: () => import("../locales/en.json"),
  es: () => import("../locales/es.json"),
  fr: () => import("../locales/fr.json"),
};

const featureLoaders: Record<ConfiaLanguage, Record<FeatureNamespace, () => Promise<LocaleModule>>> = {
  pt: {
    habits: () => import("../locales/features/pt/habits.json"),
    innerCanvas: () => import("../locales/features/pt/innerCanvas.json"),
    companion: () => import("../locales/features/pt/companion.json"),
    patternsNew: () => import("../locales/features/pt/patternsNew.json"),
  },
  en: {
    habits: () => import("../locales/features/en/habits.json"),
    innerCanvas: () => import("../locales/features/en/innerCanvas.json"),
    companion: () => import("../locales/features/en/companion.json"),
    patternsNew: () => import("../locales/features/en/patternsNew.json"),
  },
  es: {
    habits: () => import("../locales/features/es/habits.json"),
    innerCanvas: () => import("../locales/features/es/innerCanvas.json"),
    companion: () => import("../locales/features/es/companion.json"),
    patternsNew: () => import("../locales/features/es/patternsNew.json"),
  },
  fr: {
    habits: () => import("../locales/features/fr/habits.json"),
    innerCanvas: () => import("../locales/features/fr/innerCanvas.json"),
    companion: () => import("../locales/features/fr/companion.json"),
    patternsNew: () => import("../locales/features/fr/patternsNew.json"),
  },
};

const pendingFeatureLoads = new Map<string, Promise<void>>();

export const getSupportedDeviceLanguage = (): ConfiaLanguage => {
  const deviceLanguage = typeof navigator !== "undefined" ? navigator.language?.split("-")[0]?.toLowerCase() : "";
  return CONFIA_SUPPORTED_LANGUAGES.includes(deviceLanguage as ConfiaLanguage) ? deviceLanguage as ConfiaLanguage : "en";
};

const getInitialLanguage = (): ConfiaLanguage => {
  try {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("confia_language") : null;
    if (saved && saved !== "auto" && CONFIA_SUPPORTED_LANGUAGES.includes(saved as ConfiaLanguage)) return saved as ConfiaLanguage;
  } catch { /* device language remains the fallback */ }
  return getSupportedDeviceLanguage();
};

async function loadLocale(language: ConfiaLanguage) {
  if (i18n.hasResourceBundle(language, "translation")) return;
  const locale = await localeLoaders[language]();
  i18n.addResourceBundle(language, "translation", locale.default, true, true);
}

export function ensureFeatureNamespace(language: ConfiaLanguage, namespace: FeatureNamespace): Promise<void> {
  if (i18n.hasResourceBundle(language, namespace)) return Promise.resolve();
  const key = language + ":" + namespace;
  const existing = pendingFeatureLoads.get(key);
  if (existing) return existing;
  const loader = featureLoaders[language][namespace];
  const pending = loader()
    .then(module => {
      i18n.addResourceBundle(language, namespace, module.default, true, true);
    })
    .finally(() => pendingFeatureLoads.delete(key));
  pendingFeatureLoads.set(key, pending);
  return pending;
}

const initialLanguage = getInitialLanguage();
export const i18nReady = (async () => {
  await i18n.use(initReactI18next).init({
    resources: {},
    lng: initialLanguage,
    ns: ["translation"],
    defaultNS: "translation",
    fallbackNS: "translation",
    fallbackLng: false,
    supportedLngs: [...CONFIA_SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
  });
  await loadLocale(initialLanguage);
  await i18n.changeLanguage(initialLanguage);
  if (typeof document !== "undefined") document.documentElement.lang = initialLanguage;
})();

export async function ensureLanguageLoaded(language: ConfiaLanguage) {
  await i18nReady;
  await loadLocale(language);
  await i18n.changeLanguage(language);
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

export default i18n;
