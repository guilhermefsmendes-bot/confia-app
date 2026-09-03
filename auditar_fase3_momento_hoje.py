from pathlib import Path
import re

# ============================================================
# CONFIA — FASE 3
# AUDITORIA 3A — MOMENTO DE HOJE
#
# APENAS LEITURA.
#
# Objetivo:
# descobrir o que já existe para construir:
#
# ABRIR
#   ↓
# MEMÓRIA
#   ↓
# CONTEXTO DE HOJE
#   ↓
# MENSAGEM
#   ↓
# UMA AÇÃO
#   ↓
# CONTINUIDADE AMANHÃ
#
# NÃO altera qualquer ficheiro.
# ============================================================

ROOT = Path.cwd()

FILES = {
    "APP": ROOT / "src/App.tsx",
    "ENGINE": ROOT / "src/data/reactive/reactiveEngine.ts",
    "MEMORY": ROOT / "src/data/reactive/reactiveRecentMemory.ts",
    "HISTORY": ROOT / "src/data/reactive/reactiveHistoryStorage.ts",
    "RESPONSES": ROOT / "src/data/reactive/reactiveResponses.ts",
    "INTENT": ROOT / "src/data/reactive/reactiveIntent.ts",
    "INTENT_ENGINE": ROOT / "src/data/reactive/reactiveIntentEngine.ts",
    "TYPES": ROOT / "src/data/reactive/reactiveTypes.ts",
    "CHECKIN": ROOT / "src/storage/dailyCheckInStorage.ts",
}

print()
print("=" * 78)
print("CONFIA — FASE 3 / AUDITORIA 3A")
print("MOMENTO DE HOJE")
print("=" * 78)

# ============================================================
# 1. FICHEIROS
# ============================================================

print()
print("1. FICHEIROS")
print("-" * 78)

texts = {}

for name, path in FILES.items():
    if path.exists():
        text = path.read_text(
            encoding="utf-8"
        )
        texts[name] = text

        print(
            f"✓ {name:<14} "
            f"{path.relative_to(ROOT)} "
            f"({len(text.splitlines())} linhas)"
        )
    else:
        texts[name] = ""
        print(
            f"✗ {name:<14} "
            f"{path.relative_to(ROOT)}"
        )


app = texts["APP"]
engine = texts["ENGINE"]
memory = texts["MEMORY"]
history = texts["HISTORY"]
checkin = texts["CHECKIN"]
types = texts["TYPES"]


# ============================================================
# HELPERS
# ============================================================

def show_matches(
    title,
    text,
    patterns,
    context=2,
    max_matches=20,
):
    print()
    print(title)
    print("-" * 78)

    lines = text.splitlines()
    found = []

    for i, line in enumerate(lines):
        if any(
            re.search(pattern, line, re.I)
            for pattern in patterns
        ):
            found.append(i)

    if not found:
        print("— nada encontrado")
        return

    shown = 0
    used = set()

    for index in found:
        if shown >= max_matches:
            print(
                f"... restantes omitidos "
                f"({len(found) - shown})"
            )
            break

        start = max(0, index - context)
        end = min(
            len(lines),
            index + context + 1
        )

        key = (start, end)

        if key in used:
            continue

        used.add(key)

        print()

        for line_index in range(start, end):
            prefix = (
                ">"
                if line_index == index
                else " "
            )

            print(
                f"{prefix} "
                f"{line_index + 1:5}: "
                f"{lines[line_index]}"
            )

        shown += 1


def count(text, token):
    return text.count(token)


# ============================================================
# 2. PRINCIPAL ATUAL
# ============================================================

show_matches(
    "2. PRINCIPAL — REATIVIDADE / PARA TI AGORA",
    app,
    [
        r"homeNow",
        r"reactiveMessageKey",
        r"isFirstContact",
        r"isEarlyLearning",
        r"HomeProgressSummary",
    ],
    context=3,
    max_matches=35,
)


# ============================================================
# 3. RATINGS / DIA
# ============================================================

