from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 5E.2 v2
# CURIOSIDADE CONCRETA
#
# Objetivo:
#
# transformar a frase genérica da 5D numa observação
# concreta APENAS quando homeNowMemory já contém
# evidência suficiente.
#
# NÃO cria outro cartão.
# NÃO cria outro sistema.
#
# Prioridade:
#
# 1. Impulso:
#    percurso/necessidade eficaz repetida >= 2
#
# 2. Check-In:
#    necessidade repetida >= 2
#
# 3. Humor:
#    direção observada em >= 3 registos
#
# 4. Fallback:
#    texto genérico da 5D atual
#
# IMPORTANTE:
#
# - stable não significa melhoria
# - improving/declining são direções observadas
# - uma estratégia eficaz não é garantia
# - uma necessidade repetida não é diagnóstico
# - não são usadas datas relativas
#
# NÃO cria:
# - storage
# - useState
# - useEffect
# - timer
# - listener
# - requestAnimationFrame
# - Reactive Engine
# - recolha de memória
# - dependência
# - streak
# - recompensa
#
# ALTERA:
#   src/App.tsx
#   src/locales/pt.json
#   src/locales/en.json
#   src/locales/es.json
#   src/locales/fr.json
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
        Path("/tmp/App.tsx.before_fase5e2_v2"),

    LOCALES["pt"]:
        Path("/tmp/pt.json.before_fase5e2_v2"),

    LOCALES["en"]:
        Path("/tmp/en.json.before_fase5e2_v2"),

    LOCALES["es"]:
        Path("/tmp/es.json.before_fase5e2_v2"),

    LOCALES["fr"]:
        Path("/tmp/fr.json.before_fase5e2_v2"),
}


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — FASE 5E.2 v2 NÃO APLICADA")
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
# 2. VALIDAR ARQUITETURA EXISTENTE
# ============================================================

required = [
    'kind: "impulseLearning" as const',
    "effectiveCount:",
    "averageReduction:",
    "need:",
    "needCount:",
    'kind: "continuity" as const',
    "signalCount:",
    "moodDirection:",
    "moodRecordCount:",
    "repeatedCheckInNeed:",
    "repeatedCheckInNeedCount:",
    "repeatedNeed:",
    "repeatedNeedCount:",
    "recentEffectiveImpulseCount:",
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA",
    "CONFIA 5C — CONTINUIDADE DO REGRESSO",
    "CONFIA 5B — SEMENTE DE AMANHÃ",
    "dailyMoment.evolvingInsight.eyebrow",
    "dailyMoment.evolvingInsight.learnedImpulse",
    "dailyMoment.evolvingInsight.effectiveImpulse",
    "dailyMoment.evolvingInsight.repeatedSignals",
    "dailyMoment.evolvingInsight.early",
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
    "CONFIA 5E.2 — CURIOSIDADE CONCRETA"
    in app_original
):
    fail(
        "A Fase 5E.2 já parece estar aplicada."
    )

if (
    "dailyMoment.concreteInsight."
    in app_original
):
    fail(
        "Já existem referências "
        "dailyMoment.concreteInsight no App.tsx."
    )


# ============================================================
# 4. BLOCO 5D ATUAL
#
# Substituímos apenas o conteúdo textual.
# A estrutura visual fica exatamente igual.
# ============================================================

old_block = '''              <p className="mt-0.5 text-[10px] font-bold leading-relaxed text-[#806D65]">
                {dailyContext.dailyLearningLevel === "learned_impulse"
                  ? t("dailyMoment.evolvingInsight.learnedImpulse")
                  : dailyContext.dailyLearningLevel === "effective_impulse"
                    ? t("dailyMoment.evolvingInsight.effectiveImpulse")
                    : dailyContext.dailyLearningLevel === "repeated_signals"
                      ? t("dailyMoment.evolvingInsight.repeatedSignals")
                      : t("dailyMoment.evolvingInsight.early")}
              </p>'''

if app_original.count(old_block) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "o texto atual da Fase 5D.2.\n\n"
        "Nenhuma alteração foi feita."
    )


# ============================================================
# 5. NOVO CONTEÚDO
#
# Uma única frase continua a ser apresentada.
#
# A diferença:
#
# antes:
#   frase qualitativa 5D
#
# agora:
#   evidência concreta, quando disponível
#   OU
#   fallback 5D
# ============================================================

