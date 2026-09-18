from pathlib import Path
import re
import sys

# ============================================================
# CONFIA — FASE 5D.1
# AUDITORIA DE CURIOSIDADE EVOLUTIVA
#
# APENAS LEITURA.
#
# Objetivo:
# descobrir se conseguimos transformar a aprendizagem
# já existente numa sensação progressiva de descoberta:
#
# CONHECER
#   ↓
# RECONHECER
#   ↓
# TESTAR
#   ↓
# APRENDER
#
# sem criar:
# - novo storage
# - nova memória
# - streak
# - recompensa
# - novo motor
# - timers
# - animações permanentes
# - sistema paralelo
#
# NÃO ALTERA NENHUM FICHEIRO.
# ============================================================

ROOT = Path.cwd()

FILES = {
    "APP": ROOT / "src/App.tsx",
    "HOMEWORLD": ROOT / "src/components/HomeWorld.tsx",
    "AVATAR": ROOT / "src/components/Avatar.tsx",
    "MEMORY": ROOT / "src/data/reactive/reactiveRecentMemory.ts",
    "PT": ROOT / "src/locales/pt.json",
    "EN": ROOT / "src/locales/en.json",
    "ES": ROOT / "src/locales/es.json",
    "FR": ROOT / "src/locales/fr.json",
}


def title(text):
    print()
    print("=" * 78)
    print(text)
    print("=" * 78)


def section(text):
    print()
    print("-" * 78)
    print(text)
    print("-" * 78)


def ok(text):
    print(f"✓ {text}")


def warn(text):
    print(f"⚠ {text}")


def no(text):
    print(f"✗ {text}")


def count(text, token):
    return text.count(token)


def show_context(text, marker, before=500, after=1600):
    pos = text.find(marker)

    if pos == -1:
        no(f"Não encontrado: {marker}")
        return

    start = max(0, pos - before)
    end = min(len(text), pos + after)

    print(text[start:end])


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

title("CONFIA — FASE 5D.1 / AUDITORIA DE CURIOSIDADE EVOLUTIVA")

missing = []

for name, path in FILES.items():
    if path.exists():
        ok(f"{name}: {path}")
    else:
        no(f"{name}: {path}")
        missing.append(str(path))

if missing:
    print()
    print("Auditoria interrompida.")
    sys.exit(1)


texts = {
    name: path.read_text(encoding="utf-8")
    for name, path in FILES.items()
}

app = texts["APP"]
homeworld = texts["HOMEWORLD"]
avatar = texts["AVATAR"]
memory = texts["MEMORY"]


# ============================================================
# 2. DAILY LEARNING LEVEL
# ============================================================

section("1. DAILY LEARNING LEVEL")

levels = [
    "learned_impulse",
    "effective_impulse",
    "repeated_signals",
    "early_learning",
    "none",
]

for level in levels:
    occurrences = count(app, level)

    if occurrences:
        ok(f"{level}: {occurrences} ocorrência(s) em App.tsx")
    else:
        no(f"{level}: ausente")


section("1A. BLOCO DE CLASSIFICAÇÃO")

show_context(
    app,
    "const dailyLearningLevel",
    before=700,
    after=1800,
)


# ============================================================
# 3. QUE EVIDÊNCIA EXISTE POR NÍVEL?
# ============================================================

section("2. MEMÓRIA DISPONÍVEL")

memory_markers = [
    "hasImpulseLearning",
    "effectiveImpulseCount",
    "recentImpulseCount",
    "recentImpulseAverageReduction",
    "effectiveImpulseNeed",
    "effectiveImpulseNeedCount",
    "recentEffectiveImpulse",
    "continuity",
    "hasRepeatedSignals",
    "signalCount",
    "moodDirection",
    "moodRecordCount",
    "repeatedCheckInNeed",
    "repeatedCheckInNeedCount",
    "activeDaysLast7",
]

