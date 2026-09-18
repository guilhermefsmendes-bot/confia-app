from pathlib import Path
import re

# ============================================================
# CONFIA — FASE 3E.1
# AUDITORIA DA APRENDIZAGEM E CONTINUIDADE DIÁRIA
#
# APENAS LEITURA.
#
# Objetivo:
# perceber exatamente que memória já existe para permitir:
#
# HOJE
#   ação sugerida
#        ↓
#   utilizador age
#        ↓
#   registo existente
#        ↓
# AMANHÃ
#   contexto diário mais relevante
#
# NÃO ALTERA QUALQUER FICHEIRO.
# ============================================================

ROOT = Path.cwd()

FILES = {
    "app": ROOT / "src/App.tsx",
    "engine": ROOT / "src/data/reactive/reactiveEngine.ts",
    "memory": ROOT / "src/data/reactive/reactiveRecentMemory.ts",
    "history": ROOT / "src/data/reactive/reactiveHistoryStorage.ts",
    "intent": ROOT / "src/data/reactive/reactiveIntent.ts",
    "intent_engine": ROOT / "src/data/reactive/reactiveIntentEngine.ts",
    "signals": ROOT / "src/data/reactive/reactiveSignals.ts",
    "checkin": ROOT / "src/storage/dailyCheckInStorage.ts",
}

for name, path in FILES.items():
    if not path.exists():
        print(f"✗ Em falta: {name}")
        print(f"  {path}")
        raise SystemExit(1)

texts = {
    name: path.read_text(encoding="utf-8")
    for name, path in FILES.items()
}


