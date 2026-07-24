import i18n from "./index";

const STORAGE_KEY = "confia_language";

export const getLanguage = () => {
  return localStorage.getItem(STORAGE_KEY) || "auto";
};

export const setLanguage = (language: string) => {
  localStorage.setItem(STORAGE_KEY, language);

  if (language === "auto") {
    i18n.changeLanguage(navigator.language.split("-")[0]);
  } else {
    i18n.changeLanguage(language);
  }
};

export const initLanguage = () => {
  const saved = getLanguage();

  if (saved === "auto") {
    i18n.changeLanguage(navigator.language.split("-")[0]);
  } else {
    i18n.changeLanguage(saved);
  }
};