show_matches(
    "3. RATINGS — DATAS E REGISTO DIÁRIO",
    app,
    [
        r"ratings",
        r"todayStr",
        r"new Date",
        r"toISOString",
        r"handleSaveRatings",
    ],
    context=2,
    max_matches=30,
)


# ============================================================
# 4. CHECK-IN
# ============================================================

show_matches(
    "4. DAILY CHECK-IN",
    checkin,
    [
        r"date",
        r"created",
        r"timestamp",
        r"need",
        r"mood",
        r"localStorage",
        r"save",
        r"get",
    ],
    context=3,
    max_matches=30,
)


# ============================================================
# 5. MEMÓRIA RECENTE
# ============================================================

show_matches(
    "5. REACTIVE RECENT MEMORY",
    memory,
    [
        r"latestMood",
        r"previousMood",
        r"recentMood",
        r"direction",
        r"checkIn",
        r"impulse",
        r"activeDays",
        r"continuity",
        r"repeated",
    ],
    context=3,
    max_matches=50,
)


# ============================================================
# 6. HISTÓRICO REATIVO
# ============================================================

show_matches(
    "6. HISTÓRICO / COOLDOWN",
    history,
    [
        r"timestamp",
        r"responseId",
        r"situation",
        r"intent",
        r"localStorage",
        r"record",
        r"history",
    ],
    context=3,
    max_matches=35,
)


# ============================================================
# 7. ENGINE
# ============================================================

show_matches(
    "7. REACTIVE ENGINE — CONTEXTO E SELEÇÃO",
    engine,
    [
        r"buildReactiveContext",
        r"analyzeReactiveState",
        r"getMemoryScore",
        r"detectSituation",
        r"source ===",
        r"no_data",
    ],
    context=3,
    max_matches=45,
)


# ============================================================
# 8. FONTES DISPONÍVEIS
# ============================================================

show_matches(
    "8. REACTIVE ACTION SOURCES",
    types,
    [
        r"ReactiveActionSource",
        r"source:",
    ],
    context=5,
    max_matches=12,
)


# ============================================================
# 9. OBJETIVOS
# ============================================================

show_matches(
    "9. OBJETIVOS — HISTÓRICO / COMPLETADOS",
    app,
    [
        r"objectivesHistory",
        r"objectiveCompleted",
        r"handleToggleObjective",
        r"completedCount",
    ],
    context=3,
    max_matches=30,
)


# ============================================================
# 10. IMPULSO
# ============================================================

show_matches(
    "10. IMPULSO — HISTÓRICO / EFICÁCIA",
    memory,
    [
        r"recentImpuls",
        r"effectiveImpulse",
        r"averageReduction",
        r"hasImpulseLearning",
    ],
    context=4,
    max_matches=30,
)


# ============================================================
# 11. AUSÊNCIA / REGRESSO
# ============================================================

show_matches(
    "11. REGRESSO / AUSÊNCIA",
    engine + "\n" + memory,
    [
        r"return_after_absence",
        r"absence",
        r"activeDays",
        r"last.*date",
        r"days",
    ],
    context=3,
    max_matches=30,
)


# ============================================================
# 12. STORAGE ATUAL
# ============================================================

print()
print("12. STORAGE ATUAL")
print("-" * 78)

for name, text in texts.items():
    if not text:
        continue

    get_count = count(
        text,
        "localStorage.getItem"
    )

    set_count = count(
        text,
        "localStorage.setItem"
    )

    remove_count = count(
        text,
        "localStorage.removeItem"
    )

    if (
        get_count
        or set_count
        or remove_count
    ):
        print(
            f"{name:<14} "
            f"get={get_count:<3} "
            f"set={set_count:<3} "
            f"remove={remove_count:<3}"
        )


# ============================================================
# 13. SINAIS DE "PRIMEIRA ABERTURA DO DIA"
# ============================================================

show_matches(
    "13. JÁ EXISTE CONCEITO DE ABERTURA DIÁRIA?",
    app + "\n" + memory + "\n" + history,
    [
        r"first.*day",
        r"today.*open",
        r"daily.*open",
        r"last.*open",
        r"visit",
        r"session",
        r"lastSeen",
        r"lastVisit",
    ],
    context=3,
    max_matches=30,
)


