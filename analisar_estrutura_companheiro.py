from pathlib import Path

files = [
    "src/storage/dailyCheckInStorage.ts",
    "src/components/Impulso/storage.ts",
    "src/components/Patterns/storage.ts",
    "src/storage/weeklyTrophies.ts",
    "src/data/refugeProgress.ts",
    "src/types.ts",
]

print("=" * 70)
print("CONFIA — ANÁLISE DA ESTRUTURA REAL DOS DADOS")
print("=" * 70)

for filename in files:

    path = Path(filename)

    print()
    print("=" * 70)
    print(f"📁 {filename}")
    print("=" * 70)

    if not path.exists():
        print("⚠ FICHEIRO NÃO ENCONTRADO")
        continue

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except Exception as e:
        print(f"⚠ Erro ao ler: {e}")
        continue

    print(f"Total de linhas: {len(lines)}")
    print()

    # Mostrar o ficheiro completo quando é relativamente pequeno
    if len(lines) <= 220:
        for number, line in enumerate(lines, 1):
            print(f"{number:4}: {line}")
    else:
        # Para ficheiros maiores, mostrar as partes mais relevantes
        keywords = [
            "localStorage",
            "interface",
            "type ",
            "export",
            "function",
            "const ",
            "save",
            "load",
            "get",
            "set",
            "history",
            "mood",
            "morning",
            "afternoon",
            "objective",
            "habit",
            "intervention",
            "xp",
            "XP",
        ]

        relevant = set()

        for i, line in enumerate(lines):
            lower = line.lower()

            if any(keyword.lower() in lower for keyword in keywords):
                for j in range(max(0, i - 2), min(len(lines), i + 4)):
                    relevant.add(j)

        for number in sorted(relevant):
            print(f"{number + 1:4}: {lines[number]}")

print()
print("=" * 70)
print("FIM DA ANÁLISE")
print("=" * 70)

