from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 5C
# CONTINUIDADE DO REGRESSO
#
# Fecha o ciclo criado pela 5B:
#
# HOJE
#   ↓
# "Amanhã continuamos"
#   ↓
# DIA SEGUINTE
#   ↓
# "Continuamos de onde ficámos"
#
# IMPORTANTE:
#
# NÃO afirmamos que um sinal específico aconteceu ontem.
#
# Sabemos apenas, com segurança, que:
# - esta é a primeira abertura do novo dia
# - a CONFIA também foi aberta no dia anterior
# - existe determinado nível de aprendizagem/memória atual
#
# Usa apenas:
# - dailyContext.state
# - dailyContext.daysSincePreviousOpen
# - dailyContext.dailyLearningLevel
#
# NÃO cria:
# - storage
# - state
# - effect
# - timer
# - listener
# - requestAnimationFrame
# - Reactive Engine
# - nova recolha de memória
# - streak
# - recompensa
# - dependência
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
        Path("/tmp/App.tsx.before_fase5c_continuidade_regresso"),

    LOCALES["pt"]:
        Path("/tmp/pt.json.before_fase5c_continuidade_regresso"),

    LOCALES["en"]:
        Path("/tmp/en.json.before_fase5c_continuidade_regresso"),

    LOCALES["es"]:
        Path("/tmp/es.json.before_fase5c_continuidade_regresso"),

    LOCALES["fr"]:
        Path("/tmp/fr.json.before_fase5c_continuidade_regresso"),
}


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — FASE 5C NÃO APLICADA")
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
        fail(f"Não encontrei:\n{path}")

app_original = APP.read_text(
    encoding="utf-8"
)


# ============================================================
# 2. VALIDAR 5B + CONTEXTO DIÁRIO
# ============================================================

