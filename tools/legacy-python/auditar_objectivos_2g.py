from pathlib import Path
import re

ROOT = Path.cwd()

FILES = {
    "APP": ROOT / "src/App.tsx",
    "OBJECTIVES": ROOT / "src/components/ObjectivosList.tsx",
    "TYPES": ROOT / "src/types.ts",
}

print("=" * 78)
print("CONFIA — OBJETIVOS PREMIUM 2G — AUDITORIA")
print("=" * 78)


def section(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def show_around(text, pattern, before=1200, after=3500):
    match = re.search(
        pattern,
        text,
        flags=re.IGNORECASE
    )

    if not match:
        print("NÃO ENCONTRADO")
        return

    start = max(
        0,
        match.start() - before
    )

    end = min(
        len(text),
        match.end() + after
    )

    print(text[start:end])


contents = {}

for name, path in FILES.items():
    if not path.exists():
        print()
        print(f"ERRO: {path} não existe.")
        raise SystemExit(1)

    contents[name] = path.read_text(
        encoding="utf-8"
    )


app = contents["APP"]
objectives = contents["OBJECTIVES"]
types = contents["TYPES"]


# ============================================================
# 1. HANDLER DE CONCLUSÃO
# ============================================================

section("1. HANDLE TOGGLE OBJECTIVE")

show_around(
    app,
    r"const handleToggleObjective",
    before=300,
    after=6500,
)


# ============================================================
# 2. ESTADOS RELACIONADOS COM CELEBRAÇÃO
# ============================================================

section("2. ESTADOS / CELEBRAÇÃO / XP NO APP")

patterns = [
    r"useState.*celebr",
    r"useState.*reward",
    r"useState.*xp",
    r"useState.*objective",
    r"showCelebr",
    r"celebration",
    r"reward",
]

found_any = False

for pattern in patterns:
    matches = list(
        re.finditer(
            pattern,
            app,
            flags=re.IGNORECASE
        )
    )

    if matches:
        found_any = True

        print()
        print(f"--- {pattern} ---")

        for match in matches[:10]:
            start = max(
                0,
                match.start() - 250
            )
            end = min(
                len(app),
                match.end() + 500
            )
            print(app[start:end])
            print()


if not found_any:
    print(
        "Nenhum estado óbvio de celebração "
        "encontrado no App.tsx."
    )


# ============================================================
# 3. PROPS DE OBJECTIVOSLIST
# ============================================================

section("3. PROPS DE OBJECTIVOSLIST")

show_around(
    objectives,
    r"interface.*Props|type.*Props",
    before=200,
    after=3500,
)


# ============================================================
# 4. FEATURED OBJECTIVE
# ============================================================

section("4. OBJETIVO EM DESTAQUE")

show_around(
    objectives,
    r"featuredObjective",
    before=1000,
    after=6500,
)


# ============================================================
# 5. SMALL WINS
# ============================================================

section("5. PEQUENAS VITÓRIAS")

show_around(
    objectives,
    r"smallWins|small wins|pequenas|completedCount",
    before=800,
    after=6500,
)


# ============================================================
# 6. BOTÕES DE CONCLUSÃO
# ============================================================

section("6. BOTÕES / onToggle")

matches = list(
    re.finditer(
        r"onToggle",
        objectives
    )
)

if not matches:
    print("Nenhum onToggle encontrado.")
else:
    for index, match in enumerate(
        matches[:12],
        start=1
    ):
        print()
        print(f"--- ocorrência {index} ---")

        start = max(
            0,
            match.start() - 900
        )

        end = min(
            len(objectives),
            match.end() + 1800
        )

        print(
            objectives[start:end]
        )


# ============================================================
# 7. XP VISUAL
# ============================================================

section("7. XP VISUAL NOS OBJETIVOS")

matches = list(
    re.finditer(
        r"xpReward|earnedXp|\bXP\b",
        objectives,
        flags=re.IGNORECASE
    )
)

if not matches:
    print("Nenhuma referência XP encontrada.")
else:
    for index, match in enumerate(
        matches[:15],
        start=1
    ):
        print()
        print(f"--- ocorrência {index} ---")

        start = max(
            0,
            match.start() - 500
        )

        end = min(
            len(objectives),
            match.end() + 1000
        )

        print(
            objectives[start:end]
        )


# ============================================================
# 8. ANIMAÇÕES EXISTENTES
# ============================================================

section("8. ANIMAÇÕES / TRANSIÇÕES EXISTENTES")

animation_terms = [
    "animate-",
    "transition-",
    "duration-",
    "@keyframes",
    "motion",
    "framer",
    "confetti",
]

for term in animation_terms:
    count = (
        objectives.lower().count(
            term.lower()
        )
        +
        app.lower().count(
            term.lower()
        )
    )

    print(
        f"{term:<16} -> {count}"
    )


# ============================================================
# 9. OBJECTIVE TYPE
# ============================================================

section("9. OBJECTIVE TYPE")

show_around(
    types,
    r"interface Objective",
    before=200,
    after=1800,
)


# ============================================================
# 10. IMPORTS OBJECTIVOSLIST
# ============================================================

section("10. IMPORTS OBJECTIVOSLIST")

lines = objectives.splitlines()

for line in lines[:80]:
    print(line)


# ============================================================
# 11. IMPORTS APP
# ============================================================

section("11. IMPORTS APP — ÍCONES / COMPONENTES")

for line in app.splitlines()[:180]:
    if (
        "lucide" in line.lower()
        or "ObjectivosList" in line
        or "reactive" in line.lower()
    ):
        print(line)


# ============================================================
# 12. CHECKS AUTOMÁTICOS
# ============================================================

section("12. CHECKS AUTOMÁTICOS")

checks = [
    (
        "XP atribuído ao concluir",
        "addXp(obj.xpReward)"
        in app,
    ),
    (
        "XP retirado parcialmente ao desfazer",
        "Math.round(obj.xpReward / 2)"
        in app,
    ),
    (
        "Resposta reativa Objective existe",
        "objectiveReactiveResult"
        in app,
    ),
    (
        "Resposta entra no histórico",
        "objectiveReactiveResult.response.id"
        in app
        and "recordReactiveResponse({"
        in app,
    ),
    (
        "featuredObjective existe",
        "featuredObjective"
        in objectives,
    ),
    (
        "completedCount existe",
        "completedCount"
        in objectives,
    ),
    (
        "earnedXp existe",
        "earnedXp"
        in objectives,
    ),
    (
        "xpReward existe no tipo Objective",
        "xpReward: number"
        in types,
    ),
    (
        "onToggle é recebido pelo componente",
        "onToggle"
        in objectives,
    ),
]

for label, ok in checks:
    print(
        f"{'✓' if ok else '✗'} {label}"
    )


# ============================================================
# 13. CONTAGENS TÉCNICAS
# ============================================================

section("13. CONTAGENS TÉCNICAS")

print(
    "App useState:",
    app.count("useState")
)

print(
    "ObjectivosList useState:",
    objectives.count("useState")
)

print(
    "App setTimeout:",
    app.count("setTimeout")
)

print(
    "ObjectivosList setTimeout:",
    objectives.count("setTimeout")
)

print(
    "App localStorage.setItem:",
    app.count("localStorage.setItem")
)

print(
    "ObjectivosList localStorage.setItem:",
    objectives.count("localStorage.setItem")
)


# ============================================================
# FINAL
# ============================================================

print()
print("=" * 78)
print("AUDITORIA 2G TERMINADA — APENAS LEITURA")
print("=" * 78)
print()
print("Nenhum ficheiro foi alterado.")
print()
print(
    "Objetivo da próxima alteração:"
)
print(
    "conclusão → recompensa XP → reação CONFIA "
    "→ microcelebração visual curta."
)
print()
