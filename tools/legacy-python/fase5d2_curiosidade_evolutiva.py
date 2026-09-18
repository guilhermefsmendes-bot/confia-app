from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 5D.2
# CURIOSIDADE EVOLUTIVA
#
# Objetivo:
# tornar visível a evolução qualitativa da relação
# CONFIA ↔ utilizador usando EXCLUSIVAMENTE a classificação
# dailyLearningLevel já existente.
#
# NÃO cria uma progressão nova.
#
# Não existem:
# - níveis numéricos
# - barra de progresso
# - percentagens
# - streak
# - recompensa
# - desbloqueios
#
# Estados reutilizados:
#
# early_learning
#   → a conhecer o ritmo
#
# repeated_signals
#   → a reconhecer sinais
#
# effective_impulse
#   → a perceber o que pode ajudar
#
# learned_impulse
#   → a aprender contigo
#
# none
#   → não mostra nada
#
# NÃO cria:
# - storage
# - state
# - effect
# - timer
# - listener
# - requestAnimationFrame
# - Reactive Engine
# - recolha de memória
# - dependência
#
# ALTERA:
#   src/App.tsx
#   src/locales/pt.json
#   src/locales/en.json
#   src/locales/es.json
#   src/locales/fr.json
#
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUPS = {
    APP:
        Path("/tmp/App.tsx.before_fase5d2_curiosidade"),

    LOCALES["pt"]:
        Path("/tmp/pt.json.before_fase5d2_curiosidade"),

    LOCALES["en"]:
        Path("/tmp/en.json.before_fase5d2_curiosidade"),

    LOCALES["es"]:
        Path("/tmp/es.json.before_fase5d2_curiosidade"),

    LOCALES["fr"]:
        Path("/tmp/fr.json.before_fase5d2_curiosidade"),
}


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — FASE 5D.2 NÃO APLICADA")
    print("=" * 78)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 78)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

for path in [APP, *LOCALES.values()]:

    if not path.exists():
        fail(
            f"Não encontrei:\n{path}"
        )


app_original = APP.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. VALIDAR ARQUITETURA
# ============================================================

required = [
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "CONFIA 5B — SEMENTE DE AMANHÃ",
    "CONFIA 5C — CONTINUIDADE DO REGRESSO",
    "dailyContext.dailyLearningLevel",
    '"learned_impulse"',
    '"effective_impulse"',
    '"repeated_signals"',
    '"early_learning"',
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA",
]

