import { ensureLanguageLoaded, CONFIA_SUPPORTED_LANGUAGES, type ConfiaLanguage, getSupportedDeviceLanguage } from "./index";

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

export const setLanguage = async (language: LanguagePreference) => {
  localStorage.setItem(STORAGE_KEY, language);
  const resolved = language === "auto" ? getSupportedDeviceLanguage() : language;
  await ensureLanguageLoaded(resolved);
};

export const initLanguage = () => {
  const saved = getLanguage();

  const resolved = saved === "auto" ? getSupportedDeviceLanguage() : saved;
  void ensureLanguageLoaded(resolved);
};
