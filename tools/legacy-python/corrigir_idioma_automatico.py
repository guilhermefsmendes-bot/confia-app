from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — IDIOMA AUTOMÁTICO PREMIUM
#
# Objetivo:
#
# PRIMEIRA INSTALAÇÃO
#   idioma do dispositivo
#       ↓
#   pt / en / es / fr
#       ↓
#   outro idioma -> inglês
#
# ESCOLHA MANUAL
#   passa sempre a ter prioridade
#
# Não adiciona:
# - dependências
# - useState
# - useEffect
# - timers
# - listeners
#
# Modifica apenas:
# - src/i18n/index.ts
# - src/i18n/language.ts
# ============================================================

ROOT = Path.cwd()

INDEX = ROOT / "src/i18n/index.ts"
LANGUAGE = ROOT / "src/i18n/language.ts"

BACKUP_INDEX = Path("/tmp/index.ts.before_idioma_automatico")
BACKUP_LANGUAGE = Path("/tmp/language.ts.before_idioma_automatico")

print("=" * 78)
print("CONFIA — IDIOMA AUTOMÁTICO")
print("=" * 78)

# ------------------------------------------------------------
# VALIDAR FICHEIROS
# ------------------------------------------------------------

for path in [INDEX, LANGUAGE]:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

index_before = INDEX.read_text(encoding="utf-8")
language_before = LANGUAGE.read_text(encoding="utf-8")

# ------------------------------------------------------------
# VALIDAR ARQUITETURA ATUAL
# ------------------------------------------------------------

required_index = [
    'import i18n from "i18next";',
    'import { initReactI18next } from "react-i18next";',
    'import pt from "../locales/pt.json";',
    'import en from "../locales/en.json";',
    'import es from "../locales/es.json";',
    'import fr from "../locales/fr.json";',
    'lng: "pt"',
    'fallbackLng: "pt"',
]

required_language = [
    'const STORAGE_KEY = "confia_language";',
    'localStorage.getItem(STORAGE_KEY) || "auto"',
    'navigator.language.split("-")[0]',
    'export const setLanguage',
    'export const initLanguage',
]

missing = []

for token in required_index:
    if token not in index_before:
        missing.append(f"index.ts: {token}")

for token in required_language:
    if token not in language_before:
        missing.append(f"language.ts: {token}")

if missing:
    print()
    print("ERRO — arquitetura esperada não encontrada:")
    for item in missing:
        print(f"  ✗ {item}")
    print()
    print("Nenhum ficheiro foi alterado.")
    sys.exit(1)

# ------------------------------------------------------------
# EVITAR DUPLICAÇÃO
# ------------------------------------------------------------

if "CONFIA_SUPPORTED_LANGUAGES" in index_before:
    print()
    print("ERRO — correção parece já estar aplicada.")
    print("Nenhum ficheiro foi alterado.")
    sys.exit(1)

# ------------------------------------------------------------
# BACKUPS
# ------------------------------------------------------------

shutil.copy2(INDEX, BACKUP_INDEX)
shutil.copy2(LANGUAGE, BACKUP_LANGUAGE)

# ------------------------------------------------------------
# NOVO index.ts
# ------------------------------------------------------------

index_after = '''import i18n from "i18next";
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
'''

# ------------------------------------------------------------
# NOVO language.ts
# ------------------------------------------------------------

language_after = '''import i18n, {
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
'''

# ------------------------------------------------------------
# ESCREVER
# ------------------------------------------------------------

try:
    INDEX.write_text(index_after, encoding="utf-8")
    LANGUAGE.write_text(language_after, encoding="utf-8")
except Exception as exc:
    shutil.copy2(BACKUP_INDEX, INDEX)
    shutil.copy2(BACKUP_LANGUAGE, LANGUAGE)

    print()
    print(f"ERRO AO ESCREVER: {exc}")
    print("Backups restaurados.")
    sys.exit(1)

# ------------------------------------------------------------
# VALIDAÇÃO PÓS-ESCRITA
# ------------------------------------------------------------

new_index = INDEX.read_text(encoding="utf-8")
new_language = LANGUAGE.read_text(encoding="utf-8")

checks = {
    "PT suportado":
        '"pt"' in new_index,

    "EN suportado":
        '"en"' in new_index,

    "ES suportado":
        '"es"' in new_index,

    "FR suportado":
        '"fr"' in new_index,

    "Fallback internacional EN":
        'fallbackLng: "en"' in new_index,

    "Deteção do dispositivo":
        "getSupportedDeviceLanguage" in new_index,

    "Lista fechada de idiomas":
        "CONFIA_SUPPORTED_LANGUAGES" in new_index,

    "Escolha manual preservada":
        "localStorage.setItem(STORAGE_KEY, language)"
        in new_language,

    "Modo auto preservado":
        'language === "auto"' in new_language,

    "Idioma inválido não é usado":
        "isSupportedLanguage" in new_language,

    "initLanguage preservado":
        "export const initLanguage" in new_language,

    "Sem PT forçado":
        'lng: "pt"' not in new_index,

    "Sem fallback PT":
        'fallbackLng: "pt"' not in new_index,
}

failed = [
    name
    for name, ok in checks.items()
    if not ok
]

if failed:
    shutil.copy2(BACKUP_INDEX, INDEX)
    shutil.copy2(BACKUP_LANGUAGE, LANGUAGE)

    print()
    print("ERRO — validação final falhou:")

    for item in failed:
        print(f"  ✗ {item}")

    print()
    print("Backups restaurados.")
    sys.exit(1)

# ------------------------------------------------------------
# GARANTIR QUE NÃO INTRODUZIMOS MECANISMOS PESADOS
# ------------------------------------------------------------

for forbidden in [
    "useState(",
    "useEffect(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame(",
    "addEventListener(",
]:
    if forbidden in new_index or forbidden in new_language:
        shutil.copy2(BACKUP_INDEX, INDEX)
        shutil.copy2(BACKUP_LANGUAGE, LANGUAGE)

        print()
        print(
            f"ERRO — mecanismo inesperado encontrado: {forbidden}"
        )
        print("Backups restaurados.")
        sys.exit(1)

# ------------------------------------------------------------
# RESULTADO
# ------------------------------------------------------------

print()
print("✓ Idioma português detetado automaticamente")
print("✓ Idioma inglês detetado automaticamente")
print("✓ Idioma espanhol detetado automaticamente")
print("✓ Idioma francês detetado automaticamente")
print("✓ Outros idiomas usam inglês")
print("✓ Escolha manual continua a ter prioridade")
print("✓ Modo automático preservado")
print("✓ Definições continuam a poder mudar o idioma")
print("✓ PT deixou de ser imposto na inicialização")
print("✓ Fallback internacional alterado para EN")
print("✓ Sem novo useState")
print("✓ Sem novo useEffect")
print("✓ Sem timers")
print("✓ Sem listeners")
print("✓ Sem requestAnimationFrame")
print("✓ Sem dependências")
print("✓ Nenhum JSON de traduções alterado")

print()
print("Backups:")
print(f"  {BACKUP_INDEX}")
print(f"  {BACKUP_LANGUAGE}")

print()
print("COMPORTAMENTO FINAL:")
print()
print("Primeira instalação:")
print("  telemóvel PT -> CONFIA em PT")
print("  telemóvel EN -> CONFIA em EN")
print("  telemóvel ES -> CONFIA em ES")
print("  telemóvel FR -> CONFIA em FR")
print("  outro idioma -> CONFIA em EN")
print()
print("Depois de escolha manual:")
print("  idioma escolhido -> sempre prioritário")

print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print()
print("=" * 78)
