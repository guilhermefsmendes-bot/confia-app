from pathlib import Path
import json
import shutil
import sys

translations = {
    "pt": {
        "language": "Idioma",
        "chooseLanguage": "Escolhe o idioma da aplicação."
    },
    "en": {
        "language": "Language",
        "chooseLanguage": "Choose the language for the app."
    },
    "es": {
        "language": "Idioma",
        "chooseLanguage": "Elige el idioma de la aplicación."
    },
    "fr": {
        "language": "Langue",
        "chooseLanguage": "Choisis la langue de l'application."
    }
}

print("=" * 80)
print("CONFIA — TRADUÇÕES DO SELETOR DE IDIOMA")
print("=" * 80)

for lang, values in translations.items():

    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        print(f"ERRO: {path} não encontrado.")
        sys.exit(1)

    # Backup
    backup = Path(f"/tmp/{lang}.json.before_language_selector")
    shutil.copy2(path, backup)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"ERRO: {lang}.json inválido: {e}")
        sys.exit(1)

    # Não sobrescrever nada existente
    for key in values:
        if key in data:
            print(f"ERRO: {lang}: '{key}' já existe.")
            print("NENHUMA ALTERAÇÃO FOI FEITA.")
            sys.exit(1)

    data.update(values)

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )

    print(f"OK: {lang} — language + chooseLanguage")

# ============================================================
# VALIDAR TODOS OS JSON
# ============================================================

for lang in translations:
    path = Path(f"src/locales/{lang}.json")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"ERRO FINAL: {lang}.json inválido: {e}")
        sys.exit(1)

    for key in ["language", "chooseLanguage"]:
        if data.get(key) != translations[lang][key]:
            print(f"ERRO FINAL: {lang}.{key} incorreto.")
            sys.exit(1)

print()
print("=" * 80)
print("RESULTADO")
print("=" * 80)
print("OK: PT")
print("OK: EN")
print("OK: ES")
print("OK: FR")
print("OK: 8 traduções adicionadas.")
print("OK: os 4 JSON continuam válidos.")
print()
print("NÃO EXECUTAR BUILD.")
print("Próximo passo: inserir o seletor de idioma no App.tsx.")
print("=" * 80)