for marker in required:

    if marker not in app_original:
        fail(
            "App.tsx não corresponde à arquitetura esperada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 3. EVITAR DUPLICAÇÃO
# ============================================================

if (
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA"
    in app_original
):
    fail(
        "A Fase 5D.2 já parece estar aplicada."
    )

if (
    "dailyMoment.evolvingInsight."
    in app_original
):
    fail(
        "Já existem referências "
        "dailyMoment.evolvingInsight no App.tsx."
    )


# ============================================================
# 4. ÂNCORA
#
# Inserimos imediatamente antes da 5C.
#
# Ordem final:
#
# mensagem principal
# ↓
# 5D.2 o que a CONFIA está a perceber
# ↓
# 5C continuidade do regresso
# ↓
# 5B semente de amanhã
# ↓
# 3D ação
# ============================================================

anchor = '''        {/* ======================================================
            CONFIA 5C — CONTINUIDADE DO REGRESSO'''

if app_original.count(anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "o início da Fase 5C."
    )


# ============================================================
# 5. BLOCO VISUAL
#
# Não existe progresso numérico.
#
# É apenas uma tradução visível do
# dailyLearningLevel atual.
#
# none não apresenta o bloco.
# ============================================================

evolving_block = '''        {/* ======================================================
            CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA

            Torna visível a aprendizagem já existente.
            Não representa nível, percentagem ou progressão
            independente.
        ====================================================== */}
        {dailyContext.dailyLearningLevel !== "none" && (
          <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-[#E8DDD7]/45 bg-white/45 px-3.5 py-2.5">
            <div
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E5A88B]/20 bg-[#FFF9F5]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#C97B5E]/70" />
            </div>

            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#B79587]">
                {t("dailyMoment.evolvingInsight.eyebrow")}
              </p>

              <p className="mt-0.5 text-[10px] font-bold leading-relaxed text-[#806D65]">
                {dailyContext.dailyLearningLevel === "learned_impulse"
                  ? t("dailyMoment.evolvingInsight.learnedImpulse")
                  : dailyContext.dailyLearningLevel === "effective_impulse"
                    ? t("dailyMoment.evolvingInsight.effectiveImpulse")
                    : dailyContext.dailyLearningLevel === "repeated_signals"
                      ? t("dailyMoment.evolvingInsight.repeatedSignals")
                      : t("dailyMoment.evolvingInsight.early")}
              </p>
            </div>
          </div>
        )}

'''

app_updated = app_original.replace(
    anchor,
    evolving_block + anchor,
    1,
)


# ============================================================
# 6. VALIDAR INSERÇÃO
# ============================================================

new_markers = [
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA",
    'dailyContext.dailyLearningLevel !== "none"',
    't("dailyMoment.evolvingInsight.eyebrow")',
    't("dailyMoment.evolvingInsight.learnedImpulse")',
    't("dailyMoment.evolvingInsight.effectiveImpulse")',
    't("dailyMoment.evolvingInsight.repeatedSignals")',
    't("dailyMoment.evolvingInsight.early")',
]

for marker in new_markers:

    if marker not in app_updated:
        fail(
            f"Bloco 5D.2 incompleto:\n{marker}"
        )


if app_updated.count(
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA"
) != 1:
    fail(
        "Marcador 5D.2 não ficou único."
    )


# ============================================================
# 7. VALIDAR ORDEM
# ============================================================

pos_5d = app_updated.find(
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA"
)

pos_5c = app_updated.find(
    "CONFIA 5C — CONTINUIDADE DO REGRESSO"
)

pos_5b = app_updated.find(
    "CONFIA 5B — SEMENTE DE AMANHÃ"
)

pos_3d = app_updated.find(
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA"
)

if (
    pos_5d == -1
    or pos_5c == -1
    or pos_5b == -1
    or pos_3d == -1
):
    fail(
        "Não consegui determinar a ordem "
        "dos blocos da Principal."
    )


if not (
    pos_5d
    < pos_5c
    < pos_5b
    < pos_3d
):
    fail(
        "Ordem incorreta.\n\n"
        "Esperado:\n"
        "5D.2 → 5C → 5B → 3D"
    )


# ============================================================
# 8. PERFORMANCE
#
# Nenhuma contagem funcional pode mudar.
# ============================================================

tracked_tokens = [
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
    "analyzeReactiveState(",
    "collectReactiveRecentMemory(",
    "recordReactiveResponse(",
]

for token in tracked_tokens:

    before = app_original.count(token)
    after = app_updated.count(token)

    if before != after:
        fail(
            f"A Fase 5D.2 alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 9. PROIBIR PROGRESSÃO PARALELA
# ============================================================

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
    "learningReward",
    "discoveryReward",
]

for token in parallel_tokens:

    if (
        app_updated.count(token)
        != app_original.count(token)
    ):
        fail(
            "Foi introduzido um sistema paralelo:\n"
            f"{token}"
        )


# ============================================================
# 10. GARANTIR AUSÊNCIA DE NUMERAÇÃO DE NÍVEL
# ============================================================

new_start = app_updated.find(
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA"
)

new_end = app_updated.find(
    "CONFIA 5C — CONTINUIDADE DO REGRESSO",
    new_start,
)

new_region = app_updated[
    new_start:new_end
]

for forbidden in [
    "progress",
    "percent",
    "percentage",
    "level",
    "streak",
]:
    # O comentário pode mencionar conceitos proibidos
    # em contexto explicativo.
    #
    # Portanto esta validação limita-se ao JSX visual
    # depois do fecho do comentário.
    jsx_start = new_region.find("*/}")

    if jsx_start != -1:
        visible_region = new_region[
            jsx_start + 2:
        ].lower()

        if forbidden.lower() in visible_region:
            fail(
                "A UI da 5D.2 introduziu conceito "
                f"de progressão paralelo:\n{forbidden}"
            )


# ============================================================
# 11. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "eyebrow":
            "A CONFIA está a perceber",

        "early":
            "A conhecer o teu ritmo.",

        "repeatedSignals":
            "A reconhecer sinais que começam a repetir-se.",

        "effectiveImpulse":
            "A perceber melhor o que te pode ajudar.",

        "learnedImpulse":
            "A aprender contigo a partir do que realmente te ajuda.",
    },

    "en": {
        "eyebrow":
            "CONFIA is noticing",

        "early":
            "Getting to know your rhythm.",

        "repeatedSignals":
            "Recognising signals that are beginning to repeat.",

        "effectiveImpulse":
            "Understanding better what may help you.",

        "learnedImpulse":
            "Learning with you from what genuinely helps.",
    },

    "es": {
        "eyebrow":
            "CONFIA está percibiendo",

        "early":
            "Conociendo tu ritmo.",

        "repeatedSignals":
            "Reconociendo señales que empiezan a repetirse.",

        "effectiveImpulse":
            "Entendiendo mejor lo que puede ayudarte.",

        "learnedImpulse":
            "Aprendiendo contigo a partir de lo que realmente te ayuda.",
    },

    "fr": {
        "eyebrow":
            "CONFIA commence à percevoir",

        "early":
            "À découvrir ton rythme.",

        "repeatedSignals":
            "À reconnaître les signaux qui commencent à se répéter.",

        "effectiveImpulse":
            "À mieux comprendre ce qui peut t’aider.",

        "learnedImpulse":
            "À apprendre avec toi à partir de ce qui t’aide réellement.",
    },
}


