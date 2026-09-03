from pathlib import Path
import json
import re
import sys

# ============================================================
# CONFIA — FASE 3
# 3E.3 — AUDITORIA FINAL DO RITUAL DIÁRIO
#
# APENAS LEITURA.
#
# Valida:
#
# 1. 3A.1 — snapshot diário estável
# 2. 3B   — contexto diário
# 3. 3C.1 — Momento de Hoje
# 4. 3D   — ação inteligente
# 5. 3E.1 — continuidade inteligente
# 6. 3E.2 — linguagem de aprendizagem
#
# E confirma:
#
# - apenas 1 storage específico da Fase 3;
# - nenhum sistema paralelo de aprendizagem diária;
# - nenhuma nova chamada desnecessária ao motor;
# - nenhuma recolha duplicada de memória;
# - ação diária reutiliza homeNowAction;
# - navegação reutiliza handleHomeNowAction;
# - aprendizagem não é confundida com uma experiência isolada;
# - primeiro contacto continua separado;
# - ausência continua sem culpa;
# - PT / EN / ES / FR completos;
# - ausência de timers/listeners permanentes novos;
# - arquitetura leve.
#
# NÃO ALTERA QUALQUER FICHEIRO.
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

FILES = {
    "engine":
        ROOT / "src/data/reactive/reactiveEngine.ts",

    "memory":
        ROOT / "src/data/reactive/reactiveRecentMemory.ts",

    "history":
        ROOT / "src/data/reactive/reactiveHistoryStorage.ts",
}

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}


def title(text):
    print()
    print("=" * 78)
    print(text)
    print("=" * 78)


def ok(text):
    print(f"✓ {text}")


def warn(text):
    print(f"⚠ {text}")


def error(text):
    print(f"✗ {text}")


# ============================================================
# 1. FICHEIROS
# ============================================================

title("1. FICHEIROS")

all_paths = [
    APP,
    *FILES.values(),
    *LOCALES.values(),
]

missing_files = [
    path
    for path in all_paths
    if not path.exists()
]

if missing_files:
    for path in missing_files:
        error(str(path))

    sys.exit(1)

ok("Todos os ficheiros necessários existem")


app = APP.read_text(
    encoding="utf-8"
)

support = {
    name: path.read_text(encoding="utf-8")
    for name, path in FILES.items()
}


# ============================================================
# 2. SUBFASES
# ============================================================

title("2. SUBFASES DA FASE 3")

markers = {
    "3A.1 Snapshot diário":
        "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",

    "3B Contexto diário":
        "CONFIA 3B — CONTEXTO DIÁRIO",

    "3C.1 Momento de Hoje":
        "CONFIA 3C.1 — MOMENTO DE HOJE",

    "3D Ação inteligente":
        "CONFIA 3D — AÇÃO INTELIGENTE DO DIA",

    "3E.1 Continuidade inteligente":
        "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE",

    "3E.2 Linguagem de aprendizagem":
        "CONFIA 3E.2 — LINGUAGEM DE APRENDIZAGEM",
}

phase_ok = True

for label, marker in markers.items():
    count = app.count(marker)

    if count == 1:
        ok(label)
    else:
        error(
            f"{label} — ocorrências: {count}"
        )
        phase_ok = False


# ============================================================
# 3. SNAPSHOT DIÁRIO
# ============================================================

title("3. SNAPSHOT DIÁRIO")

snapshot_checks = {
    "lazy state diário":
        "const [dailyOpenState] = useState(() => {",

    "data atual":
        "appOpenDate",

    "data anterior":
        "previousAppOpenDate",

    "primeira abertura":
        "isFirstAppOpenToday",

    "dias desde abertura":
        "daysSincePreviousAppOpen",

    "storage diário":
        "LAST_APP_OPEN_DATE",
}

for label, marker in snapshot_checks.items():
    if marker in app:
        ok(label)
    else:
        error(label)


if re.search(
    r"useEffect\s*\(\s*\(\)\s*=>\s*\{"
    r"[\s\S]{0,800}"
    r"LAST_APP_OPEN_DATE",
    app,
):
    ok("escrita diária ocorre através de effect")
else:
    warn(
        "não consegui confirmar automaticamente "
        "o effect de LAST_APP_OPEN_DATE"
    )


# ============================================================
# 4. ESTADOS DIÁRIOS
# ============================================================

title("4. ESTADOS DO RITUAL")

states = [
    "first_contact",
    "return_after_absence",
    "first_today",
    "already_here_today",
]

