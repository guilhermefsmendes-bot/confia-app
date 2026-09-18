from pathlib import Path
import json
import re
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2H
# Auditoria final
#
# APENAS LEITURA
#
# Verifica:
# - 2B identidade/progresso
# - 2C objetivo em destaque
# - 2D pequenas vitórias
# - 2E caminho semanal
# - 2F inteligência reativa
# - 2G recompensa/microcelebração
# - PT / EN / ES / FR
# - storage / dependências / timers
# ============================================================

ROOT = Path.cwd()

FILES = {
    "app": ROOT / "src/App.tsx",
    "objectives": ROOT / "src/components/ObjectivosList.tsx",
    "weekly": ROOT / "src/components/WeeklyGoalSection.tsx",
    "engine": ROOT / "src/data/reactive/reactiveEngine.ts",
    "intents": ROOT / "src/data/reactive/reactiveIntentEngine.ts",
    "responses": ROOT / "src/data/reactive/reactiveResponses.ts",
    "types": ROOT / "src/data/reactive/reactiveTypes.ts",
}

LOCALES = {
    lang: ROOT / f"src/locales/{lang}.json"
    for lang in ("pt", "en", "es", "fr")
}


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — AUDITORIA 2H")
    print("=" * 78)
    print(message)
    sys.exit(1)


def result(label, ok):
    print(
        f"{'✓' if ok else '✗'} {label}"
    )
    return ok


# ============================================================
# 1. CARREGAR
# ============================================================

for name, path in {
    **FILES,
    **{
        f"locale_{lang}": path
        for lang, path in LOCALES.items()
    }
}.items():
    if not path.exists():
        fail(
            f"Ficheiro em falta: {path}"
        )

texts = {
    name: path.read_text(encoding="utf-8")
    for name, path in FILES.items()
}

locales = {}

for lang, path in LOCALES.items():
    try:
        locales[lang] = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(
            f"{lang}.json inválido: {exc}"
        )


app = texts["app"]
objectives = texts["objectives"]
weekly = texts["weekly"]
engine = texts["engine"]
intents = texts["intents"]
responses = texts["responses"]
types = texts["types"]


print("=" * 78)
print("CONFIA — OBJETIVOS PREMIUM 2H — AUDITORIA FINAL")
print("=" * 78)


all_ok = True


# ============================================================
# 2. 2B — O TEU CAMINHO
# ============================================================

print()
print("2B — O TEU CAMINHO")
print("-" * 78)

checks = [
    (
        "Cabeçalho premium",
        't("objectivesPremium.eyebrow")'
        in objectives
    ),
    (
        "Título premium",
        't("objectivesPremium.title")'
        in objectives
    ),
    (
        "Progresso percentual real",
        "completionPercentage"
        in objectives
    ),
    (
        "Contagem concluídos/total",
        "completedCount"
        in objectives
    ),
    (
        "XP ganho calculado",
        "earnedXp"
        in objectives
    ),
    (
        "Barra de progresso animada",
        'width: `${completionPercentage}%`'
        in objectives
    ),
]

for label, ok in checks:
    all_ok &= result(label, ok)


# ============================================================
# 3. 2C — OBJETIVO EM DESTAQUE
# ============================================================

print()
print("2C — OBJETIVO EM DESTAQUE")
print("-" * 78)

checks = [
    (
        "Primeiro objetivo pendente é protagonista",
        "objectives.find(objective => !objective.completed)"
        in objectives
    ),
    (
        "Featured tem categoria",
        "featuredCategory"
        in objectives
    ),
    (
        "Featured mostra XP",
        "+{featuredObjective.xpReward} XP"
        in objectives
    ),
    (
        "Featured pode ser concluído",
        "handleObjectiveToggle(featuredObjective)"
        in objectives
    ),
    (
        "Estado todos concluídos",
        "allObjectivesCompleted"
        in objectives
    ),
    (
        "Estado sem objetivos",
        't("objectivesPremium.noObjectives")'
        in objectives
    ),
]

