import json
import shutil
from pathlib import Path

APP = Path("src/App.tsx")
LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

# ---------------------------------------------------------
# BACKUP
# ---------------------------------------------------------

backup = APP.with_name(APP.name + ".backup_i18n_definicoes")
shutil.copy2(APP, backup)

print(f"Backup criado: {backup}")

# ---------------------------------------------------------
# CHAVES NECESSÁRIAS
# ---------------------------------------------------------

required = [
    "communityGuidelines",
    "communityGuidelinesDescription",
    "communityGuidelinesShort",
    "viewCommunityGuidelines",
    "deleteMyData",
    "deleteMyDataDescription",
]

# ---------------------------------------------------------
# VERIFICAR TRADUÇÕES
# ---------------------------------------------------------

translations = {}

for lang, path in LOCALES.items():

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    translations[lang] = data

    missing = [
        key for key in required
        if key not in data
    ]

    if missing:
        print(f"⚠ {lang}: faltam {missing}")
    else:
        print(f"✓ {lang}: todas as chaves existem")

# ---------------------------------------------------------
# SUBSTITUIR TEXTO HARDCODED NO APP.TSX
# ---------------------------------------------------------

text = APP.read_text(encoding="utf-8")

replacements = {

    # Descrição das regras
    "Conhece as regras para uma comunidade segura e respeitosa.":
        '{t("communityGuidelinesShort")}',

    # Descrição dos dados
    "Elimina as tuas publicações, reações, conversas e restantes dados associados à tua conta.":
        '{t("deleteMyDataDescription")}',

    # Botão eliminar
    "🗑️ Eliminar todos os meus dados":
        '🗑️ {t("deleteMyData")}',

}

changed = 0

for old, new in replacements.items():

    if old in text:
        text = text.replace(old, new)
        print(f"✓ Substituído: {old}")
        changed += 1
    else:
        print(f"⚠ Não encontrado: {old}")

# ---------------------------------------------------------
# CASOS SEM PONTO FINAL / QUEBRA DE LINHA
# ---------------------------------------------------------

# Caso o texto esteja separado por JSX em várias linhas,
# procuramos especificamente o conteúdo literal.

text = text.replace(
    "Conhece as regras para uma comunidade segura e respeitosa.",
    '{t("communityGuidelinesShort")}'
)

text = text.replace(
    "Elimina as tuas publicações, reações, conversas e restantes dados associados à tua conta.",
    '{t("deleteMyDataDescription")}'
)

text = text.replace(
    "🗑️ Eliminar todos os meus dados",
    '🗑️ {t("deleteMyData")}'
)

# ---------------------------------------------------------
# GRAVAR
# ---------------------------------------------------------

APP.write_text(text, encoding="utf-8")

print()
print("==========================================")
print("CORREÇÃO CONCLUÍDA")
print("==========================================")
print(f"Substituições iniciais: {changed}")
print(f"Backup: {backup}")

# ---------------------------------------------------------
# VERIFICAÇÃO FINAL
# ---------------------------------------------------------

final_text = APP.read_text(encoding="utf-8")

checks = {
    "communityGuidelinesShort": 't("communityGuidelinesShort")',
    "deleteMyDataDescription": 't("deleteMyDataDescription")',
    "deleteMyData": 't("deleteMyData")',
}

print()
print("=== VERIFICAÇÃO NO APP.TSX ===")

for key, pattern in checks.items():

    if pattern in final_text:
        print(f"✓ {key}")
    else:
        print(f"⚠ {key} NÃO encontrado")

print()
print("Agora execute:")
print("npm run build")