# ============================================================
# 14. POSSÍVEIS DESTINOS
# ============================================================

show_matches(
    "14. DESTINOS DO 'PARA TI AGORA'",
    app,
    [
        r"handleHomeNowAction",
        r'kind: "impulse"',
        r'kind: "patterns"',
        r'kind: "objectives"',
        r'kind: "progress"',
        r'kind: "record"',
        r"setCurrentTab",
        r"setHomeScreen",
    ],
    context=4,
    max_matches=40,
)


# ============================================================
# 15. EFEITOS DA PRINCIPAL
# ============================================================

show_matches(
    "15. USEEFFECTS RELACIONADOS COM A PRINCIPAL",
    app,
    [
        r"useEffect",
        r"currentTab === 0",
        r'homeScreen === "home"',
        r"reactiveMessageKey",
    ],
    context=4,
    max_matches=40,
)


# ============================================================
# 16. CONTAGENS TÉCNICAS
# ============================================================

print()
print("16. CONTAGENS TÉCNICAS")
print("-" * 78)

print(
    "App useState:",
    count(app, "useState")
)

print(
    "App useEffect:",
    count(app, "useEffect")
)

print(
    "App localStorage.setItem:",
    count(app, "localStorage.setItem")
)

print(
    "App setTimeout:",
    count(app, "setTimeout")
)

print(
    "App setInterval:",
    count(app, "setInterval")
)

print(
    "Engine localStorage:",
    count(engine, "localStorage")
)

print(
    "Memory localStorage:",
    count(memory, "localStorage")
)


# ============================================================
# 17. DIAGNÓSTICO AUTOMÁTICO
# ============================================================

print()
print("=" * 78)
print("17. DIAGNÓSTICO")
print("=" * 78)

checks = {
    "Reactive Engine":
        "analyzeReactiveState" in engine,

    "Memória recente":
        "collectReactiveRecentMemory" in memory,

    "Continuidade":
        "continuity" in memory,

    "Mood recente":
        "latestMood" in memory,

    "Check-In recente":
        (
            "checkIn" in memory
            or "CheckIn" in memory
        ),

    "Memória de Impulso":
        "recentEffectiveImpulse" in memory,

    "Dias ativos":
        "activeDays" in memory,

    "Para ti agora":
        "homeNowAction" in app,

    "Primeiro contacto":
        "isFirstContact" in app,

    "Aprendizagem inicial":
        "isEarlyLearning" in app,

    "Histórico reativo":
        (
            "recordReactiveResponse"
            in history
            or "recordReactiveResponse"
            in app
        ),
}

for label, result in checks.items():
    print(
        f"{'✓' if result else '✗'} {label}"
    )


# ============================================================
# 18. QUESTÃO CENTRAL
# ============================================================

has_daily_open_storage = any(
    token in (
        app
        + memory
        + history
    )
    for token in [
        "lastDailyOpen",
        "lastOpenDate",
        "lastVisitDate",
        "todayOpen",
    ]
)

print()
print("=" * 78)
print("CONCLUSÃO AUTOMÁTICA")
print("=" * 78)
print()

if has_daily_open_storage:
    print(
        "⚠ Existe pelo menos um possível mecanismo "
        "de abertura diária."
    )
    print(
        "Precisamos de o auditar antes de criar outro."
    )
else:
    print(
        "✓ Não foi encontrado um mecanismo explícito "
        "de 'primeira abertura do dia'."
    )
    print(
        "Isto NÃO significa automaticamente que "
        "precisamos de novo storage."
    )
    print(
        "Primeiro vamos verificar se os registos "
        "existentes permitem derivar o estado diário."
    )

print()
print(
    "Objetivo da próxima decisão:"
)
print(
    "usar o máximo possível da memória existente e "
    "introduzir apenas o mínimo estado diário realmente necessário."
)

print()
print("=" * 78)
print("FIM DA AUDITORIA 3A — NENHUM FICHEIRO ALTERADO")
print("=" * 78)
