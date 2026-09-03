from pathlib import Path

files = [
    Path("src/components/ImpulsoSOS.tsx"),
    Path("src/components/FocoMente.tsx"),
    Path("src/components/StopMode.tsx"),
    Path("src/components/TriageModal.tsx"),
    Path("src/App.tsx"),
]

terms = [
    "intensity",
    "intensidade",
    "initialIntensity",
    "finalIntensity",
    "onAddXp",
    "reactive",
    "analyzeReactiveState",
    "Impulso",
    "SOS",
    "FocoMente",
    "StopMode",
    "Triage",
    "breath",
    "respir",
    "ground",
    "panic",
    "calm",
    "support",
    "mind",
    "energy",
    "need",
    "localStorage",
    "sessionStorage",
    "setCurrentTab",
    "currentTab",
]

print("=" * 80)
print("CONFIA — DIAGNÓSTICO 1C.1 / IMPULSO PREMIUM")
print("=" * 80)

for path in files:
    print()
    print("=" * 80)
    print(path)
    print("=" * 80)

    if not path.exists():
        print("FICHEIRO NÃO ENCONTRADO")
        continue

    lines = path.read_text(encoding="utf-8").splitlines()

    matches = []

    for i, line in enumerate(lines, start=1):
        if any(term.lower() in line.lower() for term in terms):
            matches.append(i)

    ranges = []

    for line_number in matches:
        start = max(1, line_number - 6)
        end = min(len(lines), line_number + 12)

        if ranges and start <= ranges[-1][1] + 1:
            ranges[-1] = (ranges[-1][0], max(ranges[-1][1], end))
        else:
            ranges.append((start, end))

    if not ranges:
        print("Sem correspondências relevantes.")
        continue

    for start, end in ranges:
        print(f"\n--- linhas {start}-{end} ---")
        for n in range(start, end + 1):
            print(f"{n:5}: {lines[n - 1]}")

print()
print("=" * 80)
print("LOCALES — IMPULSO / SOS / APOIO / INTENSIDADE")
print("=" * 80)

locale_terms = [
    "impulse",
    "sos",
    "crisis",
    "calm",
    "support",
    "mind",
    "intensity",
    "breath",
    "ground",
    "panic",
    "focus",
    "stop",
]

for lang in ["pt", "en", "es", "fr"]:
    path = Path(f"src/locales/{lang}.json")

    print()
    print(f"--- {path} ---")

    if not path.exists():
        print("FICHEIRO NÃO ENCONTRADO")
        continue

    lines = path.read_text(encoding="utf-8").splitlines()

    for i, line in enumerate(lines, start=1):
        if any(term.lower() in line.lower() for term in locale_terms):
            print(f"{i:5}: {line}")

print()
print("=" * 80)
print("FIM DO DIAGNÓSTICO 1C.1")
print("=" * 80)
print()
print("Nenhum ficheiro foi alterado.")