new_block = '''              <p className="mt-0.5 text-[10px] font-bold leading-relaxed text-[#806D65]">
                {/* CONFIA 5E.2 — CURIOSIDADE CONCRETA */}
                {homeNowMemory?.kind === "impulseLearning" &&
                 homeNowMemory.need &&
                 homeNowMemory.needCount >= 2
                  ? t(
                      `dailyMoment.concreteInsight.impulse.${homeNowMemory.need}`
                    )
                  : homeNowMemory?.kind === "continuity" &&
                      homeNowMemory.repeatedNeed &&
                      homeNowMemory.repeatedNeedCount >= 2
                    ? t(
                        `dailyMoment.concreteInsight.impulse.${homeNowMemory.repeatedNeed}`
                      )
                    : homeNowMemory?.kind === "continuity" &&
                        homeNowMemory.repeatedCheckInNeed &&
                        homeNowMemory.repeatedCheckInNeedCount >= 2
                      ? t(
                          "dailyMoment.concreteInsight.checkIn"
                        )
                      : homeNowMemory?.kind === "continuity" &&
                          homeNowMemory.moodRecordCount >= 3 &&
                          homeNowMemory.moodDirection === "improving"
                        ? t(
                            "dailyMoment.concreteInsight.moodImproving"
                          )
                        : homeNowMemory?.kind === "continuity" &&
                            homeNowMemory.moodRecordCount >= 3 &&
                            homeNowMemory.moodDirection === "declining"
                          ? t(
                              "dailyMoment.concreteInsight.moodDeclining"
                            )
                          : homeNowMemory?.kind === "continuity" &&
                              homeNowMemory.moodRecordCount >= 3 &&
                              homeNowMemory.moodDirection === "stable"
                            ? t(
                                "dailyMoment.concreteInsight.moodStable"
                              )
                            : dailyContext.dailyLearningLevel === "learned_impulse"
                              ? t("dailyMoment.evolvingInsight.learnedImpulse")
                              : dailyContext.dailyLearningLevel === "effective_impulse"
                                ? t("dailyMoment.evolvingInsight.effectiveImpulse")
                                : dailyContext.dailyLearningLevel === "repeated_signals"
                                  ? t("dailyMoment.evolvingInsight.repeatedSignals")
                                  : t("dailyMoment.evolvingInsight.early")}
              </p>'''


app_updated = app_original.replace(
    old_block,
    new_block,
    1,
)


# ============================================================
# 6. VALIDAR INSERÇÃO
#
# IMPORTANTE:
#
# Procuramos as CHAVES, não a formatação t("...").
#
# Assim a validação não falha apenas porque t( e a string
# estão em linhas diferentes.
# ============================================================

required_new = [
    "CONFIA 5E.2 — CURIOSIDADE CONCRETA",

    'homeNowMemory?.kind === "impulseLearning"',
    "homeNowMemory.needCount >= 2",

    'homeNowMemory?.kind === "continuity"',
    "homeNowMemory.repeatedNeedCount >= 2",
    "homeNowMemory.repeatedCheckInNeedCount >= 2",

    "homeNowMemory.moodRecordCount >= 3",

    'homeNowMemory.moodDirection === "improving"',
    'homeNowMemory.moodDirection === "declining"',
    'homeNowMemory.moodDirection === "stable"',

    "dailyMoment.concreteInsight.impulse.",
    "dailyMoment.concreteInsight.checkIn",
    "dailyMoment.concreteInsight.moodImproving",
    "dailyMoment.concreteInsight.moodDeclining",
    "dailyMoment.concreteInsight.moodStable",

    "dailyMoment.evolvingInsight.learnedImpulse",
    "dailyMoment.evolvingInsight.effectiveImpulse",
    "dailyMoment.evolvingInsight.repeatedSignals",
    "dailyMoment.evolvingInsight.early",
]

for marker in required_new:

    if marker not in app_updated:
        fail(
            f"5E.2 incompleta:\n{marker}"
        )


if app_updated.count(
    "CONFIA 5E.2 — CURIOSIDADE CONCRETA"
) != 1:
    fail(
        "Marcador 5E.2 não ficou único."
    )


# ============================================================
# 7. VALIDAR HIERARQUIA
#
# Os primeiros índices das condições devem respeitar:
#
# impulseLearning
# ↓
# repeatedNeed
# ↓
# repeatedCheckIn
# ↓
# mood
# ↓
# fallback 5D
# ============================================================

region_start = app_updated.find(
    "CONFIA 5E.2 — CURIOSIDADE CONCRETA"
)

region_end = app_updated.find(
    "</p>",
    region_start,
)

if (
    region_start == -1
    or region_end == -1
):
    fail(
        "Não consegui isolar a lógica da 5E.2."
    )


logic_region = app_updated[
    region_start:region_end
]