required = [
    "CONFIA 5B — SEMENTE DE AMANHÃ",
    'dailyContext.state === "first_today"',
    "dailyContext.daysSincePreviousOpen",
    "dailyContext.dailyLearningLevel",
    't("dailyMoment.tomorrow.learnedImpulse")',
    't("dailyMoment.tomorrow.effectiveImpulse")',
    't("dailyMoment.tomorrow.repeatedSignals")',
    't("dailyMoment.tomorrow.early")',
    't("dailyMoment.tomorrow.neutral")',
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

if "CONFIA 5C — CONTINUIDADE DO REGRESSO" in app_original:
    fail(
        "A Fase 5C já parece estar aplicada."
    )

if "dailyMoment.continuityReturn." in app_original:
    fail(
        "Já existem referências continuityReturn."
    )


# ============================================================
# 4. LOCALIZAR EXATAMENTE A 5B
#
# Vamos inserir a continuidade imediatamente ANTES
# da Semente de Amanhã.
#
# Assim a hierarquia fica:
#
# mensagem principal
# ↓
# continuidade do regresso
# ↓
# semente para amanhã
# ↓
# ação inteligente
# ============================================================

anchor = '''        {/* ======================================================
            CONFIA 5B — SEMENTE DE AMANHÃ'''

if app_original.count(anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "o início da Fase 5B."
    )


# ============================================================
# 5. BLOCO 5C
#
# Só aparece quando:
#
# - é first_today
# - a última abertura foi há exatamente 1 dia
#
# Isto NÃO é streak.
#
# Não contamos dias consecutivos.
# Não premiamos.
# Não penalizamos se falhar.
# ============================================================

continuity_block = '''        {/* ======================================================
            CONFIA 5C — CONTINUIDADE DO REGRESSO

            Reconhece apenas continuidade temporal confirmada:
            a CONFIA foi aberta no dia imediatamente anterior.

            Não atribui nenhum registo específico a "ontem".
            Não cria streak nem recompensa.
        ====================================================== */}
        {dailyContext.state === "first_today" &&
         dailyContext.daysSincePreviousOpen === 1 && (
          <div className="mt-3 rounded-2xl border border-[#E5A88B]/15 bg-gradient-to-r from-[#FFF9F5]/80 to-white/70 px-3.5 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#C97B5E]">
              {t("dailyMoment.continuityReturn.eyebrow")}
            </p>

            <p className="mt-1 text-[10px] font-semibold leading-relaxed text-[#806D65]">
              {dailyContext.dailyLearningLevel === "learned_impulse"
                ? t("dailyMoment.continuityReturn.learnedImpulse")
                : dailyContext.dailyLearningLevel === "effective_impulse"
                  ? t("dailyMoment.continuityReturn.effectiveImpulse")
                  : dailyContext.dailyLearningLevel === "repeated_signals"
                    ? t("dailyMoment.continuityReturn.repeatedSignals")
                    : dailyContext.dailyLearningLevel === "early_learning"
                      ? t("dailyMoment.continuityReturn.early")
                      : t("dailyMoment.continuityReturn.neutral")}
            </p>
          </div>
        )}

'''

app_updated = app_original.replace(
    anchor,
    continuity_block + anchor,
    1,
)


# ============================================================
# 6. VALIDAR INSERÇÃO
# ============================================================

new_markers = [
    "CONFIA 5C — CONTINUIDADE DO REGRESSO",
    "dailyContext.daysSincePreviousOpen === 1",
    't("dailyMoment.continuityReturn.eyebrow")',
    't("dailyMoment.continuityReturn.learnedImpulse")',
    't("dailyMoment.continuityReturn.effectiveImpulse")',
    't("dailyMoment.continuityReturn.repeatedSignals")',
    't("dailyMoment.continuityReturn.early")',
    't("dailyMoment.continuityReturn.neutral")',
]

for marker in new_markers:
    if marker not in app_updated:
        fail(
            f"Bloco 5C incompleto:\n{marker}"
        )

if app_updated.count(
    "CONFIA 5C — CONTINUIDADE DO REGRESSO"
) != 1:
    fail(
        "Marcador 5C não ficou único."
    )


# ============================================================
# 7. GARANTIR ORDEM
# ============================================================

pos_5c = app_updated.find(
    "CONFIA 5C — CONTINUIDADE DO REGRESSO"
)

pos_5b = app_updated.find(
    "CONFIA 5B — SEMENTE DE AMANHÃ"
)

pos_3d = app_updated.find(
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA"
)

if not (
    pos_5c < pos_5b < pos_3d
):
    fail(
        "Ordem visual incorreta.\n\n"
        "Esperado:\n"
        "5C → 5B → 3D"
    )


# ============================================================
# 8. PERFORMANCE
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
            f"A Fase 5C alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 9. NÃO CRIAR STREAK / RECOMPENSA
# ============================================================

for token in [
    "dailyStreak",
    "openStreak",
    "consecutiveOpenDays",
    "dailyReward",
    "lastDailyReward",
    "openReward",
    "continuityReward",
]:
    if (
        app_updated.count(token)
        != app_original.count(token)
    ):
        fail(
            "Foi introduzido mecanismo indesejado:\n"
            f"{token}"
        )


# ============================================================
# 10. NÃO FAZER AFIRMAÇÕES TEMPORAIS NÃO SUPORTADAS
#
# O novo JSX não deve usar "yesterday"/"ontem"/etc.
# ============================================================

new_region_start = app_updated.find(
    "CONFIA 5C — CONTINUIDADE DO REGRESSO"
)

new_region_end = app_updated.find(
    "CONFIA 5B — SEMENTE DE AMANHÃ",
    new_region_start,
)

new_region = app_updated[
    new_region_start:new_region_end
]

for forbidden in [
    "ontem",
    "yesterday",
    "ayer",
    "hier",
]:
    if forbidden.lower() in new_region.lower():
        fail(
            "A 5C introduziu uma afirmação temporal "
            "demasiado específica:\n"
            f"{forbidden}"
        )


# ============================================================
# 11. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "eyebrow":
            "Continuamos por aqui",

        "learnedImpulse":
            "Voltaste e a CONFIA já tem alguma aprendizagem para manter em contexto. Continuamos a observar o que realmente se confirma com o tempo.",

        "effectiveImpulse":
            "Continuamos com uma experiência anterior que pareceu ajudar, sem assumir que funcionará sempre da mesma forma.",

        "repeatedSignals":
            "Continuamos atentos aos sinais que têm aparecido mais do que uma vez, sem os transformar já numa conclusão.",

        "early":
            "Mais um dia dá à CONFIA um pouco mais de contexto para conhecer o teu ritmo.",

        "neutral":
            "Continuamos de onde ficámos, sem precisares de começar tudo outra vez.",
    },

    "en": {
        "eyebrow":
            "We continue from here",

        "learnedImpulse":
            "You came back and CONFIA already has some learning to keep in context. We will keep noticing what truly holds over time.",

        "effectiveImpulse":
            "We continue with a previous experience that seemed to help, without assuming it will always work in the same way.",

        "repeatedSignals":
            "We keep noticing the signals that have appeared more than once, without turning them into a conclusion yet.",

        "early":
            "Another day gives CONFIA a little more context to get to know your rhythm.",

        "neutral":
            "We continue from where we left off, without you having to start all over again.",
    },

    "es": {
        "eyebrow":
            "Continuamos desde aquí",

        "learnedImpulse":
            "Has vuelto y CONFIA ya tiene algo de aprendizaje que mantener en contexto. Seguiremos observando lo que realmente se confirma con el tiempo.",

        "effectiveImpulse":
            "Continuamos con una experiencia anterior que pareció ayudar, sin asumir que siempre funcionará de la misma manera.",

        "repeatedSignals":
            "Seguimos atentos a las señales que han aparecido más de una vez, sin convertirlas todavía en una conclusión.",

        "early":
            "Un día más le da a CONFIA un poco más de contexto para conocer tu ritmo.",

        "neutral":
            "Continuamos desde donde lo dejamos, sin que tengas que empezar todo de nuevo.",
    },

    "fr": {
        "eyebrow":
            "Nous continuons d’ici",

        "learnedImpulse":
            "Tu es revenu et CONFIA dispose déjà de quelques apprentissages à garder en contexte. Nous continuerons à observer ce qui se confirme réellement avec le temps.",

        "effectiveImpulse":
            "Nous continuons avec une expérience précédente qui semblait aider, sans supposer qu’elle fonctionnera toujours de la même manière.",

        "repeatedSignals":
            "Nous restons attentifs aux signaux apparus plus d’une fois, sans encore les transformer en conclusion.",

        "early":
            "Un jour de plus donne à CONFIA un peu plus de contexte pour apprendre à connaître ton rythme.",

        "neutral":
            "Nous continuons là où nous nous étions arrêtés, sans que tu aies à tout recommencer.",
    },
}

