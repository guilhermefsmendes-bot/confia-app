from pathlib import Path
import re

ROOT = Path("src")

FILES = {
    "APP": ROOT / "App.tsx",
    "COMPANION": ROOT / "components/Companheiro/ConfiaCompanionHome.tsx",
    "REACTIVE_ENGINE": ROOT / "data/reactive/reactiveEngine.ts",
    "RELATIONAL_MEMORY": ROOT / "data/reactive/companionRelationalMemory.ts",
}

print("=" * 76)
print("CONFIA — A8.1 — DESCOBERTA DA INICIATIVA")
print("=" * 76)


def read(path):
    if not path.exists():
        print(f"\nERRO: ficheiro não encontrado: {path}")
        return ""
    return path.read_text(encoding="utf-8")


files = {name: read(path) for name, path in FILES.items()}


# ==============================================================
# 1. DESTINOS / ECRÃS EXISTENTES
# ==============================================================

print("\n" + "=" * 76)
print("1. DESTINOS EXISTENTES NO APP")
print("=" * 76)

app = files["APP"]

patterns = [
    r'"home"',
    r'"companion"',
    r'"patterns"',
    r'"shop"',
    r'"inventory"',
    r'"settings"',
    r'"progress"',
    r'"impulse"',
    r'"hug"',
    r'"objectives"',
]

found = set()

for pattern in patterns:
    if re.search(pattern, app):
        found.add(pattern)

for item in sorted(found):
    print(f"✓ encontrado: {item}")


# ==============================================================
# 2. NAVEGAÇÃO REAL
# ==============================================================

print("\n" + "=" * 76)
print("2. NAVEGAÇÃO / HOME SCREEN")
print("=" * 76)

for i, line in enumerate(app.splitlines(), 1):
    if (
        "setHomeScreen" in line
        or "setCurrentTab" in line
        or "homeScreen ===" in line
        or 'homeScreen =' in line
    ):
        print(f"{i}: {line.rstrip()}")


# ==============================================================
# 3. FUNCIONALIDADES QUE PODEM RECEBER UMA INICIATIVA
# ==============================================================

print("\n" + "=" * 76)
print("3. POSSÍVEIS AÇÕES REAIS")
print("=" * 76)

action_patterns = [
    "setTriageOpen",
    "setShowDailyCheckIn",
    "setShowStopMode",
    "setLevelUpOpen",
    "setHomeScreen",
    "handlePetAvatar",
    "Impulso",
    "Impulse",
    "Abraço",
    "Hug",
    "Patterns",
    "Padrões",
    "Objetivos",
    "Objectives",
    "Progress",
    "Progresso",
    "Breathing",
    "respiration",
    "Respiração",
]

for name, text in files.items():
    print(f"\n--- {name} ---")

    lines = text.splitlines()

    for i, line in enumerate(lines, 1):
        if any(pattern.lower() in line.lower() for pattern in action_patterns):
            print(f"{i}: {line.rstrip()}")


# ==============================================================
# 4. REACTIVE ENGINE — RESULTADO REAL
# ==============================================================

print("\n" + "=" * 76)
print("4. RESULTADO DO REACTIVE ENGINE")
print("=" * 76)

engine = files["REACTIVE_ENGINE"]

for i, line in enumerate(engine.splitlines(), 1):
    if any(
        x in line
        for x in [
            "priority",
            "translationKey",
            "kind",
            "strength",
            "confidence",
            "evidence",
            "response",
        ]
    ):
        print(f"{i}: {line.rstrip()}")


# ==============================================================
# 5. MEMÓRIA RELACIONAL — TIPOS DE MEMÓRIA
# ==============================================================

print("\n" + "=" * 76)
print("5. MEMÓRIA RELACIONAL A6/A7")
print("=" * 76)

relational = files["RELATIONAL_MEMORY"]

for i, line in enumerate(relational.splitlines(), 1):
    if any(
        x in line
        for x in [
            "kind",
            "translationKey",
            "priority",
            "strength",
            "hasImpulseLearning",
            "recentEffectiveImpulse",
            "hasRepeatedSignals",
            "moodDirection",
            "activeDaysLast7",
            "continuity",
        ]
    ):
        print(f"{i}: {line.rstrip()}")


