from pathlib import Path


FILES = [
    Path("src/components/ConfiaCompanionHome.tsx"),
    Path("src/components/Avatar.tsx"),
    Path("src/data/reactive/companionReactionEngine.ts"),
    Path("src/App.tsx"),
]


def show_file(path: Path):
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

    if path.name == "App.tsx":

        terms = [
            "ConfiaCompanionHome",
            "homeReactiveResult",
            "homeNowMemory",
            "companionReaction",
        ]

        indexes = []

        for i, line in enumerate(lines):
            if any(
                term in line
                for term in terms
            ):
                indexes.append(i)

        ranges = []

        for i in indexes:
            start = max(0, i - 12)
            end = min(
                len(lines),
                i + 20
            )

            if (
                ranges
                and start <= ranges[-1][1] + 2
            ):
                ranges[-1] = (
                    ranges[-1][0],
                    max(
                        ranges[-1][1],
                        end
                    )
                )
            else:
                ranges.append(
                    (start, end)
                )

        for start, end in ranges:

            print()
            print(
                f"--- linhas "
                f"{start + 1}-{end} ---"
            )

            for i in range(start, end):
                print(
                    f"{i + 1:4}: "
                    f"{lines[i]}"
                )

    else:

        for number, line in enumerate(
            lines,
            1
        ):
            print(
                f"{number:4}: {line}"
            )


print("=" * 78)
print("CONFIA — A6.3 — DESCOBERTA DA FALA RELACIONAL")
print("=" * 78)

for file in FILES:
    show_file(file)

print()
print("=" * 78)
print("FIM DA DESCOBERTA A6.3")
print("=" * 78)
print()
print("APENAS LEITURA.")
print("Nenhum ficheiro foi alterado.")