for marker in memory_markers:
    total = count(memory, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: não encontrado")


# ============================================================
# 4. HOMENOWMEMORY
# ============================================================

section("3. HOME NOW MEMORY — CAMPOS EXPOSTOS")

for marker in [
    'kind: "impulseLearning"',
    'kind: "impulseMemory"',
    'kind: "continuity"',
    "effectiveCount:",
    "recentCount:",
    "averageReduction:",
    "need:",
    "needCount:",
    "recentEffective:",
    "signalCount:",
    "moodDirection:",
    "moodRecordCount:",
    "repeatedCheckInNeed:",
    "repeatedCheckInNeedCount:",
]:
    total = count(app, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: ausente em App.tsx")


section("3A. BLOCO HOME NOW MEMORY")

show_context(
    app,
    "const homeNowMemory",
    before=300,
    after=5200,
)


# ============================================================
# 5. 5B + 5C
# ============================================================

section("4. RETENÇÃO JÁ EXISTENTE")

for marker in [
    "CONFIA 5B — SEMENTE DE AMANHÃ",
    "CONFIA 5C — CONTINUIDADE DO REGRESSO",
    "dailyMoment.tomorrow",
    "dailyMoment.continuityReturn",
    "daysSincePreviousOpen === 1",
]:
    total = count(app, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        no(f"{marker}: ausente")


# ============================================================
# 6. MUNDO VIVO
# ============================================================

section("5. WORLD MOOD")

for marker in [
    'worldMood =',
    '"growing"',
    '"settling"',
    '"discovering"',
    '"neutral"',
    "dailyContext?.dailyLearningLevel",
]:
    total = count(app, marker)

    if total:
        ok(f"App — {marker}: {total}")
    else:
        warn(f"App — {marker}: ausente")


section("5A. WORLD MOOD — CONTEXTO")

show_context(
    app,
    "const worldMood",
    before=500,
    after=1800,
)


# ============================================================
# 7. HOMEWORLD
# ============================================================

section("6. HOMEWORLD — REFLEXO VISUAL")

for marker in [
    "worldMood",
    "bg-gradient-to-b",
    "PremiumSky",
    "PremiumLighting",
    "PremiumGround",
    "PremiumDepth",
    "PremiumRefuge",
    "Clouds",
    "Butterflies",
    "Vegetation",
    "Environment",
]:
    total = count(homeworld, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: ausente")


# ============================================================
# 8. COMPANION
# ============================================================

section("7. COMPANION VIVO")

for marker in [
    "companionWorldMood",
    "companionStatus",
    "companionWorldStatus",
    "A crescer contigo",
    "A encontrar equilíbrio",
    "A conhecer-te",
    "Aqui contigo",
]:
    total = (
        count(homeworld, marker)
        + count(avatar, marker)
        + count(texts["PT"], marker)
    )

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: ausente")


# ============================================================
# 9. TEXTOS DE APRENDIZAGEM JÁ VISÍVEIS
# ============================================================

section("8. TEXTOS DE APRENDIZAGEM / DESCOBERTA")

translation_tokens = [
    "dailyMoment",
    "tomorrow",
    "continuityReturn",
    "impulseLearning",
    "companionWorldStatus",
]

for lang in ["PT", "EN", "ES", "FR"]:
    text = texts[lang]

    print()
    print(f"[{lang}]")

    for token in translation_tokens:
        total = count(text, token)

        if total:
            ok(f"{token}: {total}")
        else:
            warn(f"{token}: ausente")


# ============================================================
# 10. PROCURAR POSSÍVEL SISTEMA DE PROGRESSÃO PARALELO
# ============================================================

section("9. RISCO DE DUPLICAÇÃO")

parallel_tokens = [
    "learningProgress",
    "discoveryProgress",
    "insightProgress",
    "knowledgeLevel",
    "relationshipLevel",
    "dailyStreak",
    "openStreak",
    "consecutiveOpenDays",
    "dailyReward",
]

found_parallel = False

for token in parallel_tokens:
    total = (
        count(app, token)
        + count(homeworld, token)
        + count(avatar, token)
        + count(memory, token)
    )

    if total:
        warn(f"{token}: {total}")
        found_parallel = True
    else:
        ok(f"{token}: 0")

if not found_parallel:
    ok("Não foi encontrado sistema paralelo óbvio de descoberta/retenção.")


# ============================================================
# 11. PERFORMANCE BASELINE
# ============================================================

section("10. PERFORMANCE BASELINE")

targets = {
    "APP": app,
    "HOMEWORLD": homeworld,
    "AVATAR": avatar,
}

perf_tokens = [
    "useState(",
    "useEffect(",
    "useMemo(",
    "useCallback(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
    "localStorage.getItem",
    "localStorage.setItem",
]

for name, text in targets.items():
    print()
    print(f"[{name}]")

    for token in perf_tokens:
        print(
            f"{token:<28} {count(text, token)}"
        )


# ============================================================
# 12. CANDIDATOS A CURIOSIDADE
# ============================================================

section("11. CANDIDATOS JÁ EXISTENTES PARA EVOLUÇÃO")

candidates = {
    "Aprendizagem inicial":
        'dailyLearningLevel',

    "Experiência eficaz":
        'effective_impulse',

    "Sinais repetidos":
        'repeated_signals',

    "Aprendizagem de Impulso":
        'learned_impulse',

    "Atmosfera do mundo":
        'worldMood',

    "Estado do Companion":
        'companionStatus',

    "Continuidade entre dias":
        'daysSincePreviousOpen',

    "Memória pessoal":
        'homeNowMemory',
}

for label, marker in candidates.items():

    total = (
        count(app, marker)
        + count(homeworld, marker)
        + count(avatar, marker)
        + count(memory, marker)
    )

    if total:
        ok(f"{label}: disponível ({total})")
    else:
        warn(f"{label}: não encontrado")


# ============================================================
# 13. DECISÃO AUTOMÁTICA PRELIMINAR
# ============================================================

section("12. DECISÃO PRELIMINAR")

has_levels = all(
    level in app
    for level in levels
)

has_world = (
    "worldMood" in app
    and "worldMood" in homeworld
)

has_companion = (
    "companionWorldMood" in homeworld
    and "companionStatus" in avatar
)

has_5b = (
    "CONFIA 5B — SEMENTE DE AMANHÃ"
    in app
)

has_5c = (
    "CONFIA 5C — CONTINUIDADE DO REGRESSO"
    in app
)

if has_levels:
    ok("Existe uma escala qualitativa de aprendizagem reutilizável.")
else:
    warn("Escala qualitativa incompleta.")

if has_world:
    ok("O Mundo já consegue refletir a aprendizagem.")
else:
    warn("Ligação ao Mundo incompleta.")

if has_companion:
    ok("O Companion já consegue refletir a aprendizagem.")
else:
    warn("Ligação ao Companion incompleta.")

if has_5b and has_5c:
    ok("O loop amanhã → regresso já existe.")
else:
    warn("Loop de retenção 5B/5C incompleto.")


# ============================================================
# 14. RESULTADO
# ============================================================

title("RESULTADO — FASE 5D.1")

print()
print("Esta auditoria NÃO alterou nenhum ficheiro.")
print()
print("Objetivo da próxima decisão:")
print()
print("descobrir se a curiosidade pode nascer da evolução")
print("da própria relação CONFIA ↔ utilizador, reutilizando:")
print()
print("  dailyLearningLevel")
print("        ↓")
print("  homeNowMemory")
print("        ↓")
print("  worldMood")
print("        ↓")
print("  companionStatus")
print()
print("em vez de criar XP, streak, recompensas ou")
print("um novo sistema de progressão.")
print()
print("=" * 78)
