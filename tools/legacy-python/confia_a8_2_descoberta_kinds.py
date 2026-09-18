from pathlib import Path
import re

ROOT = Path("src")

FILES = [
    ROOT / "data/reactive/companionRelationalMemory.ts",
    ROOT / "data/reactive/companionReactionEngine.ts",
    ROOT / "components/Companheiro/ConfiaCompanionHome.tsx",
]

print("=" * 76)
print("CONFIA — A8.2 — DESCOBERTA DOS KINDS REAIS")
print("=" * 76)

for path in FILES:
    print()
    print("-" * 76)
    print(path)
    print("-" * 76)

    if not path.exists():
        print("ERRO: ficheiro não encontrado")
        continue

    src = path.read_text(encoding="utf-8")

    # Strings que possam representar kinds.
    quoted = sorted(
        set(
            re.findall(
                r"""["']([A-Za-z][A-Za-z0-9_-]{2,60})["']""",
                src,
            )
        )
    )

    interesting = [
        value
        for value in quoted
        if any(
            token in value.lower()
            for token in [
                "impulse",
                "mood",
                "signal",
                "continu",
                "check",
                "effective",
                "learn",
                "repeat",
                "support",
                "pattern",
                "progress",
                "stable",
                "declin",
                "improv",
            ]
        )
    ]

    print("Possíveis kinds relacionados:")
    for value in interesting:
        print(f"  - {value}")

    print()
    print("Linhas contendo 'kind':")

    for number, line in enumerate(src.splitlines(), 1):
        if "kind" in line.lower():
            print(f"{number}: {line}")

print()
print("=" * 76)
print("FIM DA DESCOBERTA A8.2")
print("=" * 76)
print()
print("ESTE SCRIPT FOI APENAS DE LEITURA.")
print("Não alterou nenhum ficheiro.")
print("=" * 76)