for label, ok in checks:
    all_ok &= result(label, ok)


# ============================================================
# 4. 2D — PEQUENAS VITÓRIAS
# ============================================================

print()
print("2D — PEQUENAS VITÓRIAS")
print("-" * 78)

checks = [
    (
        "Lista secundária derivada",
        "remainingObjectives"
        in objectives
    ),
    (
        "AnimatePresence",
        "<AnimatePresence"
        in objectives
    ),
    (
        "Layout animado",
        "<motion.div"
        in objectives
        and "layout"
        in objectives
    ),
    (
        "Estado concluído visual",
        't("objectivesPremium.completedLabel")'
        in objectives
    ),
    (
        "Reversão continua disponível",
        't("objectivesPremium.markPending")'
        in objectives
    ),
    (
        "Objetivos custom continuam removíveis",
        "onDeleteObjective(objective.id)"
        in objectives
    ),
]

for label, ok in checks:
    all_ok &= result(label, ok)


# ============================================================
# 5. 2E — CAMINHO SEMANAL
# ============================================================

print()
print("2E — CAMINHO SEMANAL")
print("-" * 78)

weekly_checks = [
    (
        "completedDays preservado",
        "completedDays"
        in weekly
    ),
    (
        "dailyCredits preservado",
        "dailyCredits"
        in weekly
    ),
    (
        "dailyRatings preservado",
        "dailyRatings"
        in weekly
    ),
    (
        "Medalha semanal preservada",
        "medalUnlocked"
        in weekly
    ),
    (
        "Motion presente",
        "motion"
        in weekly.lower()
    ),
    (
        "Traduções premium semanais usadas",
        "weeklyGoalPremium"
        in weekly
    ),
]

for label, ok in weekly_checks:
    all_ok &= result(label, ok)


# ============================================================
# 6. 2F — CONFIA REAGE
# ============================================================

print()
print("2F — CONFIA REAGE AO PROGRESSO")
print("-" * 78)

reactive_checks = [
    (
        "source objective existe",
        'input.source === "objective"'
        in engine
    ),
    (
        "Conclusão atual explícita",
        "input.objectiveCompleted === true"
        in engine
    ),
    (
        "objective_completed",
        '"objective_completed"'
        in engine
    ),
    (
        "Melhoria histórica",
        '"objectives_improving"'
        in engine
    ),
    (
        "Declínio histórico",
        '"objectives_declining"'
        in engine
    ),
    (
        "Consistência histórica",
        '"objectives_consistent"'
        in engine
    ),
    (
        "Registos inválidos ignorados",
        "item.total > 0"
        in engine
    ),
    (
        "Comparação exige 2 dias recentes",
        "metrics.objectiveValidDays >= 2"
        in engine
    ),
    (
        "Comparação exige 2 dias anteriores",
        "metrics.previousObjectiveValidDays >= 2"
        in engine
    ),
    (
        "Threshold melhoria 15pp",
        "change >= 0.15"
        in engine
    ),
    (
        "Threshold declínio 15pp",
        "change <= -0.15"
        in engine
    ),
    (
        "Consistência exige 60%",
        "recentRate >= 0.60"
        in engine
        and "previousRate >= 0.60"
        in engine
    ),
    (
        "Objective isolado de fallback genérico",
        "objectiveHistoricalDetection"
        in engine
    ),
    (
        "Sem dados -> no_data",
        'situation: "no_data" as const'
        in engine
    ),
    (
        "Intent de conclusão/melhoria",
        'id: "objective_success"'
        in intents
    ),
    (
        "Intent de declínio",
        'id: "objective_difficulty"'
        in intents
    ),
    (
        "Intent de consistência",
        'id: "objective_consistency"'
        in intents
    ),
    (
        "Resposta objective_completed",
        '"objective_completed_01"'
        in responses
    ),
    (
        "Resposta improving",
        '"objectives_improving_01"'
        in responses
    ),
    (
        "Resposta declining",
        '"objectives_declining_01"'
        in responses
    ),
    (
        "Resposta consistent",
        '"objectives_consistent_01"'
        in responses
    ),
]

