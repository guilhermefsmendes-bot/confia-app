from pathlib import Path

COMPANION = Path("src/components/Companheiro/ConfiaCompanionHome.tsx")
MEMORY = Path("src/data/reactive/companionRelationalMemory.ts")
AVATAR = Path("src/components/Avatar.tsx")

print("=" * 76)
print("CONFIA — A9.1 — COERÊNCIA FINAL DO COMPANHEIRO")
print("=" * 76)

def inspect(path, title, patterns, context=3):
    print()
    print("-" * 76)
    print(title)
    print("-" * 76)

    if not path.exists():
        print(f"ERRO: {path} não existe")
        return

    lines = path.read_text(encoding="utf-8").splitlines()
    shown = set()

    for i, line in enumerate(lines):
        for pattern in patterns:
            if pattern in line:
                start = max(0, i - context)
                end = min(len(lines), i + context + 1)

                key = (start, end)

                if key in shown:
                    continue

                shown.add(key)

                print(f"\n[{path}:{i + 1}]")
                for n in range(start, end):
                    print(f"{n + 1:5}: {lines[n]}")

inspect(
    COMPANION,
    "1. DECISÃO CENTRAL",
    [
        "companionReaction",
        "companionRelationalMemory",
        "companionRelationalExpression",
        "companionRelationalAction",
        "companionRelationalNextStep",
        "companionMessage",
        "reactionState",
        "reactionIntensity",
    ],
    4,
)

inspect(
    COMPANION,
    "2. EXPRESSÃO DO AVATAR",
    [
        "reactionState={",
        "reactionIntensity",
        "companionWorldMood",
        "memoryMessage",
        "moodRating",
    ],
    4,
)

inspect(
    COMPANION,
    "3. AÇÃO CONTEXTUAL",
    [
        "onCompanionAction",
        "companionRelationalAction.target",
        "companionRelationalAction.translationKey",
    ],
    4,
)

inspect(
    MEMORY,
    "4. RESOLVER RELACIONAL",
    [
        "resolveCompanionRelationalMemory",
        "resolveCompanionRelationalExpression",
        "resolveCompanionRelationalAction",
        "return {",
        "kind:",
        "priority:",
        "visualIntensity:",
    ],
    3,
)

inspect(
    AVATAR,
    "5. REAÇÃO INTERNA DO AVATAR",
    [
        "reactionState",
        "companionWorldMood",
        "moodRating",
        "levelUpTrigger",
        "equippedAccessoryIds",
    ],
    3,
)

print()
print("=" * 76)
print("6. CONTAGENS DE FONTES DE DECISÃO")
print("=" * 76)

text = COMPANION.read_text(encoding="utf-8")

checks = [
    "resolveCompanionReaction(",
    "resolveCompanionRelationalMemory(",
    "resolveCompanionRelationalExpression(",
    "resolveCompanionRelationalAction(",
    "companionMessage",
    "reactionState",
    "reactionIntensity",
    "companionRelationalAction",
]

for item in checks:
    print(f"{item}: {text.count(item)}")

print()
print("=" * 76)
print("7. PROIBIDOS")
print("=" * 76)

for pattern in [
    "Math.random",
    "setTimeout",
    "setInterval",
    "requestAnimationFrame",
    "localStorage.setItem",
]:
    count = 0

    for path in [COMPANION, MEMORY, AVATAR]:
        if path.exists():
            count += path.read_text(encoding="utf-8").count(pattern)

    print(f"{pattern}: {count}")

print()
print("=" * 76)
print("8. CONCLUSÃO")
print("=" * 76)
print()
print("ESTE SCRIPT É APENAS DE LEITURA.")
print("Não altera nenhum ficheiro.")
print()
print("Objetivo:")
print("confirmar se A6 + A7 + A8 já formam uma única")
print("cadeia de decisão antes da implementação final A9.")
print()
print("=" * 76)
print("FIM DA DESCOBERTA A9.1")
print("=" * 76)
