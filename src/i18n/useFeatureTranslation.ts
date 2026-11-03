import { useTranslation as useI18nextTranslation } from "react-i18next";
import { ensureFeatureNamespace, type FeatureNamespace, type ConfiaLanguage } from "./index";

/**
 * Loads a feature's locale on first render. The pending promise is thrown so
 * the feature's existing React.Suspense boundary shows its loading fallback.
 */
export function useTranslation(namespace: FeatureNamespace) {
  const { i18n } = useI18nextTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2) as ConfiaLanguage;

  if (!i18n.hasResourceBundle(language, namespace)) {
    throw ensureFeatureNamespace(language, namespace);
  }

  return {
    i18n,
    t: i18n.getFixedT(language, namespace),
  };
}
