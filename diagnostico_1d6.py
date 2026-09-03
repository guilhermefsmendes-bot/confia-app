from pathlib import Path

print("=" * 72)
print("CONFIA — DIAGNÓSTICO 1D.6 — APRENDIZAGEM PERSONALIZADA")
print("=" * 72)

files = [
    "src/data/reactive/reactiveRecentMemory.ts",
    "src/data/reactive/reactiveEngine.ts",
    "src/data/reactive/reactiveIntent.ts",
    "src/data/reactive/reactiveTypes.ts",
    "src/data/reactive/reactiveHistoryStorage.ts",
    "src/data/companionData.ts",
    "src/components/Impulso/storage.ts",
    "src/components/Impulso/types.ts",
    "src/components/ImpulsoSOS.tsx",
    "src/App.tsx",
]

patterns = [
    "recentEffectiveImpulse",
    "effectiveImpulses",
    "partiallyEffective",
    "reduction",
    "need",
    "impulse",
    "recordReactiveResponse",
    "reactiveHistory",
    "responseId",
    "situation",
    "intent",
    "analyzeReactiveState",
    "homeNowMemory",
    "homeNowAction",
    "memory",
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

    lines = path.read_text(encoding="utf-8").splitlines()

    found_ranges = []
    seen = set()

    for i, line in enumerate(lines):
        lower = line.lower()

        if any(pattern.lower() in lower for pattern in patterns):
            start = max(0, i - 3)
            end = min(len(lines), i + 9)

            key = (start, end)

            if key in seen:
                continue

            seen.add(key)
            found_ranges.append((start, end))

    if not found_ranges:
        print("Nenhum bloco relevante encontrado.")
        continue

    for start, end in found_ranges:
        print()
        print(f"--- linhas {start + 1}-{end} ---")

        for n in range(start, end):
            print(f"{n + 1}: {lines[n]}")

print()
print("=" * 72)
print("FIM DO DIAGNÓSTICO")
print("=" * 72)
print()
print("Nenhum ficheiro foi alterado.")
