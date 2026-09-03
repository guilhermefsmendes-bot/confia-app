from pathlib import Path
import sys

# ============================================================
# CONFIA — FASE 5E.1
# AUDITORIA DE CURIOSIDADE CONCRETA
#
# APENAS LEITURA.
#
# Objetivo:
# descobrir que evidência concreta já existe para a CONFIA
# poder mostrar pequenas pistas reais ao utilizador, como:
#
# - uma necessidade que se repete
# - uma direção de humor sustentada
# - uma estratégia que ajudou mais do que uma vez
# - redução média em episódios de Impulso
# - número de sinais independentes
#
# SEM:
# - inventar causalidade
# - afirmar diagnóstico
# - dizer "ontem..." sem prova
# - transformar um episódio em padrão
# - criar novo storage
# - criar novo motor
# - alterar ficheiros
# ============================================================

ROOT = Path.cwd()

FILES = {
    "APP": ROOT / "src/App.tsx",
    "MEMORY": ROOT / "src/data/reactive/reactiveRecentMemory.ts",
    "ENGINE": ROOT / "src/data/reactive/reactiveEngine.ts",
    "COMPANION": ROOT / "src/data/companionData.ts",
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


def show_context(text, marker, before=600, after=2400):
    pos = text.find(marker)

    if pos == -1:
        no(f"Não encontrado: {marker}")
        return

    start = max(0, pos - before)
    end = min(len(text), pos + after)

    print(text[start:end])


title("CONFIA — FASE 5E.1 / AUDITORIA DE CURIOSIDADE CONCRETA")


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

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
memory = texts["MEMORY"]
engine = texts["ENGINE"]
companion = texts["COMPANION"]


# ============================================================
# 2. 5D PRESERVADA
# ============================================================

section("1. BASE DE CURIOSIDADE JÁ EXISTENTE")

for marker in [
    "CONFIA 5B — SEMENTE DE AMANHÃ",
    "CONFIA 5C — CONTINUIDADE DO REGRESSO",
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA",
    "dailyMoment.evolvingInsight",
    "dailyContext.dailyLearningLevel",
]:
    total = count(app, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        no(f"{marker}: ausente")


# ============================================================
# 3. CAMPOS CONCRETOS DE HOME NOW MEMORY
# ============================================================

section("2. HOME NOW MEMORY — EVIDÊNCIA CONCRETA")

markers = [
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
    "repeatedNeed:",
    "repeatedNeedCount:",
    "recentEffectiveImpulseCount:",
    "recentImpulseAverageReduction:",
]

for marker in markers:

    total = count(app, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: não exposto em App.tsx")


section("2A. HOME NOW MEMORY COMPLETO")

show_context(
    app,
    "const homeNowMemory",
    before=250,
    after=6500,
)


# ============================================================
# 4. MEMÓRIA REATIVA — CAMPOS E CRITÉRIOS
# ============================================================

section("3. REACTIVE RECENT MEMORY")

memory_markers = [
    "latestMood",
    "previousMood",
    "recentMoodAverage",
    "moodDirection",
    "latestCheckIn",
    "previousCheckIn",
    "latestNeed",
    "repeatedNeed",
    "latestImpulse",
    "recentEffectiveImpulse",
    "effectiveImpulseCount",
    "recentImpulseCount",
    "recentImpulseAverageReduction",
    "effectiveImpulseNeed",
    "effectiveImpulseNeedCount",
    "hasImpulseLearning",
    "hasRepeatedSignals",
    "signalCount",
    "repeatedCheckInNeed",
    "repeatedCheckInNeedCount",
    "recentEffectiveImpulseCount",
    "activeDaysLast7",
]

for marker in memory_markers:

    total = count(memory, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: ausente")


# ============================================================
# 5. CRITÉRIO DE APRENDIZAGEM DO IMPULSO
# ============================================================

section("4. CRITÉRIO — IMPULSE LEARNING")

for marker in [
    "hasImpulseLearning",
    "effectiveImpulseCount",
    "effectiveImpulseNeedCount",
    "recentImpulseAverageReduction",
]:
    show_context(
        memory,
        marker,
        before=800,
        after=2200,
    )


# ============================================================
# 6. CRITÉRIO DE SINAIS REPETIDOS
# ============================================================

section("5. CRITÉRIO — CONTINUIDADE / SINAIS REPETIDOS")

show_context(
    memory,
    "hasRepeatedSignals",
    before=1400,
    after=4200,
)


# ============================================================
# 7. HUMOR
# ============================================================

section("6. HUMOR — DIREÇÃO E QUANTIDADE")

for marker in [
    "moodDirection",
    "recentMoodAverage",
    "moodRecordCount",
]:
    total = count(memory, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: ausente")


show_context(
    memory,
    "moodDirection",
    before=1000,
    after=3500,
)


# ============================================================
# 8. CHECK-IN
# ============================================================

section("7. CHECK-IN — NECESSIDADE REPETIDA")

for marker in [
    "repeatedNeed",
    "repeatedCheckInNeed",
    "repeatedCheckInNeedCount",
]:
    total = count(memory, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: ausente")


# ============================================================
# 9. IMPULSO
# ============================================================

section("8. IMPULSO — EVIDÊNCIA DE EFICÁCIA")

for marker in [
    "reduction >= 2",
    "effective: reduction >= 2",
    "partiallyEffective",
    "recentEffectiveImpulse",
    "effectiveImpulseCount",
    "effectiveImpulseNeed",
    "effectiveImpulseNeedCount",
    "recentImpulseAverageReduction",
]:
    total = (
        count(memory, marker)
        + count(engine, marker)
    )

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: não encontrado literalmente")


# ============================================================
# 10. DATAS
# ============================================================

section("9. DATAS E SEGURANÇA TEMPORAL")

for marker in [
    "date: string",
    "normalizeDate",
    "dateValue",
]:
    total = count(memory, marker)

    if total:
        ok(f"{marker}: {total}")
    else:
        warn(f"{marker}: ausente")

print()
print("Verificação:")
print("a 5E não deve usar linguagem como 'ontem sentiste...'")
print("a menos que o dado mostrado mantenha uma data explícita")
print("até à camada de apresentação.")


# ============================================================
# 11. CAMPOS QUE PODEM SER CANDIDATOS
# ============================================================

section("10. CANDIDATOS A INSIGHT CONCRETO")

candidates = {
    "Necessidade repetida em Check-In":
        "repeatedCheckInNeed",

    "Quantidade de repetição do Check-In":
        "repeatedCheckInNeedCount",

    "Direção do humor":
        "moodDirection",

    "Quantidade de registos de humor":
        "moodRecordCount",

    "Necessidade eficaz no Impulso":
        "effectiveImpulseNeed",

    "Quantidade de episódios eficazes dessa necessidade":
        "effectiveImpulseNeedCount",

    "Número de episódios eficazes":
        "effectiveImpulseCount",

    "Redução média recente":
        "recentImpulseAverageReduction",

    "Número de sinais independentes":
        "signalCount",

    "Episódios eficazes recentes":
        "recentEffectiveImpulseCount",
}

for label, marker in candidates.items():

    total = (
        count(app, marker)
        + count(memory, marker)
    )

    if total:
        ok(f"{label}: disponível ({total})")
    else:
        warn(f"{label}: não disponível")


# ============================================================
# 12. TEXTOS EXISTENTES QUE PODEM JÁ DIZER O MESMO
# ============================================================

section("11. RISCO DE DUPLICAÇÃO DE TEXTO")

for lang in [
    "PT",
    "EN",
    "ES",
    "FR",
]:

    text = texts[lang]

    print()
    print(f"[{lang}]")

    for marker in [
        "impulseLearning",
        "continuity",
        "evolvingInsight",
        "homeNow",
        "dailyMoment",
    ]:

        total = count(text, marker)

        if total:
            ok(f"{marker}: {total}")
        else:
            warn(f"{marker}: ausente")


# ============================================================
# 13. PROIBIR CONCLUSÕES NÃO SUPORTADAS
# ============================================================

section("12. PRINCÍPIOS EDITORIAIS PARA A 5E")

principles = [
    "1 episódio eficaz NÃO deve ser chamado de padrão.",
    "moodDirection NÃO deve ser apresentada como diagnóstico.",
    "stable NÃO deve ser apresentado como melhoria.",
    "repeatedNeed deve ser descrito como algo que apareceu várias vezes.",
    "averageReduction deve ser descrita como observação, não garantia.",
    "effectiveImpulseNeed pode sugerir algo que ajudou em mais de um episódio se a contagem sustentar isso.",
    "signalCount representa fontes de continuidade, não intensidade emocional.",
    "não usar datas relativas específicas sem data preservada na camada visual.",
]

for principle in principles:
    ok(principle)


# ============================================================
# 14. PERFORMANCE BASELINE
# ============================================================

section("13. PERFORMANCE BASELINE")

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

for name, text in {
    "APP": app,
    "MEMORY": memory,
}.items():

    print()
    print(f"[{name}]")

    for token in perf_tokens:
        print(
            f"{token:<28} {count(text, token)}"
        )


# ============================================================
# 15. DECISÃO PRELIMINAR
# ============================================================

section("14. DECISÃO PRELIMINAR")

has_impulse_learning = (
    "hasImpulseLearning" in memory
    and "effectiveImpulseCount" in memory
)

has_repeated_signals = (
    "hasRepeatedSignals" in memory
    and "signalCount" in memory
)

has_mood = (
    "moodDirection" in memory
    and "moodRecordCount" in memory
)

has_checkin = (
    "repeatedCheckInNeed" in memory
    and "repeatedCheckInNeedCount" in memory
)

has_effective_need = (
    "effectiveImpulseNeed" in memory
    and "effectiveImpulseNeedCount" in memory
)


if has_impulse_learning:
    ok("Existe evidência quantitativa para aprendizagem de Impulso.")
else:
    warn("Aprendizagem de Impulso insuficientemente exposta.")

if has_repeated_signals:
    ok("Existe evidência para falar de sinais repetidos.")
else:
    warn("Continuidade insuficientemente exposta.")

if has_mood:
    ok("Existe direção de humor acompanhada de quantidade de registos.")
else:
    warn("Humor não tem contexto suficiente.")

if has_checkin:
    ok("Existe necessidade repetida de Check-In com contagem.")
else:
    warn("Check-In repetido insuficientemente exposto.")

if has_effective_need:
    ok("Existe percurso de Impulso eficaz com contagem.")
else:
    warn("Percurso eficaz insuficientemente exposto.")


# ============================================================
# 16. RESULTADO
# ============================================================

title("RESULTADO — FASE 5E.1")

print()
print("Esta auditoria NÃO alterou nenhum ficheiro.")
print()
print("Objetivo da 5E.2:")
print()
print("selecionar apenas sinais concretos que tenham")
print("evidência suficiente e mostrar UMA pequena pista, por exemplo:")
print()
print('  "Há uma necessidade que tem aparecido mais vezes."')
print()
print('  "Há uma estratégia que já ajudou em mais de um momento."')
print()
print('  "O teu humor tem mostrado uma direção semelhante em vários registos."')
print()
print("sem transformar observações em certezas.")
print()
print("=" * 78)
