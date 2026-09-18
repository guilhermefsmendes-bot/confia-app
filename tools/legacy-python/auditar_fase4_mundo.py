from pathlib import Path
import re
import sys

# ============================================================
# CONFIA — FASE 4A
# AUDITORIA DO MUNDO / COMPANION
#
# APENAS LEITURA.
#
# Objetivo:
# perceber exatamente o que já existe no HomeWorld e
# quais elementos podem reagir ao utilizador sem criar
# peso adicional.
#
# NÃO ALTERA QUALQUER FICHEIRO.
# ============================================================

ROOT = Path.cwd()

FILES = {
    "app": ROOT / "src/App.tsx",
    "homeworld": ROOT / "src/components/HomeWorld.tsx",
}

for name, path in FILES.items():
    if not path.exists():
        print(f"✗ Em falta: {name}")
        print(f"  {path}")
        sys.exit(1)

texts = {
    name: path.read_text(encoding="utf-8")
    for name, path in FILES.items()
}


def section(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def show_matches(name, patterns, context=4):
    text = texts[name]
    lines = text.splitlines()

    found_any = False

    for pattern in patterns:
        regex = re.compile(pattern, re.I)

        matches = [
            i
            for i, line in enumerate(lines)
            if regex.search(line)
        ]

        if not matches:
            continue

        found_any = True

        print()
        print(f"[{name}] padrão: {pattern}")

        for index in matches[:12]:
            start = max(0, index - context)
            end = min(len(lines), index + context + 1)

            print("-" * 60)

            for pos in range(start, end):
                prefix = ">" if pos == index else " "
                print(
                    f"{prefix} {pos + 1:4}: "
                    f"{lines[pos]}"
                )

    if not found_any:
        print()
        print(f"[{name}] nenhum resultado")


# ============================================================
# 1. RENDER DO HOMEWORLD
# ============================================================

section("1. HOMEWORLD NO APP")

show_matches(
    "app",
    [
        r"<HomeWorld",
        r"avatar=",
        r"objectives=",
        r"ratings=",
        r"weeklyGoal",
        r"homePositions",
        r"on.*Home",
    ],
    context=6,
)


# ============================================================
# 2. PROPS DO HOMEWORLD
# ============================================================

section("2. PROPS DO HOMEWORLD")

show_matches(
    "homeworld",
    [
        r"interface.*Props",
        r"type.*Props",
        r"export default",
        r"function HomeWorld",
        r"const HomeWorld",
        r"\(\{",
    ],
    context=8,
)


# ============================================================
# 3. CAMADAS VISUAIS
# ============================================================

section("3. CAMADAS VISUAIS EXISTENTES")

show_matches(
    "homeworld",
    [
        r"Cloud",
        r"Butterfl",
        r"Sky",
        r"Lighting",
        r"Ground",
        r"Path",
        r"Water",
        r"Vegetation",
        r"Environment",
        r"Depth",
        r"Refuge",
        r"Avatar",
    ],
    context=5,
)


# ============================================================
# 4. NÍVEL / PROGRESSO
# ============================================================

section("4. NÍVEL E PROGRESSO")

show_matches(
    "homeworld",
    [
        r"level",
        r"xp",
        r"progress",
        r"objective",
        r"completed",
        r"streak",
        r"weekly",
    ],
    context=5,
)


# ============================================================
# 5. CONDIÇÕES DE RENDER
# ============================================================

section("5. ELEMENTOS CONDICIONAIS")

show_matches(
    "homeworld",
    [
        r"&&",
        r"\?",
        r">=",
        r"<=",
        r"level ===",
        r"level >",
    ],
    context=3,
)


# ============================================================
# 6. ESTADO INTERNO
# ============================================================

section("6. ESTADO INTERNO")

show_matches(
    "homeworld",
    [
        r"useState",
        r"useEffect",
        r"useMemo",
        r"useCallback",
        r"useRef",
    ],
    context=4,
)


# ============================================================
# 7. ANIMAÇÕES
# ============================================================

section("7. ANIMAÇÕES")

show_matches(
    "homeworld",
    [
        r"motion",
        r"animate",
        r"transition",
        r"requestAnimationFrame",
        r"setInterval",
        r"setTimeout",
        r"animation",
    ],
    context=4,
)


# ============================================================
# 8. LISTENERS
# ============================================================

section("8. LISTENERS")

show_matches(
    "homeworld",
    [
        r"addEventListener",
        r"removeEventListener",
        r"pointer",
        r"mouse",
        r"touch",
        r"resize",
    ],
    context=4,
)


# ============================================================
# 9. STORAGE
# ============================================================

section("9. STORAGE")

show_matches(
    "homeworld",
    [
        r"localStorage",
        r"sessionStorage",
        r"storage",
    ],
    context=4,
)

show_matches(
    "app",
    [
        r"homePositions",
        r"HOME_POSITION",
        r"localStorage.*home",
    ],
    context=5,
)


# ============================================================
# 10. AVATAR / COMPANION
# ============================================================

section("10. AVATAR / COMPANION")

show_matches(
    "homeworld",
    [
        r"avatar",
        r"companion",
        r"name",
        r"badge",
        r"edit",
        r"drag",
    ],
    context=5,
)


# ============================================================
# 11. REFÚGIO
# ============================================================

section("11. REFÚGIO")

show_matches(
    "homeworld",
    [
        r"refuge",
        r"house",
        r"home",
        r"level >= 3",
        r"level >= 2",
        r"level >= 4",
    ],
    context=5,
)


# ============================================================
# 12. POSSÍVEIS SINAIS JÁ DISPONÍVEIS NO APP
# ============================================================

section("12. SINAIS DISPONÍVEIS NO APP")

show_matches(
    "app",
    [
        r"completedObjectivesCount",
        r"objectivesHistory",
        r"ratings",
        r"weeklyGoal",
        r"homeNowMemory",
        r"dailyContext",
        r"activeDays",
        r"impulse",
        r"reactiveMessageKey",
    ],
    context=4,
)


# ============================================================
# 13. CONTAGENS DE PERFORMANCE
# ============================================================

section("13. CONTAGENS DE PERFORMANCE")

for name in ["homeworld", "app"]:
    text = texts[name]

    print()
    print(name.upper())

    tokens = {
        "useState": "useState(",
        "useEffect": "useEffect(",
        "useMemo": "useMemo(",
        "useCallback": "useCallback(",
        "setTimeout": "setTimeout(",
        "setInterval": "setInterval(",
        "requestAnimationFrame": "requestAnimationFrame",
        "addEventListener": "addEventListener(",
        "localStorage.getItem": "localStorage.getItem",
        "localStorage.setItem": "localStorage.setItem",
    }

    for label, token in tokens.items():
        print(
            f"{label:28} "
            f"{text.count(token)}"
        )


# ============================================================
# 14. COMPONENTES IMPORTADOS
# ============================================================

section("14. IMPORTS HOMEWORLD")

for line in texts["homeworld"].splitlines():
    if line.startswith("import "):
        print(line)


# ============================================================
# 15. FIM
# ============================================================

section("FIM DA AUDITORIA")

print()
print("Este script foi APENAS LEITURA.")
print()
print("Não alterou:")
print("- App.tsx")
print("- HomeWorld.tsx")
print("- storage")
print("- traduções")
print("- estado")
print("- animações")
print()
print("Objetivo do próximo passo:")
print()
print(
    "identificar 2 a 4 reações visuais de alto impacto "
    "e custo quase zero, reutilizando dados e componentes "
    "já existentes."
)
print()
