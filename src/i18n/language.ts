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

export const setLanguage = (
  language: LanguagePreference
) => {
  localStorage.setItem(STORAGE_KEY, language);

  if (language === "auto") {
    i18n.changeLanguage(
      getSupportedDeviceLanguage()
    );
    return;
  }

  i18n.changeLanguage(language);
};

export const initLanguage = () => {
  const saved = getLanguage();

  if (saved === "auto") {
    i18n.changeLanguage(
      getSupportedDeviceLanguage()
    );
    return;
  }

  i18n.changeLanguage(saved);
};