for state in states:
    if state in app:
        ok(state)
    else:
        error(state)


# ============================================================
# 5. HIERARQUIA DE ESTADO
# ============================================================

title("5. HIERARQUIA DO CONTEXTO")

daily_start = app.find(
    "const dailyContext = (() => {"
)

daily_end = app.find(
    "const homeNowContext",
    daily_start,
)

if daily_start == -1 or daily_end == -1:
    error(
        "não foi possível isolar dailyContext"
    )
    daily = ""
else:
    daily = app[
        daily_start:
        daily_end
    ]
    ok("dailyContext isolado")


positions = {
    state: daily.find(
        f'"{state}"'
    )
    for state in states
}

if all(
    value >= 0
    for value in positions.values()
):
    if (
        positions["first_contact"]
        < positions["return_after_absence"]
        < positions["first_today"]
        < positions["already_here_today"]
    ):
        ok(
            "hierarquia first_contact → regresso → "
            "primeira abertura → continuação"
        )
    else:
        warn(
            "ordem textual dos estados merece revisão manual"
        )


# ============================================================
# 6. MEMÓRIA
# ============================================================

title("6. MEMÓRIA REUTILIZADA")

memory_checks = {
    "impulseLearning":
        'memoryKind === "impulseLearning"',

    "impulseMemory":
        'memoryKind === "impulseMemory"',

    "continuity":
        'memoryKind === "continuity"',
}

for label, marker in memory_checks.items():
    if marker in daily:
        ok(label)
    else:
        error(label)


collect_count = app.count(
    "collectReactiveRecentMemory("
)

print()
print(
    "collectReactiveRecentMemory em App.tsx:",
    collect_count
)

if collect_count == 1:
    ok("uma única recolha de memória na Principal")
else:
    warn(
        "contagem diferente de 1; rever manualmente"
    )


# ============================================================
# 7. APRENDIZAGEM
# ============================================================

title("7. NÍVEIS DE APRENDIZAGEM")

learning_levels = [
    "learned_impulse",
    "effective_impulse",
    "repeated_signals",
    "early_learning",
    "none",
]

for level in learning_levels:
    if level in daily:
        ok(level)
    else:
        error(level)


if (
    daily.find("hasImpulseLearning")
    < daily.find("hasImpulseMemory")
    < daily.find("hasContinuityMemory")
):
    ok(
        "aprendizagem forte tem prioridade "
        "sobre experiência isolada e continuidade"
    )
else:
    warn(
        "hierarquia da aprendizagem merece revisão"
    )


# ============================================================
# 8. NÃO EXISTE MEMÓRIA DIÁRIA PARALELA
# ============================================================

title("8. MEMÓRIA DIÁRIA PARALELA")

parallel_tokens = [
    "dailyLearningStorage",
    "daily_action_history",
    "dailyActionHistory",
    "completedDailyAction",
    "lastDailyAction",
    "dailyRitualHistory",
]

found_parallel = False

for token in parallel_tokens:
    count = (
        app
        + support["memory"]
        + support["history"]
    ).count(token)

    if count:
        error(
            f"{token}: {count}"
        )
        found_parallel = True

if not found_parallel:
    ok(
        "nenhum sistema paralelo de memória diária"
    )


# ============================================================
# 9. STORAGE DA FASE 3
# ============================================================

title("9. STORAGE")

storage_key = (
    "confia_last_app_open_date_v1"
)

storage_occurrences = app.count(
    storage_key
)

print(
    "confia_last_app_open_date_v1:",
    storage_occurrences
)

if storage_occurrences == 1:
    ok(
        "uma única declaração da chave diária"
    )
else:
    warn(
        "chave diária aparece um número inesperado de vezes"
    )


if (
    "LAST_APP_OPEN_DATE" in app
    and "localStorage.getItem" in app
    and "localStorage.setItem" in app
):
    ok(
        "leitura/escrita diária presentes"
    )


# ============================================================
# 10. MOTOR REATIVO
# ============================================================

title("10. REACTIVE ENGINE")

engine_calls = app.count(
    "analyzeReactiveState("
)

history_calls = app.count(
    "recordReactiveResponse("
)

print(
    "analyzeReactiveState:",
    engine_calls
)

print(
    "recordReactiveResponse:",
    history_calls
)

if (
    "analyzeReactiveState("
    not in daily
):
    ok(
        "dailyContext não volta a executar o motor"
    )
else:
    error(
        "dailyContext executa Reactive Engine"
    )

