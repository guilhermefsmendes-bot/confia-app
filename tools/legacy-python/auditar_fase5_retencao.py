from pathlib import Path
import re
import sys

# ============================================================
# CONFIA — FASE 5A
# AUDITORIA DE RETENÇÃO / RAZÃO PARA VOLTAR
#
# APENAS LEITURA.
#
# Objetivo:
# identificar tudo o que já existe relacionado com:
# - abertura diária
# - continuidade
# - evolução visível
# - recompensas
# - curiosidade
# - metas
# - XP
# - companion
# - mundo
# - memória
# - mensagens diárias
# - notificações
#
# NÃO ALTERA FICHEIROS.
# ============================================================

ROOT = Path.cwd()

FILES = {
    "app": ROOT / "src/App.tsx",
    "avatar": ROOT / "src/components/Avatar.tsx",
    "homeworld": ROOT / "src/components/HomeWorld.tsx",
    "objectives": ROOT / "src/components/ObjectivosList.tsx",
    "weekly": ROOT / "src/components/WeeklyGoalSection.tsx",
    "reactive_memory": ROOT / "src/data/reactive/reactiveRecentMemory.ts",
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

        for index in matches[:14]:
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
# 1. ABERTURA DIÁRIA
# ============================================================

section("1. ABERTURA DIÁRIA")

show_matches(
    "app",
    [
        r"LAST_APP_OPEN_DATE",
        r"isFirstAppOpenToday",
        r"previousAppOpenDate",
        r"daysSincePreviousAppOpen",
        r"dailyOpenState",
        r"first_today",
        r"already_here_today",
        r"return_after_absence",
    ],
    context=5,
)


# ============================================================
# 2. MOMENTO DE HOJE
# ============================================================

section("2. MOMENTO DE HOJE")

show_matches(
    "app",
    [
        r"dailyMoment",
        r"dailyLearningLevel",
        r"dailyContext",
        r"actionHint",
        r"Momento de Hoje",
        r"CONFIA 3",
    ],
    context=5,
)


# ============================================================
# 3. CONTINUIDADE / MEMÓRIA
# ============================================================

section("3. CONTINUIDADE E MEMÓRIA")

show_matches(
    "reactive_memory",
    [
        r"activeDays",
        r"continuity",
        r"repeated",
        r"recent",
        r"effective",
        r"need",
        r"mood",
        r"impulse",
    ],
    context=4,
)

show_matches(
    "app",
    [
        r"homeNowMemory",
        r"continuity",
        r"impulseLearning",
        r"effectiveImpulse",
        r"repeatedSignals",
        r"isEarlyLearning",
    ],
    context=4,
)


# ============================================================
# 4. XP / PROGRESSO
# ============================================================

section("4. XP E PROGRESSO")

show_matches(
    "app",
    [
        r"avatar\.xp",
        r"setAvatar",
        r"\+\s*30",
        r"\+\s*15",
        r"points",
        r"level",
        r"xp",
    ],
    context=4,
)

show_matches(
    "avatar",
    [
        r"level",
        r"stage",
        r"levelUp",
        r"celebrat",
        r"Sparkles",
    ],
    context=4,
)

show_matches(
    "homeworld",
    [
        r"getRefugeLevel",
        r"refugeLevel",
        r"PremiumEnvironment",
        r"PremiumWater",
        r"growth",
        r"troph",
    ],
    context=4,
)


# ============================================================
# 5. OBJETIVOS / PEQUENAS VITÓRIAS
# ============================================================

section("5. OBJETIVOS E PEQUENAS VITÓRIAS")

show_matches(
    "objectives",
    [
        r"featured",
        r"small",
        r"victor",
        r"progress",
        r"xp",
        r"celebrat",
        r"completed",
    ],
    context=5,
)

show_matches(
    "weekly",
    [
        r"completedDays",
        r"medal",
        r"weekly",
        r"progress",
        r"reward",
        r"credit",
        r"recovery",
    ],
    context=5,
)


# ============================================================
# 6. COMPANION / MUNDO
# ============================================================

section("6. COMPANION E MUNDO")

show_matches(
    "avatar",
    [
        r"memoryMessage",
        r"avatarMessages",
        r"affirmation",
        r"bubble",
        r"companionWorldMood",
        r"companionStatus",
        r"stage",
    ],
    context=4,
)

show_matches(
    "homeworld",
    [
        r"worldMood",
        r"companionWorldMood",
        r"PremiumRefuge",
        r"PremiumEnvironment",
        r"equipped",
        r"growth",
    ],
    context=4,
)


# ============================================================
# 7. RECOMPENSAS VISÍVEIS
# ============================================================

section("7. RECOMPENSAS VISÍVEIS")

for name in [
    "app",
    "avatar",
    "homeworld",
    "objectives",
    "weekly",
]:
    show_matches(
        name,
        [
            r"reward",
            r"medal",
            r"trophy",
            r"badge",
            r"unlock",
            r"celebrat",
            r"xp",
        ],
        context=3,
    )


# ============================================================
# 8. CURIOSIDADE / CONTEÚDO NOVO
# ============================================================

section("8. CURIOSIDADE E CONTEÚDO NOVO")

show_matches(
    "app",
    [
        r"today",
        r"tomorrow",
        r"new",
        r"daily",
        r"continue",
        r"return",
        r"learning",
        r"moment",
    ],
    context=3,
)


# ============================================================
# 9. NOTIFICAÇÕES
# ============================================================

section("9. NOTIFICAÇÕES")

for name, text in texts.items():
    tokens = [
        "notification",
        "Notification",
        "LocalNotifications",
        "push",
        "PushNotifications",
        "schedule",
        "reminder",
    ]

    hits = []

    for token in tokens:
        if token in text:
            hits.append(token)

    if hits:
        print()
        print(name.upper())
        for hit in hits:
            print(f"✓ {hit}")
    else:
        print()
        print(f"{name.upper()}: nenhuma referência")


# ============================================================
# 10. STORAGE DE RETENÇÃO
# ============================================================

section("10. STORAGE RELACIONADO COM RETENÇÃO")

show_matches(
    "app",
    [
        r"STORAGE_KEYS",
        r"LAST_APP_OPEN_DATE",
        r"PET_COUNT",
        r"LAST_PET_DATE",
        r"IMPULSE_COUNT",
        r"OBJECTIVES_HISTORY",
        r"weekly_goal",
    ],
    context=3,
)


# ============================================================
# 11. MECANISMOS QUE PODEM CRIAR CULPA
# ============================================================

section("11. RISCO DE STREAK / CULPA")

for name in [
    "app",
    "objectives",
    "weekly",
    "avatar",
]:
    show_matches(
        name,
        [
            r"streak",
            r"missed",
            r"lost",
            r"failure",
            r"failed",
            r"consecutive",
            r"days in a row",
            r"dias seguidos",
            r"perdeste",
        ],
        context=3,
    )


# ============================================================
# 12. CONTAGENS DE PERFORMANCE
# ============================================================

section("12. PERFORMANCE")

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

for name in [
    "app",
    "avatar",
    "homeworld",
    "objectives",
    "weekly",
]:
    text = texts[name]

    print()
    print(name.upper())

    for label, token in tokens.items():
        print(
            f"{label:28} "
            f"{text.count(token)}"
        )


# ============================================================
# 13. RESUMO AUTOMÁTICO
# ============================================================

section("13. RESUMO AUTOMÁTICO")

signals = {
    "abertura_diaria":
        "LAST_APP_OPEN_DATE" in texts["app"],

    "momento_hoje":
        "dailyMoment" in texts["app"],

    "memoria":
        "collectReactiveRecentMemory"
        in texts["app"],

    "world_mood":
        "worldMood"
        in texts["app"]
        and "worldMood"
        in texts["homeworld"],

    "companion_status":
        "companionWorldMood"
        in texts["avatar"],

    "xp":
        "avatar.xp"
        in texts["app"],

    "objetivos":
        "completed"
        in texts["objectives"],

    "weekly_goal":
        "completedDays"
        in texts["weekly"],

    "recompensa_visual":
        (
            "medal" in texts["weekly"].lower()
            or "trophy" in texts["homeworld"].lower()
        ),
}

for key, value in signals.items():
    print(
        f"{'✓' if value else '✗'} "
        f"{key}"
    )


# ============================================================
# 14. FIM
# ============================================================

section("FIM DA AUDITORIA")

print()
print("Este script foi APENAS LEITURA.")
print()
print("Não alterou:")
print("- App.tsx")
print("- Avatar.tsx")
print("- HomeWorld.tsx")
print("- Objetivos")
print("- Meta semanal")
print("- memória")
print("- storage")
print("- traduções")
print()
print("Objetivo da próxima etapa:")
print()
print(
    "descobrir qual é o menor mecanismo possível "
    "capaz de criar uma razão real para regressar amanhã, "
    "sem streak agressiva e sem criar um segundo sistema."
)
print()