for label, ok in reactive_checks:
    all_ok &= result(label, ok)


# ============================================================
# 7. APP — FLUXO REATIVO REAL
# ============================================================

print()
print("2F — INTEGRAÇÃO NO APP")
print("-" * 78)

app_checks = [
    (
        "XP real continua no App",
        "addXp(obj.xpReward)"
        in app
    ),
    (
        "Reactive Engine chamado na conclusão",
        "objectiveCompleted: true"
        in app
    ),
    (
        "Mensagem reativa guardada",
        "objectiveReactiveResult.response.translationKey"
        in app
    ),
    (
        "Resposta explícita registada",
        "objectiveReactiveResult.response.id"
        in app
        and "recordReactiveResponse({"
        in app
    ),
    (
        "Leitura passiva ao entrar",
        'if (currentTab !== 1) return;'
        in app
    ),
    (
        "no_data fica silencioso",
        'objectiveReactiveResult.situation === "no_data"'
        in app
    ),
    (
        "UI reativa existe em Objetivos",
        "currentTab === 1 && reactiveMessageKey"
        in app
    ),
]

for label, ok in app_checks:
    all_ok &= result(label, ok)


# ============================================================
# 8. 2G — MICROCELEBRAÇÃO
# ============================================================

print()
print("2G — RECOMPENSA E MICROCELEBRAÇÃO")
print("-" * 78)

celebration_checks = [
    (
        "Estado transitório",
        "objectiveCelebration"
        in objectives
    ),
    (
        "Handler visual central",
        "handleObjectiveToggle"
        in objectives
    ),
    (
        "Só celebra conclusão",
        "const isCompleting = !objective.completed"
        in objectives
    ),
    (
        "XP visual vem do objective",
        "xp: objective.xpReward"
        in objectives
    ),
    (
        "Microcelebração desaparece",
        "1600"
        in objectives
        and "setTimeout"
        in objectives
    ),
    (
        "Featured usa microcelebração",
        "handleObjectiveToggle(featuredObjective)"
        in objectives
    ),
    (
        "Small wins usam microcelebração",
        "handleObjectiveToggle(objective)"
        in objectives
    ),
    (
        "XP acumulado reage visualmente",
        "key={earnedXp}"
        in objectives
    ),
    (
        "Feedback acessível",
        'aria-live="polite"'
        in objectives
    ),
]

for label, ok in celebration_checks:
    all_ok &= result(label, ok)


# ============================================================
# 9. GARANTIAS DE ARQUITETURA
# ============================================================

print()
print("ARQUITETURA / PERFORMANCE")
print("-" * 78)

architecture_checks = [
    (
        "ObjectivosList não escreve localStorage",
        "localStorage.setItem"
        not in objectives
    ),
    (
        "ObjectivosList não chama Reactive Engine",
        "analyzeReactiveState"
        not in objectives
    ),
    (
        "ObjectivosList não atribui XP real",
        "addXp("
        not in objectives
    ),
    (
        "ObjectivosList não altera avatar",
        "setAvatar("
        not in objectives
    ),
    (
        "Motion reutilizado",
        "from 'motion/react'"
        in objectives
    ),
    (
        "Sem confetti",
        "confetti"
        not in objectives.lower()
    ),
]

for label, ok in architecture_checks:
    all_ok &= result(label, ok)


# ============================================================
# 10. TRADUÇÕES
# ============================================================

print()
print("PT / EN / ES / FR")
print("-" * 78)


def has_path(data, dotted_path):
    current = data

    for part in dotted_path.split("."):
        if (
            not isinstance(current, dict)
            or part not in current
        ):
            return False

        current = current[part]

    return (
        isinstance(current, str)
        and bool(current.strip())
    )