def section(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def show_matches(name, patterns, context=3):
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

        for index in matches[:8]:
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
# 1. FASE 3 ATUAL
# ============================================================

section("1. ARQUITETURA ATUAL DA FASE 3")

show_matches(
    "app",
    [
        r"CONFIA 3A",
        r"dailyOpenState",
        r"isFirstAppOpenToday",
        r"CONFIA 3B",
        r"dailyContext",
        r"CONFIA 3C",
        r"CONFIA 3D",
        r"suggestedAction",
        r"handleHomeNowAction",
    ],
    context=4,
)


# ============================================================
# 2. COMO A AÇÃO DIÁRIA É ESCOLHIDA
# ============================================================

section("2. ORIGEM DA AÇÃO SUGERIDA")

show_matches(
    "app",
    [
        r"const homeNowAction",
        r"analyzeReactiveState",
        r"intent",
        r"kind:",
        r"titleKey",
        r"actionKey",
    ],
    context=5,
)


# ============================================================
# 3. NAVEGAÇÃO DA AÇÃO
# ============================================================

section("3. EXECUÇÃO DE handleHomeNowAction")

show_matches(
    "app",
    [
        r"const handleHomeNowAction",
        r"homeNowAction\.kind",
        r"case ",
        r"setCurrentTab",
        r"setHomeScreen",
        r"scrollIntoView",
    ],
    context=7,
)


# ============================================================
# 4. MEMÓRIA DE HUMOR
# ============================================================

section("4. MEMÓRIA — HUMOR / RATINGS")

show_matches(
    "app",
    [
        r"setRatings",
        r"RATINGS",
        r"morningRating",
        r"afternoonRating",
        r"handle.*Rating",
        r"save.*Rating",
    ],
    context=5,
)

show_matches(
    "memory",
    [
        r"mood",
        r"rating",
        r"recentMood",
        r"direction",
        r"average",
    ],
    context=4,
)


# ============================================================
# 5. MEMÓRIA DE CHECK-IN
# ============================================================

section("5. MEMÓRIA — DAILY CHECK-IN")

show_matches(
    "checkin",
    [
        r"localStorage",
        r"need",
        r"mood",
        r"save",
        r"history",
        r"date",
    ],
    context=5,
)

show_matches(
    "memory",
    [
        r"check.?in",
        r"repeated",
        r"need",
    ],
    context=5,
)


# ============================================================
# 6. MEMÓRIA DO IMPULSO
# ============================================================

section("6. MEMÓRIA — IMPULSO")

show_matches(
    "app",
    [
        r"LAST_IMPULSE",
        r"IMPULSE_COUNT",
        r"onImpulse",
        r"handleImpulse",
    ],
    context=5,
)

show_matches(
    "memory",
    [
        r"impulse",
        r"effective",
        r"reduction",
        r"before",
        r"after",
    ],
    context=5,
)

show_matches(
    "engine",
    [
        r"effective_impulse",
        r"impulse_effective",
        r"impulse_partially",
        r"impulse_not",
        r"initialIntensity",
        r"finalIntensity",
    ],
    context=5,
)


# ============================================================
# 7. MEMÓRIA DE OBJETIVOS
# ============================================================

section("7. MEMÓRIA — OBJETIVOS")

show_matches(
    "app",
    [
        r"OBJECTIVES_HISTORY",
        r"objectivesHistory",
        r"objectiveCompleted",
        r"handle.*Objective",
        r"toggle.*Objective",
    ],
    context=6,
)

show_matches(
    "engine",
    [
        r"objective",
        r"validObjectiveRecords",
        r"objectivesCompleted",
        r"objectiveCompletionRate",
    ],
    context=5,
)


# ============================================================
# 8. HISTÓRICO REATIVO
# ============================================================

section("8. HISTÓRICO REATIVO")

show_matches(
    "history",
    [
        r"localStorage",
        r"record",
        r"history",
        r"response",
        r"timestamp",
        r"intent",
        r"situation",
    ],
    context=5,
)

show_matches(
    "app",
    [
        r"recordReactiveResponse",
        r"reactiveMessageKey",
    ],
    context=5,
)


# ============================================================
# 9. MEMÓRIA RECENTE QUE O MOTOR JÁ CONSOME
# ============================================================

section("9. collectReactiveRecentMemory")

show_matches(
    "memory",
    [
        r"export.*collectReactiveRecentMemory",
        r"return \{",
        r"activeDays",
        r"recentReactive",
        r"recentEffective",
        r"repeated",
        r"moodDirection",
    ],
    context=7,
)


# ============================================================
# 10. SCORING / SELEÇÃO
# ============================================================

section("10. SCORING E PRIORIDADE")

show_matches(
    "engine",
    [
        r"memoryScore",
        r"cooldown",
        r"useCount",
        r"priority",
        r"eligible",
        r"sort",
    ],
    context=6,
)


# ============================================================
# 11. INTENÇÕES
# ============================================================

section("11. INTENÇÕES REATIVAS")

show_matches(
    "intent",
    [
        r"export",
        r"type",
        r"intent",
        r"consisten",
        r"return",
        r"progress",
    ],
    context=5,
)

show_matches(
    "intent_engine",
    [
        r"intent",
        r"situation",
        r"return",
        r"objective",
        r"impulse",
        r"mood",
    ],
    context=5,
)


# ============================================================
# 12. STORAGE NOVO DA FASE 3
# ============================================================

section("12. STORAGE ESPECÍFICO DA FASE 3")

show_matches(
    "app",
    [
        r"LAST_APP_OPEN_DATE",
        r"confia_last_app_open_date",
        r"localStorage\.getItem",
        r"localStorage\.setItem",
    ],
    context=3,
)


# ============================================================
# 13. CONTAGENS GERAIS
# ============================================================

section("13. CONTAGENS — App.tsx")

app = texts["app"]

tokens = {
    "useState": "useState(",
    "useEffect": "useEffect(",
    "localStorage.getItem": "localStorage.getItem",
    "localStorage.setItem": "localStorage.setItem",
    "localStorage.removeItem": "localStorage.removeItem",
    "analyzeReactiveState": "analyzeReactiveState(",
    "recordReactiveResponse": "recordReactiveResponse(",
    "collectReactiveRecentMemory": "collectReactiveRecentMemory(",
    "setTimeout": "setTimeout(",
    "setInterval": "setInterval(",
    "requestAnimationFrame": "requestAnimationFrame",
}

for label, token in tokens.items():
    print(
        f"{label:30} "
        f"{app.count(token)}"
    )


# ============================================================
# 14. SINAIS DE POSSÍVEL DUPLICAÇÃO
# ============================================================

section("14. POSSÍVEL MEMÓRIA DIÁRIA JÁ EXISTENTE")

all_text = "\n".join(
    texts.values()
)

patterns = [
    "daily_action",
    "dailyAction",
    "suggested_action",
    "suggestedAction",
    "completed_action",
    "completedAction",
    "daily_learning",
    "dailyLearning",
    "ritual",
    "last_action",
    "lastAction",
]

for token in patterns:
    count = all_text.count(token)

    print(
        f"{token:24} {count}"
    )


# ============================================================
# FIM
# ============================================================

section("FIM DA AUDITORIA")

print()
print("IMPORTANTE:")
print()
print("Este script foi APENAS LEITURA.")
print()
print("Não alterou:")
print("- App.tsx")
print("- Reactive Engine")
print("- memória recente")
print("- histórico")
print("- storage")
print("- traduções")
print("- UI")
print()
print("Objetivo da próxima decisão:")
print()
print(
    "descobrir se a 3E precisa realmente de "
    "guardar algo novo ou se a CONFIA já possui "
    "memória suficiente para aprender com hoje."
)
print()
