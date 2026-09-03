import json
import shutil
from pathlib import Path

BASE = Path("src/locales")

translations = {
    "pt": {
        "needTwoDaysMessage": "Precisas de pelo menos dois dias de registos para veres padrões.",
        "positiveFrequency": "Frequência positiva ativa"
    },
    "en": {
        "needTwoDaysMessage": "You need at least two days of entries to see patterns.",
        "positiveFrequency": "Positive frequency active"
    },
    "es": {
        "needTwoDaysMessage": "Necesitas al menos dos días de registros para ver patrones.",
        "positiveFrequency": "Frecuencia positiva activa"
    },
    "fr": {
        "needTwoDaysMessage": "Tu dois avoir au moins deux jours de données pour voir des tendances.",
        "positiveFrequency": "Fréquence positive active"
    }
}

print("=" * 50)
print("CORREÇÃO DAS TRADUÇÕES DO DIÁRIO DE EVOLUÇÃO")
print("=" * 50)

for lang, values in translations.items():

    file = BASE / f"{lang}.json"

    if not file.exists():
        print(f"⚠ Ficheiro não encontrado: {file}")
        continue

    # Backup
    backup = BASE / f"{lang}.json.backup_progresso"
    shutil.copy2(file, backup)
    print(f"Backup criado: {backup}")

    # Ler JSON
    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Corrigir traduções
    for key, value in values.items():
        old = data.get(key)

        if old == value:
            print(f"✓ {lang}: {key} já estava correto")
        else:
            print(f"✓ {lang}: {key}")
            print(f"    Antes: {old}")
            print(f"    Depois: {value}")
            data[key] = value

    # Guardar
    with open(file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


print()
print("=" * 50)
print("VERIFICAÇÃO FINAL")
print("=" * 50)

for lang, values in translations.items():

    file = BASE / f"{lang}.json"

    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)

    for key, expected in values.items():

        actual = data.get(key)

        if actual == expected:
            print(f"✓ {lang}: {key}")
        else:
            print(f"✗ {lang}: {key}")
            print(f"  Esperado: {expected}")
            print(f"  Atual:    {actual}")

print()
print("Correção concluída.")
print("Backups criados com o sufixo: .backup_progresso")
