import i18n, {
  CONFIA_SUPPORTED_LANGUAGES,
  ensureLanguageLoaded,
  getSupportedDeviceLanguage,
  getInitialLanguage,
  type ConfiaLanguage,
} from "./index";

const STORAGE_KEY = "confia_language";
export type LanguagePreference = ConfiaLanguage | "auto";

const isSupportedLanguage = (language: string): language is ConfiaLanguage =>
  CONFIA_SUPPORTED_LANGUAGES.includes(language as ConfiaLanguage);

export const getLanguage = (): LanguagePreference => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "auto") return "auto";
  if (saved && isSupportedLanguage(saved)) return saved;
  return "auto";
};

const syncDocumentLanguage = (language: ConfiaLanguage) => {
  if (typeof document !== "undefined") document.documentElement.lang = language;
};

export const setLanguage = async (language: LanguagePreference): Promise<void> => {
  localStorage.setItem(STORAGE_KEY, language);
  const resolved = language === "auto" ? getSupportedDeviceLanguage() : language;
  try {
    // Os quatro dicionários têm exatamente as mesmas 3.056 chaves: carrega
    // apenas o idioma escolhido e reserva inglês para recuperação em caso de erro.
    await ensureLanguageLoaded(resolved);
    await i18n.changeLanguage(resolved);
    syncDocumentLanguage(resolved);
  } catch (error) {
    // Se um idioma secundário falhar a carregar, mantém a app utilizável em inglês.
    await ensureLanguageLoaded("en");
    await i18n.changeLanguage("en");
    syncDocumentLanguage("en");
    if (typeof console !== "undefined") console.warn("[Confia] language_load_failed", error);
  }
};

export const initLanguage = async (): Promise<void> => {
  const saved = getLanguage();
  const resolved = saved === "auto" ? getInitialLanguage() : saved;
  try {
    await ensureLanguageLoaded(resolved);
    await i18n.changeLanguage(resolved);
    syncDocumentLanguage(resolved);
  } catch (error) {
    // Um erro de rede num idioma não pode impedir a montagem da aplicação.
    try {
      await ensureLanguageLoaded("en");
      await i18n.changeLanguage("en");
      syncDocumentLanguage("en");
    } catch {
      console.error("[Confia] unable_to_load_translations", error);
    }
  }
};
