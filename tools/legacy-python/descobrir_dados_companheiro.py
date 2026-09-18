from pathlib import Path
import re

ROOT = Path("src")

patterns = [
    r"localStorage",
    r"sessionStorage",
    r"mood",
    r"rating",
    r"morning",
    r"afternoon",
    r"objective",
    r"objectives",
    r"intervention",
    r"habit",
    r"history",
    r"journal",
    r"progress",
    r"XP",
    r"xp",
]

print("=" * 60)
print("CONFIA — MAPA DOS DADOS DO COMPANHEIRO")
print("=" * 60)

files_found = {}

for path in ROOT.rglob("*"):
    if not path.is_file():
        continue

    if path.suffix not in [".ts", ".tsx", ".json"]:
        continue

    # Ignorar ficheiros de backup
    if any(x in path.name.lower() for x in [
        ".backup",
        ".bak",
        ".corrupt",
        "_old",
        "_old.",
        "corrompido"
    ]):
        continue

    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue

    matches = []

    for pattern in patterns:
        found = list(re.finditer(pattern, text, re.IGNORECASE))
        if found:
            matches.append((pattern, len(found)))

    if matches:
        files_found[path] = matches


for path, matches in sorted(files_found.items()):
    print()
    print(f"📁 {path}")

    for pattern, count in matches:
        print(f"   {pattern:<18} {count} ocorrência(s)")


print()
print("=" * 60)
print("POSSÍVEIS FICHEIROS DE ARMAZENAMENTO")
print("=" * 60)

storage_files = []

for path in ROOT.rglob("*"):
    if not path.is_file():
        continue

    if path.suffix not in [".ts", ".tsx"]:
        continue

    if any(x in path.name.lower() for x in [
        ".backup",
        ".bak",
        ".corrupt",
        "_old",
        "corrompido"
    ]):
        continue

    name = path.name.lower()

    if any(word in name for word in [
        "storage",
        "history",
        "progress",
        "mood",
        "habit",
        "objective",
        "rating",
        "journal"
    ]):
        storage_files.append(path)


for path in sorted(storage_files):
    print(f"✓ {path}")

print()
print("=" * 60)
print("FIM DO MAPA")
print("=" * 60)
