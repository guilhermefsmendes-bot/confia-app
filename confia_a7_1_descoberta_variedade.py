from pathlib import Path


FILES = [
    Path("src/data/reactive/companionRelationalMemory.ts"),
    Path("src/components/Companheiro/ConfiaCompanionHome.tsx"),
    Path("src/data/reactive/companionReactionEngine.ts"),
    Path("src/data/reactive/reactiveTypes.ts"),
]


def show_matches(path: Path, terms, context=8):
    print()
    print("=" * 78)
    print(path)
    print("=" * 78)

    if not path.exists():
        print("NÃO ENCONTRADO")
        return

    lines = path.read_text(
        encoding="utf-8"
    ).splitlines()

    indexes = []

    for i, line in enumerate(lines):
        if any(term in line for term in terms):
            indexes.append(i)

    if not indexes:
        print("SEM CORRESPONDÊNCIAS")
        return

    ranges = []

    for i in indexes:
        start = max(0, i - context)
        end = min(len(lines), i + context + 1)

        if ranges and start <= ranges[-1][1] + 2:
            ranges[-1] = (
                ranges[-1][0],
                max(ranges[-1][1], end)
            )
        else:
            ranges.append((start, end))

    for start, end in ranges:
        print()
        print(
            f"--- linhas {start + 1}-{end} ---"
        )

        for i in range(start, end):
            print(
                f"{i + 1:4}: {lines[i]}"
            )


print("=" * 78)
print("CONFIA — A7.1 — DESCOBERTA VARIEDADE RELACIONAL")
print("=" * 78)


show_matches(
    FILES[0],
    [
        "CompanionRelationalMemoryKind",
        "CompanionRelationalMemoryStrength",
        "CompanionRelationalMemoryResult",
        "translationKey",
        "priority:",
        "strength:",
        "values:",
        "return candidates[0]",
    ],
    context=10,
)


show_matches(
    FILES[1],
    [
        "companionRelationalMemory",
        "canUseRelationalMemory",
        "companionMessage",
        "translationKey",
        "avatar.level",
        "companionReaction",
        "currentMoodRating",
    ],
    context=12,
)


show_matches(
    FILES[2],
    [
        "CompanionReactionKind",
        "CompanionReaction",
        "sourceSituation",
        "priority:",
        "visualIntensity",
        "confidence",
    ],
    context=8,
)


show_matches(
    FILES[3],
    [
        "ReactiveSituation",
        "ReactiveResult",
        "ReactiveIntent",
        "translationKey",
        "confidence",
    ],
    context=10,
)


print()
print("=" * 78)
print("TRADUÇÕES RELACIONAIS ATUAIS")
print("=" * 78)

for lang in ("pt", "en", "es", "fr"):
    path = Path(
        f"src/locales/{lang}.json"
    )

    print()
    print(f"--- {lang} ---")

    if not path.exists():
        print("NÃO ENCONTRADO")
        continue

    lines = path.read_text(
        encoding="utf-8"
    ).splitlines()

    found = False

    for i, line in enumerate(lines):
        if '"companionRelationalMemory"' in line:
            found = True

            start = i
            end = min(
                len(lines),
                i + 35
            )

            for j in range(start, end):
                print(
                    f"{j + 1:4}: {lines[j]}"
                )

            break

    if not found:
        print("BLOCO NÃO ENCONTRADO")


print()
print("=" * 78)
print("FIM DA DESCOBERTA A7.1")
print("=" * 78)
print()
print("APENAS LEITURA.")
print()
print("Não altera:")
print("- Reactive Engine")
print("- memória")
print("- histórico")
print("- localStorage")
print("- traduções")
print("- companheiro")
print("- timers")
print("- XP")
