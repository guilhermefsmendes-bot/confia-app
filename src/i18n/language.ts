import i18n, {
  CONFIA_SUPPORTED_LANGUAGES,
  ConfiaLanguage,
  getSupportedDeviceLanguage,
} from "./index";

const STORAGE_KEY = "confia_language";

export type LanguagePreference =
  | ConfiaLanguage
  | "auto";

const isSupportedLanguage = (
  language: string
): language is ConfiaLanguage =>
  CONFIA_SUPPORTED_LANGUAGES.includes(
    language as ConfiaLanguage
  );

export const getLanguage = (): LanguagePreference => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === "auto") {
    return "auto";
  }

  if (saved && isSupportedLanguage(saved)) {
    return saved;
  }

  return "auto";
};

const syncDocumentLanguage = (language: ConfiaLanguage) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
};

export const setLanguage = (
  language: LanguagePreference
) => {
  localStorage.setItem(STORAGE_KEY, language);

  if (language === "auto") {
    const deviceLanguage = getSupportedDeviceLanguage();
    i18n.changeLanguage(deviceLanguage);
    syncDocumentLanguage(deviceLanguage);
    return;
  }

  i18n.changeLanguage(language);
  syncDocumentLanguage(language);
};

export const initLanguage = () => {
  const saved = getLanguage();

  if (saved === "auto") {
    const deviceLanguage = getSupportedDeviceLanguage();
    i18n.changeLanguage(deviceLanguage);
    syncDocumentLanguage(deviceLanguage);
    return;
  }

  i18n.changeLanguage(saved);
  syncDocumentLanguage(saved);
};