# ============================================================
# 12. VALIDAR TRADUÇÕES
# ============================================================

expected_keys = {
    "eyebrow",
    "early",
    "repeatedSignals",
    "effectiveImpulse",
    "learnedImpulse",
}

for language, block in translations.items():

    if set(block.keys()) != expected_keys:
        fail(
            f"{language}: chaves de tradução incorretas."
        )

    for key, value in block.items():

        if (
            not isinstance(value, str)
            or not value.strip()
        ):
            fail(
                f"{language}: tradução vazia — {key}"
            )


# ============================================================
# 13. PREPARAR LOCALES
# ============================================================

locale_updated = {}

for language, path in LOCALES.items():

    raw = path.read_text(
        encoding="utf-8"
    )

    try:
        data = json.loads(raw)

    except json.JSONDecodeError as exc:
        fail(
            f"{language}: JSON inválido\n{exc}"
        )


    daily_moment = data.get(
        "dailyMoment"
    )


    if not isinstance(
        daily_moment,
        dict
    ):
        fail(
            f"{language}: dailyMoment não existe."
        )


    # Preservar 5B.
    if not isinstance(
        daily_moment.get("tomorrow"),
        dict
    ):
        fail(
            f"{language}: Fase 5B ausente."
        )


    # Preservar 5C.
    if not isinstance(
        daily_moment.get("continuityReturn"),
        dict
    ):
        fail(
            f"{language}: Fase 5C ausente."
        )


    if "evolvingInsight" in daily_moment:
        fail(
            f"{language}: evolvingInsight já existe."
        )


    daily_moment[
        "evolvingInsight"
    ] = translations[language]


    locale_updated[language] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


# ============================================================
# 14. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():

    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 15. ESCREVER
# ============================================================

APP.write_text(
    app_updated,
    encoding="utf-8"
)

for language, path in LOCALES.items():

    path.write_text(
        locale_updated[language],
        encoding="utf-8"
    )


