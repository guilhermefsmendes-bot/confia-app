from pathlib import Path

files = [
    Path("src/App.tsx"),
    Path("src/components/PartilhaFeed.tsx"),
    Path("src/components/CommunityChat.tsx"),
]

terms = [
    "currentTab",
    "setCurrentTab",
    "PartilhaFeed",
    "CommunityChat",
    "community",
    "Community",
    "comunidade",
    "Comunidade",
    "progress",
    "Progress",
    "progresso",
    "Progresso",
    "Impulso",
    "impulso",
    "ChartNoAxesCombined",
    "Zap",
]

print("=" * 78)
print("CONFIA — DIAGNÓSTICO NAVEGAÇÃO / COMUNIDADE / PROGRESSO")
print("=" * 78)

for path in files:
    print()
    print("=" * 78)
    print(path)
    print("=" * 78)

    if not path.exists():
        print("FICHEIRO NÃO ENCONTRADO")
        continue

    lines = path.read_text(encoding="utf-8").splitlines()

    matches = []

    for i, line in enumerate(lines, start=1):
        if any(term in line for term in terms):
            matches.append(i)

    # Agrupar linhas próximas para não imprimir o mesmo bloco várias vezes.
    ranges = []

    for line_number in matches:
        start = max(1, line_number - 5)
        end = min(len(lines), line_number + 8)

        if ranges and start <= ranges[-1][1] + 1:
            ranges[-1] = (ranges[-1][0], max(ranges[-1][1], end))
        else:
            ranges.append((start, end))

    for start, end in ranges:
        print(f"\n--- linhas {start}-{end} ---")

        for n in range(start, end + 1):
            print(f"{n:5}: {lines[n - 1]}")

print()
print("=" * 78)
print("LOCALES — CHAVES RELACIONADAS")
print("=" * 78)

locale_terms = [
    '"community"',
    '"Community"',
    '"comunidade"',
    '"Comunidade"',
    '"progress"',
    '"progresso"',
    '"impulse"',
    '"impulso"',
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
        if any(term in line for term in locale_terms):
            print(f"{i:5}: {line}")

print()
print("=" * 78)
print("FIM DO DIAGNÓSTICO")
print("=" * 78)
print()
print("Nenhum ficheiro foi alterado.")