hierarchy = [
    'homeNowMemory?.kind === "impulseLearning"',
    "homeNowMemory.repeatedNeedCount >= 2",
    "homeNowMemory.repeatedCheckInNeedCount >= 2",
    'homeNowMemory.moodDirection === "improving"',
    "dailyMoment.evolvingInsight.learnedImpulse",
]

positions = []

for marker in hierarchy:

    pos = logic_region.find(marker)

    if pos == -1:
        fail(
            f"Hierarquia 5E.2 incompleta:\n{marker}"
        )

    positions.append(pos)


if positions != sorted(positions):
    fail(
        "A prioridade da 5E.2 ficou incorreta.\n\n"
        "Esperado:\n"
        "Impulso → Check-In → Humor → fallback 5D"
    )


# ============================================================
# 8. PRESERVAR 5B / 5C / 5D
# ============================================================

for marker in [
    "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA",
    "CONFIA 5C — CONTINUIDADE DO REGRESSO",
    "CONFIA 5B — SEMENTE DE AMANHÃ",
]:

    if app_updated.count(marker) != 1:
        fail(
            f"Camada anterior deixou de estar íntegra:\n{marker}"
        )


# ============================================================
# 9. ESTRUTURA VISUAL
#
# 5E não deve adicionar cartão.
# ============================================================

def region_5d(text):

    start = text.find(
        "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA"
    )

    end = text.find(
        "CONFIA 5C — CONTINUIDADE DO REGRESSO",
        start,
    )

    if (
        start == -1
        or end == -1
    ):
        return ""

    return text[start:end]


before_region = region_5d(
    app_original
)

after_region = region_5d(
    app_updated
)

if (
    not before_region
    or not after_region
):
    fail(
        "Não consegui isolar a região visual da 5D."
    )