required_translation_paths = [
    "objectivesPremium.eyebrow",
    "objectivesPremium.title",
    "objectivesPremium.subtitle",
    "objectivesPremium.today",
    "objectivesPremium.todayProgress",
    "objectivesPremium.actionCategory",
    "objectivesPremium.nextStepHint",
    "objectivesPremium.completeStep",
    "objectivesPremium.allDone",
    "objectivesPremium.allDoneHint",
    "objectivesPremium.noObjectives",
    "objectivesPremium.smallWinsEyebrow",
    "objectivesPremium.smallWins",
    "objectivesPremium.markPending",
    "objectivesPremium.markCompleted",
    "objectivesPremium.completedLabel",
]

for lang in ("pt", "en", "es", "fr"):
    missing = [
        key
        for key in required_translation_paths
        if not has_path(
            locales[lang],
            key
        )
    ]

    ok = len(missing) == 0

    all_ok &= result(
        f"{lang.upper()} — objectivesPremium completo",
        ok
    )

    if missing:
        for key in missing:
            print(
                f"    falta: {key}"
            )


# ============================================================
# 11. WEEKLY TRANSLATIONS
# ============================================================

print()
print("TRADUÇÕES — CAMINHO SEMANAL")
print("-" * 78)

for lang in ("pt", "en", "es", "fr"):
    weekly_exists = (
        isinstance(
            locales[lang].get(
                "weeklyGoalPremium"
            ),
            dict
        )
        and len(
            locales[lang]["weeklyGoalPremium"]
        ) > 0
    )

    all_ok &= result(
        f"{lang.upper()} — weeklyGoalPremium existe",
        weekly_exists
    )


# ============================================================
# 12. TEXTO VISÍVEL POTENCIALMENTE HARDCODED
# ============================================================

print()
print("TEXTO VISÍVEL — VERIFICAÇÃO INDICATIVA")
print("-" * 78)

#
# Não é um parser JSX completo.
# Serve para chamar atenção para texto novo
# potencialmente hardcoded.
#

suspicious = []

for line_number, line in enumerate(
    objectives.splitlines(),
    start=1
):
    stripped = line.strip()

    if (
        stripped
        and
        re.search(r">\s*[A-Za-zÀ-ÿ]{3,}", stripped)
        and
        "t(" not in stripped
        and
        "XP" not in stripped
    ):
        suspicious.append(
            (line_number, stripped)
        )

if suspicious:
    print(
        "⚠ Linhas para inspeção manual "
        "(podem ser falsos positivos):"
    )

    for number, line in suspicious[:15]:
        print(
            f"  {number}: {line}"
        )
else:
    print(
        "✓ Nenhum texto JSX óbvio "
        "hardcoded encontrado"
    )


# ============================================================
# 13. CONTAGENS
# ============================================================

print()
print("CONTAGENS TÉCNICAS")
print("-" * 78)

print(
    "App useState:",
    app.count("useState")
)

print(
    "ObjectivosList useState:",
    objectives.count("useState")
)

print(
    "ObjectivosList setTimeout:",
    objectives.count("setTimeout")
)

print(
    "ObjectivosList localStorage.setItem:",
    objectives.count("localStorage.setItem")
)

print(
    "ObjectivosList motion.:",
    objectives.count("motion.")
)


# ============================================================
# 14. RESULTADO FINAL
# ============================================================

print()
print("=" * 78)

if all_ok:
    print(
        "✓ NÚCLEO DOS OBJETIVOS PREMIUM "
        "ESTRUTURALMENTE OK"
    )
else:
    print(
        "⚠ AUDITORIA DETETOU UM OU MAIS "
        "PONTOS A REVER"
    )

print("=" * 78)

print()
print(
    "Auditoria exclusivamente de leitura."
)

print(
    "Nenhum ficheiro foi alterado."
)