if (
    "recordReactiveResponse("
    not in daily
):
    ok(
        "dailyContext não cria histórico próprio"
    )
else:
    error(
        "dailyContext cria histórico próprio"
    )


# ============================================================
# 11. AÇÃO INTELIGENTE
# ============================================================

title("11. AÇÃO INTELIGENTE")

action_checks = {
    "suggestedAction vem de homeNowAction":
        "homeNowAction?.kind ?? null",

    "3D valida suggestedAction":
        "dailyContext.suggestedAction === homeNowAction.kind",

    "CTA reutiliza actionKey":
        "t(homeNowAction.actionKey)",

    "CTA reutiliza handler":
        "onClick={handleHomeNowAction}",
}

for label, marker in action_checks.items():
    if marker in app:
        ok(label)
    else:
        error(label)


handler_uses = app.count(
    "onClick={handleHomeNowAction}"
)

print()
print(
    "CTAs que usam handleHomeNowAction:",
    handler_uses
)

if handler_uses >= 2:
    ok(
        "Momento de Hoje e Para ti agora "
        "partilham navegação"
    )
else:
    warn(
        "esperava pelo menos dois usos do handler"
    )


# ============================================================
# 12. MOMENTO DE HOJE
# ============================================================

title("12. MOMENTO DE HOJE")

moment_start = app.find(
    "CONFIA 3C.1 — MOMENTO DE HOJE"
)

moment_end = app.find(
    '{homeScreen === "home" && (\n  <>',
    moment_start,
)

if (
    moment_start == -1
    or moment_end == -1
):
    error(
        "não foi possível isolar Momento de Hoje"
    )
    moment = ""
else:
    moment = app[
        moment_start:
        moment_end
    ]
    ok(
        "Momento de Hoje isolado"
    )


if (
    'dailyContext.state !== "first_contact"'
    in moment
):
    ok(
        "primeiro contacto não duplica ritual"
    )
else:
    error(
        "proteção first_contact não encontrada"
    )


# ============================================================
# 13. LINGUAGEM 3E.2
# ============================================================

title("13. LINGUAGEM DE APRENDIZAGEM")

language_keys = [
    "learnedImpulse",
    "effectiveImpulse",
    "repeatedSignals",
    "early",
    "neutral",
]

for key in language_keys:
    marker = (
        f'dailyMoment.learning.{key}'
    )

    if marker in moment:
        ok(marker)
    else:
        error(marker)


# ============================================================
# 14. QUATRO IDIOMAS
# ============================================================

title("14. PT / EN / ES / FR")

locale_data = {}

for language, path in LOCALES.items():
    try:
        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )
    except Exception as exc:
        error(
            f"{language}: JSON inválido — {exc}"
        )
        continue

    locale_data[language] = data

    daily_moment = data.get(
        "dailyMoment"
    )

    if not isinstance(
        daily_moment,
        dict
    ):
        error(
            f"{language}: dailyMoment ausente"
        )
        continue

    learning = daily_moment.get(
        "learning"
    )

    if not isinstance(
        learning,
        dict
    ):
        error(
            f"{language}: learning ausente"
        )
        continue

    missing = [
        key
        for key in language_keys
        if not isinstance(
            learning.get(key),
            str
        )
        or not learning[key].strip()
    ]

    if missing:
        error(
            f"{language}: faltam {missing}"
        )
    else:
        ok(
            f"{language}: aprendizagem completa"
        )


# ============================================================
# 15. PARIDADE DE CHAVES
# ============================================================

title("15. PARIDADE DE TRADUÇÕES")

if len(locale_data) == 4:
    sets = {
        language:
            set(
                data
                .get("dailyMoment", {})
                .get("learning", {})
                .keys()
            )
        for language, data
        in locale_data.items()
    }

    base = sets["pt"]

    if all(
        keys == base
        for keys in sets.values()
    ):
        ok(
            "mesmas chaves de aprendizagem "
            "nos quatro idiomas"
        )
    else:
        error(
            "paridade de learning diferente "
            "entre idiomas"
        )


# ============================================================
# 16. TOM EDITORIAL
# ============================================================

title("16. SEGURANÇA EDITORIAL")

for language, data in locale_data.items():
    learning = (
        data
        .get("dailyMoment", {})
        .get("learning", {})
    )

    combined = " ".join(
        str(value).lower()
        for value in learning.values()
    )

    suspicious = [
        "diagnóstico",
        "diagnosis",
        "diagnóstico",
        "diagnostic",
        "cura",
        "cure",
        "curar",
        "guarantee",
        "garantido",
        "garantizado",
        "garanti",
    ]

    found = [
        word
        for word in suspicious
        if word in combined
    ]

    if found:
        warn(
            f"{language}: rever termos {found}"
        )
    else:
        ok(
            f"{language}: sem alegações fortes óbvias"
        )


