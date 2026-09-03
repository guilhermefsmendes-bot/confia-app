from pathlib import Path
import shutil
import re
import sys

# ============================================================
# CONFIA — RELEASE 1.0.37
#
# Altera apenas:
# android/app/build.gradle
#
# versionCode 36 -> 37
# versionName "1.0.36" -> "1.0.37"
# ============================================================

ROOT = Path.cwd()
FILE = ROOT / "android/app/build.gradle"
BACKUP = Path("/tmp/build.gradle.before_1.0.37")

print("=" * 78)
print("CONFIA — PREPARAR VERSÃO 1.0.37")
print("=" * 78)

if not FILE.exists():
    print(f"ERRO: não encontrado: {FILE}")
    sys.exit(1)

text = FILE.read_text(encoding="utf-8")

code_match = re.search(r"\bversionCode\s+(\d+)", text)
name_match = re.search(r'\bversionName\s+"([^"]+)"', text)

if not code_match or not name_match:
    print("ERRO: não foi possível localizar versionCode/versionName.")
    print("Nenhum ficheiro foi alterado.")
    sys.exit(1)

current_code = int(code_match.group(1))
current_name = name_match.group(1)

print()
print(f"Versão atual: versionCode {current_code}")
print(f"Versão atual: versionName {current_name}")

if current_code == 37 and current_name == "1.0.37":
    print()
    print("✓ A versão já está em 1.0.37 / versionCode 37.")
    sys.exit(0)

if current_code != 36 or current_name != "1.0.36":
    print()
    print("ERRO: a versão atual não é a esperada.")
    print("Esperado: versionCode 36 / versionName 1.0.36")
    print("Nenhum ficheiro foi alterado.")
    sys.exit(1)

shutil.copy2(FILE, BACKUP)

new_text = re.sub(
    r"\bversionCode\s+36\b",
    "versionCode 37",
    text,
    count=1,
)

new_text = re.sub(
    r'\bversionName\s+"1\.0\.36"',
    'versionName "1.0.37"',
    new_text,
    count=1,
)

FILE.write_text(new_text, encoding="utf-8")

final = FILE.read_text(encoding="utf-8")

if (
    not re.search(r"\bversionCode\s+37\b", final)
    or not re.search(r'\bversionName\s+"1\.0\.37"', final)
):
    shutil.copy2(BACKUP, FILE)

    print()
    print("ERRO: validação final falhou.")
    print("Backup restaurado.")
    sys.exit(1)

print()
print("✓ versionCode 37")
print('✓ versionName "1.0.37"')
print("✓ Nenhum outro ficheiro alterado pelo script")
print()
print(f"Backup: {BACKUP}")
print()
print("CONFIA 1.0.37 preparada.")
print("=" * 78)