for token in [
    "<div",
    "</div>",
    "<p",
    "</p>",
]:

    before = before_region.count(token)
    after = after_region.count(token)

    if before != after:
        fail(
            "A 5E.2 alterou a estrutura visual da 5D.\n\n"
            f"{token}\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 10. PERFORMANCE
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
            f"A 5E.2 alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 11. PROIBIR SISTEMA PARALELO
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
# 12. TRADUÇÕES
#
# Não mostramos contagens.
#
# A contagem existe apenas como requisito técnico para
# decidir se a frase concreta é segura.
# ============================================================

translations = {
    "pt": {
        "impulse": {
            "calm":
                "Acalmar já parece ter ajudado em mais do que um momento.",

            "mind":
                "Organizar a mente já parece ter ajudado em mais do que um momento.",

            "control":
                "Recuperar o controlo já parece ter ajudado em mais do que um momento.",

            "support":
                "Procurar apoio já parece ter ajudado em mais do que um momento.",
        },

        "checkIn":
            "Há uma necessidade que tem aparecido mais do que uma vez nos teus check-ins.",

        "moodImproving":
            "Em vários registos recentes, o teu humor tem mostrado uma direção mais favorável.",

        "moodDeclining":
            "Em vários registos recentes, o teu humor tem mostrado uma direção mais difícil.",

        "moodStable":
            "Em vários registos recentes, o teu humor tem-se mantido numa direção semelhante.",
    },

    "en": {
        "impulse": {
            "calm":
                "Calming down already seems to have helped in more than one moment.",

            "mind":
                "Organising your thoughts already seems to have helped in more than one moment.",

            "control":
                "Regaining a sense of control already seems to have helped in more than one moment.",

            "support":
                "Seeking support already seems to have helped in more than one moment.",
        },

        "checkIn":
            "A need has appeared more than once across your check-ins.",

        "moodImproving":
            "Across several recent entries, your mood has shown a more favourable direction.",

        "moodDeclining":
            "Across several recent entries, your mood has shown a more difficult direction.",

        "moodStable":
            "Across several recent entries, your mood has remained in a similar direction.",
    },

    "es": {
        "impulse": {
            "calm":
                "Calmarte ya parece haber ayudado en más de un momento.",

            "mind":
                "Organizar la mente ya parece haber ayudado en más de un momento.",

            "control":
                "Recuperar la sensación de control ya parece haber ayudado en más de un momento.",

            "support":
                "Buscar apoyo ya parece haber ayudado en más de un momento.",
        },

        "checkIn":
            "Hay una necesidad que ha aparecido más de una vez en tus check-ins.",

        "moodImproving":
            "En varios registros recientes, tu estado de ánimo ha mostrado una dirección más favorable.",

        "moodDeclining":
            "En varios registros recientes, tu estado de ánimo ha mostrado una dirección más difícil.",

        "moodStable":
            "En varios registros recientes, tu estado de ánimo se ha mantenido en una dirección similar.",
    },

    "fr": {
        "impulse": {
            "calm":
                "T’apaiser semble déjà avoir aidé à plus d’un moment.",

            "mind":
                "Organiser tes pensées semble déjà avoir aidé à plus d’un moment.",

            "control":
                "Retrouver un sentiment de contrôle semble déjà avoir aidé à plus d’un moment.",

            "support":
                "Chercher du soutien semble déjà avoir aidé à plus d’un moment.",
        },

        "checkIn":
            "Un besoin est apparu plus d’une fois dans tes check-ins.",

        "moodImproving":
            "Sur plusieurs entrées récentes, ton humeur a montré une direction plus favorable.",

        "moodDeclining":
            "Sur plusieurs entrées récentes, ton humeur a montré une direction plus difficile.",

        "moodStable":
            "Sur plusieurs entrées récentes, ton humeur est restée dans une direction similaire.",
    },
}


# ============================================================
# 13. VALIDAR TRADUÇÕES
# ============================================================

expected_root_keys = {
    "impulse",
    "checkIn",
    "moodImproving",
    "moodDeclining",
    "moodStable",
}

expected_impulse_keys = {
    "calm",
    "mind",
    "control",
    "support",
}


for language, block in translations.items():

    if set(block.keys()) != expected_root_keys:
        fail(
            f"{language}: estrutura concreteInsight incorreta."
        )


    impulse = block.get(
        "impulse"
    )

    if not isinstance(
        impulse,
        dict
    ):
        fail(
            f"{language}: impulse inválido."
        )


    if set(impulse.keys()) != expected_impulse_keys:
        fail(
            f"{language}: necessidades do Impulso incompletas."
        )


    for key, value in impulse.items():

        if (
            not isinstance(value, str)
            or not value.strip()
        ):
            fail(
                f"{language}: impulse.{key} vazio."
            )


    for key in [
        "checkIn",
        "moodImproving",
        "moodDeclining",
        "moodStable",
    ]:

        value = block.get(
            key
        )

        if (
            not isinstance(value, str)
            or not value.strip()
        ):
            fail(
                f"{language}: {key} vazio."
            )


# ============================================================
# 14. SEGURANÇA EDITORIAL
# ============================================================

forbidden_by_language = {
    "pt": [
        "sempre funciona",
        "vai funcionar",
        "garantido",
        "diagnóstico",
        "ontem sentiste",
        "ontem precisaste",
        "padrão confirmado",
    ],

    "en": [
        "always works",
        "will work",
        "guaranteed",
        "diagnosis",
        "yesterday you felt",
        "yesterday you needed",
        "confirmed pattern",
    ],

    "es": [
        "siempre funciona",
        "va a funcionar",
        "garantizado",
        "diagnóstico",
        "ayer sentiste",
        "ayer necesitaste",
        "patrón confirmado",
    ],

    "fr": [
        "fonctionne toujours",
        "fonctionnera",
        "garanti",
        "diagnostic",
        "hier tu as ressenti",
        "hier tu avais besoin",
        "schéma confirmé",
    ],
}


for language, block in translations.items():

    values = []

    for value in block.values():

        if isinstance(
            value,
            dict
        ):
            values.extend(
                value.values()
            )
        else:
            values.append(
                value
            )


    joined = " ".join(
        values
    ).lower()


    for forbidden in forbidden_by_language[language]:

        if forbidden.lower() in joined:
            fail(
                f"{language}: afirmação editorial "
                f"demasiado forte:\n{forbidden}"
            )


# ============================================================
# 15. PREPARAR LOCALES
# ============================================================

locale_updated = {}

for language, path in LOCALES.items():

    raw = path.read_text(
        encoding="utf-8"
    )

    try:
        data = json.loads(
            raw
        )

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


    # 5B
    if not isinstance(
        daily_moment.get("tomorrow"),
        dict
    ):
        fail(
            f"{language}: 5B ausente."
        )


    # 5C
    if not isinstance(
        daily_moment.get("continuityReturn"),
        dict
    ):
        fail(
            f"{language}: 5C ausente."
        )


    # 5D
    if not isinstance(
        daily_moment.get("evolvingInsight"),
        dict
    ):
        fail(
            f"{language}: 5D ausente."
        )


    if "concreteInsight" in daily_moment:
        fail(
            f"{language}: concreteInsight já existe."
        )


    daily_moment[
        "concreteInsight"
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
# 16. BACKUPS
#
# Só depois de TODAS as validações prévias.
# ============================================================

for source, backup in BACKUPS.items():

    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 17. ESCREVER
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
# 18. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:

    written_app = APP.read_text(
        encoding="utf-8"
    )


    # 5E.
    if written_app.count(
        "CONFIA 5E.2 — CURIOSIDADE CONCRETA"
    ) != 1:
        raise RuntimeError(
            "Marcador 5E.2 inválido."
        )


    # 5B / 5C / 5D.
    for marker in [
        "CONFIA 5D.2 — CURIOSIDADE EVOLUTIVA",
        "CONFIA 5C — CONTINUIDADE DO REGRESSO",
        "CONFIA 5B — SEMENTE DE AMANHÃ",
    ]:

        if written_app.count(marker) != 1:
            raise RuntimeError(
                f"Camada anterior danificada: {marker}"
            )


    # Todas as chaves concretas.
    for key in [
        "dailyMoment.concreteInsight.impulse.",
        "dailyMoment.concreteInsight.checkIn",
        "dailyMoment.concreteInsight.moodImproving",
        "dailyMoment.concreteInsight.moodDeclining",
        "dailyMoment.concreteInsight.moodStable",
    ]:

        if key not in written_app:
            raise RuntimeError(
                f"Chave 5E.2 ausente: {key}"
            )


    # Performance.
    for token in tracked_tokens:

        before = app_original.count(
            token
        )

        after = written_app.count(
            token
        )

        if before != after:
            raise RuntimeError(
                f"Contagem funcional alterada: {token}"
            )


    # Estrutura visual.
    written_region = region_5d(
        written_app
    )

    for token in [
        "<div",
        "</div>",
        "<p",
        "</p>",
    ]:

        if (
            written_region.count(token)
            != before_region.count(token)
        ):
            raise RuntimeError(
                f"Estrutura visual alterada: {token}"
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


        concrete = daily_moment.get(
            "concreteInsight"
        )


        if not isinstance(
            concrete,
            dict
        ):
            raise RuntimeError(
                f"5E.2 ausente em {language}."
            )


        if (
            set(concrete.keys())
            != expected_root_keys
        ):
            raise RuntimeError(
                f"5E.2 incompleta em {language}."
            )


        impulse = concrete.get(
            "impulse"
        )


        if (
            not isinstance(
                impulse,
                dict
            )
            or set(impulse.keys())
            != expected_impulse_keys
        ):
            raise RuntimeError(
                f"Impulso 5E.2 incompleto em {language}."
            )


        # Fases anteriores.
        for previous in [
            "tomorrow",
            "continuityReturn",
            "evolvingInsight",
        ]:

            if not isinstance(
                daily_moment.get(previous),
                dict
            ):
                raise RuntimeError(
                    f"{previous} perdido em {language}."
                )


except Exception as exc:

    # ========================================================
    # ROLLBACK
    # ========================================================

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
# 19. RESULTADO
# ============================================================

print()
print("=" * 78)
print(
    "CONFIA — FASE 5E.2 v2 / CURIOSIDADE CONCRETA"
)
print("=" * 78)
print()

print("✓ Uma única pista concreta por vez")
print("✓ Integrada na frase existente da 5D")
print("✓ Nenhum novo cartão")
print("✓ Impulso exige repetição >= 2")
print("✓ Check-In exige repetição >= 2")
print("✓ Humor exige >= 3 registos")
print("✓ improving descrito apenas como direção")
print("✓ declining descrito apenas como direção")
print("✓ stable não é descrito como melhoria")
print("✓ Sem causalidade artificial")
print("✓ Sem garantia de eficácia")
print("✓ Sem datas relativas artificiais")
print("✓ Fallback para texto genérico da 5D")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma chamada nova ao Reactive Engine")
print("✓ Nenhuma recolha nova de memória")
print("✓ Nenhuma dependência")
print("✓ Nenhuma streak")
print("✓ Nenhuma recompensa")
print("✓ 5B preservada")
print("✓ 5C preservada")
print("✓ 5D preservada")
print("✓ PT / EN / ES / FR")
print()
print("Prioridade:")
print()
print("IMPULSO EFICAZ REPETIDO")
print("        ↓")
print("CHECK-IN REPETIDO")
print("        ↓")
print("DIREÇÃO DO HUMOR")
print("        ↓")
print("FALLBACK 5D")
print()
print("Backups:")
print("  /tmp/App.tsx.before_fase5e2_v2")
print("  /tmp/pt.json.before_fase5e2_v2")
print("  /tmp/en.json.before_fase5e2_v2")
print("  /tmp/es.json.before_fase5e2_v2")
print("  /tmp/fr.json.before_fase5e2_v2")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