locale_updated = {}


# ============================================================
# 12. INSERIR TRADUÇÕES
# ============================================================

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

    # 5B deve existir.
    if "tomorrow" not in daily_moment:
        fail(
            f"{language}: dailyMoment.tomorrow "
            "da 5B não existe."
        )

    if "continuityReturn" in daily_moment:
        fail(
            f"{language}: continuityReturn já existe."
        )

    daily_moment[
        "continuityReturn"
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
# 13. PARIDADE
# ============================================================

expected_keys = {
    "eyebrow",
    "learnedImpulse",
    "effectiveImpulse",
    "repeatedSignals",
    "early",
    "neutral",
}

for language in LOCALES:

    data = json.loads(
        locale_updated[language]
    )

    block = (
        data
        .get("dailyMoment", {})
        .get("continuityReturn")
    )

    if not isinstance(
        block,
        dict
    ):
        fail(
            f"{language}: continuityReturn ausente."
        )

    if set(block.keys()) != expected_keys:
        fail(
            f"{language}: chaves incorretas."
        )

    for key in expected_keys:

        value = block.get(key)

        if (
            not isinstance(value, str)
            or not value.strip()
        ):
            fail(
                f"{language}: tradução vazia — {key}"
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

    if written_app.count(
        "CONFIA 5C — CONTINUIDADE DO REGRESSO"
    ) != 1:
        raise RuntimeError(
            "Marcador 5C inválido."
        )

    if (
        "dailyContext.daysSincePreviousOpen === 1"
        not in written_app
    ):
        raise RuntimeError(
            "Condição temporal da 5C ausente."
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
        written_5c <
        written_5b <
        written_3d
    ):
        raise RuntimeError(
            "Ordem 5C → 5B → 3D inválida."
        )

    for language, path in LOCALES.items():

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        block = (
            data
            .get("dailyMoment", {})
            .get("continuityReturn")
        )

        if (
            not isinstance(block, dict)
            or set(block.keys()) != expected_keys
        ):
            raise RuntimeError(
                f"Traduções inválidas: {language}"
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
    "CONFIA — FASE 5C / CONTINUIDADE DO REGRESSO"
)
print("=" * 78)
print()

print("✓ Ciclo da 5B fechado")
print("✓ Reconhece regresso no dia seguinte")
print("✓ Usa daysSincePreviousOpen existente")
print("✓ Usa dailyLearningLevel existente")
print("✓ learned_impulse")
print("✓ effective_impulse")
print("✓ repeated_signals")
print("✓ early_learning")
print("✓ neutral")
print("✓ Não afirma que um registo específico foi ontem")
print("✓ Nenhuma streak")
print("✓ Nenhuma recompensa por abrir")
print("✓ Nenhuma penalização por ausência")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma chamada nova ao Reactive Engine")
print("✓ Nenhuma recolha nova de memória")
print("✓ Nenhuma dependência")
print("✓ PT / EN / ES / FR")
print()
print("Arquitetura:")
print()
print("DIA N")
print("  ↓")
print("SEMENTE DE AMANHÃ")
print("  ↓")
print("DIA N+1")
print("  ↓")
print("CONTINUIDADE DO REGRESSO")
print("  ↓")
print("MOMENTO DE HOJE")
print()
print("Backups:")
print(
    "  /tmp/App.tsx.before_fase5c_continuidade_regresso"
)
print(
    "  /tmp/pt.json.before_fase5c_continuidade_regresso"
)
print(
    "  /tmp/en.json.before_fase5c_continuidade_regresso"
)
print(
    "  /tmp/es.json.before_fase5c_continuidade_regresso"
)
print(
    "  /tmp/fr.json.before_fase5c_continuidade_regresso"
)
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