# ============================================================
# 17. PERFORMANCE
# ============================================================

title("17. PERFORMANCE")

performance_tokens = {
    "useState":
        "useState(",

    "useEffect":
        "useEffect(",

    "localStorage.getItem":
        "localStorage.getItem",

    "localStorage.setItem":
        "localStorage.setItem",

    "setTimeout":
        "setTimeout(",

    "setInterval":
        "setInterval(",

    "requestAnimationFrame":
        "requestAnimationFrame",

    "addEventListener":
        "addEventListener(",
}

for label, token in performance_tokens.items():
    print(
        f"{label:28} {app.count(token)}"
    )


if app.count(
    "setInterval("
) == 0:
    ok(
        "nenhum setInterval em App.tsx"
    )
else:
    warn(
        "setInterval presente em App.tsx"
    )


# ============================================================
# 18. PRINCIPAL PRESERVADA
# ============================================================

title("18. PRINCIPAL VIVO")

principal_markers = [
    "<HomeWorld",
    "reactiveMessageKey",
    "homeNowMemory",
    "homeNowAction",
    "homeNowContext",
    "HomeProgressSummary",
    "showDailyCheckIn",
]

for marker in principal_markers:
    if marker in app:
        ok(marker)
    else:
        error(marker)


# ============================================================
# 19. COMPONENTES PRESERVADOS
# ============================================================

title("19. FUNCIONALIDADES EXISTENTES")

existing = [
    "ObjectivosList",
    "ImpulsoSOS",
    "AbracoTimer",
    "Companion",
    "HomeShop",
]

for marker in existing:
    if marker in app:
        ok(marker)
    else:
        warn(
            f"{marker} não encontrado em App.tsx"
        )


# ============================================================
# 20. RESULTADO
# ============================================================

title("RESULTADO FINAL")

critical_checks = [
    phase_ok,

    all(
        marker in app
        for marker in markers.values()
    ),

    all(
        state in app
        for state in states
    ),

    all(
        level in daily
        for level in learning_levels
    ),

    "analyzeReactiveState("
        not in daily,

    "recordReactiveResponse("
        not in daily,

    "homeNowAction?.kind ?? null"
        in daily,

    "dailyContext.suggestedAction === homeNowAction.kind"
        in app,

    'dailyContext.state !== "first_contact"'
        in moment,

    len(locale_data) == 4,

    all(
        all(
            isinstance(
                data
                .get("dailyMoment", {})
                .get("learning", {})
                .get(key),
                str
            )
            and data[
                "dailyMoment"
            ][
                "learning"
            ][key].strip()
            for key in language_keys
        )
        for data in locale_data.values()
    )
    if len(locale_data) == 4
    else False,
]

if all(critical_checks):
    print()
    print(
        "✓ FASE 3 — RITUAL DIÁRIO estruturalmente coerente"
    )
    print()
    print(
        "A arquitetura final é:"
    )
    print()
    print(
        "ABERTURA"
    )
    print(
        "   ↓"
    )
    print(
        "SNAPSHOT DIÁRIO"
    )
    print(
        "   ↓"
    )
    print(
        "MEMÓRIA EXISTENTE"
    )
    print(
        "   ↓"
    )
    print(
        "CONTEXTO DIÁRIO"
    )
    print(
        "   ↓"
    )
    print(
        "MOMENTO DE HOJE"
    )
    print(
        "   ↓"
    )
    print(
        "AÇÃO INTELIGENTE"
    )
    print(
        "   ↓"
    )
    print(
        "REGISTOS NORMAIS DA CONFIA"
    )
    print(
        "   ↓"
    )
    print(
        "APRENDIZAGEM EXISTENTE"
    )
    print(
        "   ↓"
    )
    print(
        "PRÓXIMO DIA"
    )
else:
    print()
    print(
        "⚠ Existem pontos críticos a rever "
        "antes de fechar a Fase 3."
    )

print()
print("-" * 78)
print()
print(
    "Este script foi APENAS LEITURA."
)
print()
print(
    "Nenhum ficheiro foi alterado."
)
print()
print(
    "Não é necessário executar npm run build "
    "depois desta auditoria."
)
print()
print("=" * 78)