# ============================================================
# 16. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:

    written_app = APP.read_text(
        encoding="utf-8"
    )


    # 5D única.
    if written_app.count(
        "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA"
    ) != 1:
        raise RuntimeError(
            "Marcador 5D.2 inválido."
        )


    # 5B preservada.
    if written_app.count(
        "CONFIA 5B — SEMENTE DE AMANHÃ"
    ) != 1:
        raise RuntimeError(
            "Fase 5B deixou de estar íntegra."
        )


    # 5C preservada.
    if written_app.count(
        "CONFIA 5C — CONTINUIDADE DO REGRESSO"
    ) != 1:
        raise RuntimeError(
            "Fase 5C deixou de estar íntegra."
        )


    # Ordem.
    written_5d = written_app.find(
        "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA"
    )

    written_5c = written_app.find(
        "CONFIA 5C — CONTINUIDADE DO REGRESSO"
    )

    written_5b = written_app.find(
        "CONFIA 5B — SEMENTE DE AMANHÃ"
    )

    written_3d = written_app.find(
        "CONFIA 3D — AÇÃO INTELIGENTE DO DIA"
    )


    if not (
        written_5d
        < written_5c
        < written_5b
        < written_3d
    ):
        raise RuntimeError(
            "Ordem 5D.2 → 5C → 5B → 3D inválida."
        )


    # Performance.
    for token in tracked_tokens:

        before = app_original.count(token)
        after = written_app.count(token)

        if before != after:
            raise RuntimeError(
                f"Contagem alterada: {token}"
            )


    # Locales.
    for language, path in LOCALES.items():

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        daily_moment = data.get(
            "dailyMoment",
            {}
        )

        evolving = daily_moment.get(
            "evolvingInsight"
        )

        tomorrow = daily_moment.get(
            "tomorrow"
        )

        continuity = daily_moment.get(
            "continuityReturn"
        )


        if (
            not isinstance(evolving, dict)
            or set(evolving.keys()) != expected_keys
        ):
            raise RuntimeError(
                f"5D.2 inválida em {language}."
            )


        if not isinstance(
            tomorrow,
            dict
        ):
            raise RuntimeError(
                f"5B perdida em {language}."
            )


        if not isinstance(
            continuity,
            dict
        ):
            raise RuntimeError(
                f"5C perdida em {language}."
            )


except Exception as exc:

    for source, backup in BACKUPS.items():

        shutil.copy2(
            backup,
            source
        )


    print()
    print("=" * 78)
    print(
        "ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO"
    )
    print("=" * 78)
    print()
    print(exc)
    print()
    print(
        "Todos os ficheiros foram restaurados."
    )
    print("=" * 78)

    sys.exit(1)


# ============================================================
# 17. RESULTADO
# ============================================================

print()
print("=" * 78)
print(
    "CONFIA — FASE 5D.2 / CURIOSIDADE EVOLUTIVA"
)
print("=" * 78)
print()

print("✓ Aprendizagem existente tornada visível")
print("✓ early_learning → conhecer o ritmo")
print("✓ repeated_signals → reconhecer sinais")
print("✓ effective_impulse → perceber o que pode ajudar")
print("✓ learned_impulse → aprender contigo")
print("✓ none → nenhum bloco artificial")
print("✓ Sem níveis numéricos")
print("✓ Sem percentagens")
print("✓ Sem barra de progresso")
print("✓ Sem streak")
print("✓ Sem recompensa")
print("✓ Sem novo sistema de descoberta")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma chamada nova ao Reactive Engine")
print("✓ Nenhuma recolha nova de memória")
print("✓ Nenhuma dependência")
print("✓ 5B preservada")
print("✓ 5C preservada")
print("✓ PT / EN / ES / FR")
print()
print("Arquitetura:")
print()
print("MEMÓRIA EXISTENTE")
print("      ↓")
print("DAILY LEARNING LEVEL")
print("      ↓")
print("CURIOSIDADE EVOLUTIVA VISÍVEL")
print("      ↓")
print("MUNDO + COMPANION")
print("      ↓")
print("AMANHÃ / REGRESSO")
print()
print("Backups:")
print("  /tmp/App.tsx.before_fase5d2_curiosidade")
print("  /tmp/pt.json.before_fase5d2_curiosidade")
print("  /tmp/en.json.before_fase5d2_curiosidade")
print("  /tmp/es.json.before_fase5d2_curiosidade")
print("  /tmp/fr.json.before_fase5d2_curiosidade")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
