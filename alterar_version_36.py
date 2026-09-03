from pathlib import Path
import shutil
import re
import sys

APP = Path("android/app/build.gradle")
BACKUP = Path("/tmp/build.gradle.before_version_36")

if not APP.exists():
    print("ERRO: android/app/build.gradle não encontrado.")
    sys.exit(1)

text = APP.read_text(encoding="utf-8")

# Backup
shutil.copy2(APP, BACKUP)

# Verificar versão atual
if not re.search(r'\bversionCode\s+35\b', text):
    print("ERRO: versionCode 35 não encontrado.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if not re.search(r'\bversionName\s+"1\.0\.35"', text):
    print('ERRO: versionName "1.0.35" não encontrado.')
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Alterar versão
updated = re.sub(
    r'\bversionCode\s+35\b',
    'versionCode 36',
    text,
    count=1
)

updated = re.sub(
    r'\bversionName\s+"1\.0\.35"',
    'versionName "1.0.36"',
    updated,
    count=1
)

# Validar
if not re.search(r'\bversionCode\s+36\b', updated):
    print("ERRO: versionCode 36 não ficou definido.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if not re.search(r'\bversionName\s+"1\.0\.36"', updated):
    print('ERRO: versionName "1.0.36" não ficou definido.')
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

# Garantir que não existem os valores antigos
if re.search(r'\bversionCode\s+35\b', updated):
    print("ERRO: versionCode 35 ainda existe.")
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

if re.search(r'\bversionName\s+"1\.0\.35"', updated):
    print('ERRO: versionName "1.0.35" ainda existe.')
    shutil.copy2(BACKUP, APP)
    sys.exit(1)

APP.write_text(updated, encoding="utf-8")

print("=" * 70)
print("CONFIA — VERSÃO 1.0.36")
print("=" * 70)
print()
print("OK: backup criado.")
print("OK: versionCode 35 → 36")
print('OK: versionName "1.0.35" → "1.0.36"')
print("OK: valores antigos removidos.")
print()
print("Próximo passo:")
print("grep -n -E 'versionCode|versionName' android/app/build.gradle")
print("=" * 70)
