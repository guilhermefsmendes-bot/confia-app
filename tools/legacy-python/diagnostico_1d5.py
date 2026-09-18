from pathlib import Path

print("=" * 72)
print("CONFIA — DIAGNÓSTICO 1D.5 — MEMÓRIA CONTEXTUAL")
print("=" * 72)

files = [
    "src/App.tsx",
    "src/components/HomeProgressSummary.tsx",
    "src/data/reactive/reactiveEngine.ts",
    "src/data/reactive/reactiveTypes.ts",
    "src/data/reactive/reactiveRecentMemory.ts",
    "src/data/reactive/reactiveHistoryStorage.ts",
    "src/data/companionData.ts",
    "src/components/Impulso/storage.ts",
]

for file in files:
    path = Path(file)

    print()
    print("=" * 72)
    print(file)
    print("=" * 72)

    if not path.exists():
        print("FICHEIRO NÃO ENCONTRADO")
        continue

    text = path.read_text(encoding="utf-8")

    patterns = [
        "Para ti agora",
        "paraTi",
        "forYou",
        "homeReactive",
        "reactive",
        "recent",
        "memory",
        "collectReactiveRecentMemory",
        "recentEffectiveImpulse",
        "analyzeReactiveState",
        "recordReactiveResponse",
        "loadEpisodes",
        "ImpulseEpisode",
        "HomeProgressSummary",
        "changeTab",
        "setCurrentTab",
        "setHomeScreen",
    ]

    lines = text.splitlines()

    found = False

    for i, line in enumerate(lines):
        if any(pattern.lower() in line.lower() for pattern in patterns):
            start = max(0, i - 3)
            end = min(len(lines), i + 8)

            print(f"\n--- linhas {start + 1}-{end} ---")

            for n in range(start, end):
                print(f"{n + 1}: {lines[n]}")

            found = True

    if not found:
        print("Nenhum bloco relevante encontrado.")

print()
print("=" * 72)
print("FIM DO DIAGNÓSTICO")
print("=" * 72)
print()
print("Nenhum ficheiro foi alterado.")