# ==============================================================
# 6. COMPANION HOME — LOCAL ONDE A8 DEVE ENTRAR
# ==============================================================

print("\n" + "=" * 76)
print("6. COMPANION HOME — DECISÃO ATUAL")
print("=" * 76)

companion = files["COMPANION"]

lines = companion.splitlines()

for i, line in enumerate(lines, 1):
    if any(
        x in line
        for x in [
            "companionReaction",
            "companionRelational",
            "companionMessage",
            "reactionState",
            "reactionIntensity",
            "bubbleClass",
            "return (",
        ]
    ):
        print(f"{i}: {line.rstrip()}")


# ==============================================================
# 7. BOTÕES / AÇÕES EXISTENTES NA COMPANION HOME
# ==============================================================

print("\n" + "=" * 76)
print("7. AÇÕES JÁ DISPONÍVEIS NA COMPANION HOME")
print("=" * 76)

for i, line in enumerate(lines, 1):
    if any(
        x in line.lower()
        for x in [
            "button",
            "onclick",
            "onClick",
            "sethomescreen",
            "handlepetavatar",
        ]
    ):
        print(f"{i}: {line.rstrip()}")


# ==============================================================
# 8. TRADUÇÕES / POSSÍVEIS CTAs
# ==============================================================

print("\n" + "=" * 76)
print("8. POSSÍVEIS TEXTOS DE AÇÃO")
print("=" * 76)

locale_dir = ROOT / "locales"

if locale_dir.exists():
    for path in sorted(locale_dir.glob("*.json")):
        text = read(path)

        print(f"\n--- {path.name} ---")

        for i, line in enumerate(text.splitlines(), 1):
            lower = line.lower()

            if any(
                word in lower
                for word in [
                    "ver ",
                    "começar",
                    "fazer",
                    "experimentar",
                    "pausa",
                    "respirar",
                    "impulso",
                    "padrões",
                    "objetivos",
                    "abraço",
                    "check",
                    "pause",
                    "breathe",
                    "patterns",
                    "goals",
                    "hug",
                ]
            ):
                print(f"{i}: {line.rstrip()}")


# ==============================================================
# 9. STORAGE — GARANTIR QUE A8 NÃO PRECISA DE NOVA MEMÓRIA
# ==============================================================

print("\n" + "=" * 76)
print("9. STORAGE RELACIONADO")
print("=" * 76)

storage_dir = ROOT / "storage"

if storage_dir.exists():
    for path in sorted(storage_dir.glob("*.ts")):
        text = read(path)

        if any(
            x in text
            for x in [
                "reactive",
                "history",
                "rating",
                "impulse",
                "objective",
                "avatar",
            ]
        ):
            print(f"✓ {path}")


# ==============================================================
# 10. PROIBIDOS PARA A8
# ==============================================================

print("\n" + "=" * 76)
print("10. VERIFICAÇÃO DE PADRÕES PROIBIDOS")
print("=" * 76)

all_text = "\n".join(files.values())

checks = {
    "Math.random": r"Math\.random\(",
    "setInterval": r"setInterval\(",
    "requestAnimationFrame": r"requestAnimationFrame\(",
    "novo localStorage neste script": r"localStorage\.setItem",
}

for name, pattern in checks.items():
    count = len(re.findall(pattern, all_text))

    if count == 0:
        print(f"✓ {name}: 0")
    else:
        print(f"INFO: {name}: {count}")


# ==============================================================
# FIM
# ==============================================================

print("\n" + "=" * 76)
print("FIM DA DESCOBERTA A8.1")
print("=" * 76)
print()
print("IMPORTANTE:")
print()
print("Este script é APENAS LEITURA.")
print()
print("Não altera:")
print("- App.tsx")
print("- ConfiaCompanionHome.tsx")
print("- reactiveEngine")
print("- memória relacional")
print("- traduções")
print("- localStorage")
print("- navegação")
print()
print("Objetivo:")
print("descobrir exatamente quais ações reais a CONFIA")
print("pode sugerir antes de implementar a iniciativa A8.")
print("=" * 76)
