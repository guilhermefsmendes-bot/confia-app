from pathlib import Path

ROOT = Path("src")

COMPANION = ROOT / "components/Companheiro/ConfiaCompanionHome.tsx"
AVATAR = ROOT / "components/Avatar.tsx"
CREATURE = ROOT / "components/Companheiro/ConfiaCreature.tsx"
APP = ROOT / "App.tsx"
MEMORY = ROOT / "data/reactive/companionRelationalMemory.ts"

print("=" * 76)
print("CONFIA — A9 — DESCOBERTA FINAL DO COMPANHEIRO")
print("=" * 76)

def show(title, path, patterns, context=4):
    print()
    print("-" * 76)
    print(title)
    print("-" * 76)

    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        return

    lines = path.read_text(encoding="utf-8").splitlines()

    found = set()

    for i, line in enumerate(lines):
        for pattern in patterns:
            if pattern in line:
                start = max(0, i - context)
                end = min(len(lines), i + context + 1)

                if (start, end) in found:
                    continue

                found.add((start, end))

                print(f"\n[{path}:{i + 1}]")
                for n in range(start, end):
                    print(f"{n + 1:5}: {lines[n]}")

show(
    "1. HIERARQUIA DA FALA — COMPANION HOME",
    COMPANION,
    [
        "const companionReaction",
        "const companionRelationalMemory",
        "const companionRelationalExpression",
        "const companionRelationalAction",
        "const companionRelationalNextStep",
        "const companionMessage",
        "priority >= 70",
        "priority < 70",
    ],
)

show(
    "2. BOTÃO / AÇÃO CONTEXTUAL",
    COMPANION,
    [
        "onCompanionAction",
        "companionRelationalAction.target",
        "companionRelationalAction.translationKey",
    ],
)

show(
    "3. MEMÓRIA RELACIONAL",
    MEMORY,
    [
        "resolveCompanionRelationalMemory",
        "resolveCompanionRelationalExpression",
        "resolveCompanionRelationalAction",
        "priority",
        "kind:",
    ],
    context=3,
)

show(
    "4. AVATAR — ACESSÓRIOS E REAÇÃO",
    AVATAR,
    [
        "equippedAccessoryIds",
        "reactionState",
        "companionWorldMood",
        "ConfiaCreature",
        "setTimeout",
    ],
    context=3,
)

show(
    "5. CONFIA CREATURE — ACESSÓRIOS",
    CREATURE,
    [
        "equippedAccessoryIds",
        "confia_bow_cream",
        "confia_scarf_terra",
        "confia_charm_gold",
    ],
    context=3,
)

show(
    "6. APP — INTEGRAÇÃO DO COMPANHEIRO",
    APP,
    [
        "homeCompanionRelationalMemory",
        "handleCompanionAction",
        "<ConfiaCompanionHome",
        "equippedAccessoryIds",
    ],
    context=5,
)

print()
print("=" * 76)
print("7. PROCURAR ELEMENTOS POTENCIALMENTE REPETITIVOS")
print("=" * 76)

targets = [
    "avatarMemoryMessage",
    "avatarWelcome",
    "avatarImprovement",
    "avatarHardDay",
    "avatarLowMood",
    "avatarHighMood",
    "avatarStageMessage1",
    "avatarStageMessage5",
    "avatarStageMessage10",
    "companionMessage",
]

for target in targets:
    matches = []

    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except Exception:
            continue

        count = text.count(target)

        if count:
            matches.append((str(path), count))

    if matches:
        print(f"\n{target}:")
        for path, count in matches:
            print(f"  {count:3}x  {path}")

print()
print("=" * 76)
print("8. ELEMENTOS PROIBIDOS / PERFORMANCE")
print("=" * 76)

files_to_check = [
    COMPANION,
    AVATAR,
    CREATURE,
]

patterns = [
    "Math.random",
    "setInterval",
    "requestAnimationFrame",
    "localStorage.setItem",
]

for pattern in patterns:
    total = 0

    for path in files_to_check:
        if path.exists():
            try:
                total += path.read_text(encoding="utf-8").count(pattern)
            except Exception:
                pass

    print(f"{pattern}: {total}")

print()
print("=" * 76)
print("9. ESTADO DO A9")
print("=" * 76)
print()
print("ESTE SCRIPT É APENAS DE LEITURA.")
print("Não altera ficheiros.")
print()
print("Objetivo:")
print("- confirmar a hierarquia final da voz")
print("- encontrar duplicações")
print("- confirmar integração do avatar")
print("- confirmar acessórios")
print("- confirmar ação contextual")
print("- identificar apenas o que ainda merece polimento")
print()
print("=" * 76)
print("FIM DA DESCOBERTA A9")
print("=" * 76)
