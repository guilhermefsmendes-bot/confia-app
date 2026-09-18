from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 5B
# SEMENTE DE AMANHÃ
#
# Objetivo:
# criar uma expectativa suave de continuidade no
# Momento de Hoje, usando APENAS o dailyContext existente.
#
# NÃO cria:
# - storage
# - state
# - effect
# - timer
# - listener
# - requestAnimationFrame
# - chamada ao Reactive Engine
# - recolha de memória
# - recompensa
# - streak
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
        Path("/tmp/App.tsx.before_fase5b_semente_amanha"),

    LOCALES["pt"]:
        Path("/tmp/pt.json.before_fase5b_semente_amanha"),

    LOCALES["en"]:
        Path("/tmp/en.json.before_fase5b_semente_amanha"),

    LOCALES["es"]:
        Path("/tmp/es.json.before_fase5b_semente_amanha"),

    LOCALES["fr"]:
        Path("/tmp/fr.json.before_fase5b_semente_amanha"),
}


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — FASE 5B NÃO APLICADA")
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
# 2. VALIDAR ARQUITETURA EXISTENTE
# ============================================================

required = [
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "dailyContext.state",
    'dailyContext.dailyLearningLevel === "learned_impulse"',
    'dailyContext.dailyLearningLevel === "effective_impulse"',
    'dailyContext.dailyLearningLevel === "repeated_signals"',
    'dailyContext.dailyLearningLevel === "early_learning"',
    "dailyContext.suggestedAction",
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

if "CONFIA 5B — SEMENTE DE AMANHÃ" in app_original:
    fail(
        "A Fase 5B já parece estar aplicada."
    )

if "dailyMoment.tomorrow." in app_original:
    fail(
        "Já existem referências dailyMoment.tomorrow "
        "no App.tsx."
    )


# ============================================================
# 4. LOCALIZAR O CTA DO MOMENTO DE HOJE
#
# A Semente de Amanhã deve ficar imediatamente antes
# da ação inteligente já existente.
# ============================================================

anchor = '''{dailyContext.suggestedAction &&
 homeNowAction &&
 dailyContext.suggestedAction === homeNowAction.kind && ('''

if app_original.count(anchor) != 1:
    fail(
        "Não encontrei exatamente uma vez o início "
        "da ação inteligente do Momento de Hoje."
    )


# ============================================================
# 5. BLOCO VISUAL
#
# Só aparece:
# - na primeira abertura do dia
#
# Não aparece:
# - first_contact
# - already_here_today
# - return_after_absence
#
# A ausência nunca é tratada como falha.
# ============================================================

tomorrow_block = '''{/* ======================================================
    CONFIA 5B — SEMENTE DE AMANHÃ

    Continuidade suave.
    Não promete uma descoberta.
    Não cria streak.
    Não recompensa a simples abertura.
    Usa apenas evidência já presente no dailyContext.
====================================================== */}
{dailyContext.state === "first_today" && (
  <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[#E8DDD7]/60 bg-white/60 px-3.5 py-3">
    <div
      aria-hidden="true"
      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9A66F]"
    />

    <p className="text-[10px] font-semibold leading-relaxed text-[#8A746A]">
      {dailyContext.dailyLearningLevel === "learned_impulse"
        ? t("dailyMoment.tomorrow.learnedImpulse")
        : dailyContext.dailyLearningLevel === "effective_impulse"
          ? t("dailyMoment.tomorrow.effectiveImpulse")
          : dailyContext.dailyLearningLevel === "repeated_signals"
            ? t("dailyMoment.tomorrow.repeatedSignals")
            : dailyContext.dailyLearningLevel === "early_learning"
              ? t("dailyMoment.tomorrow.early")
              : t("dailyMoment.tomorrow.neutral")}
    </p>
  </div>
)}

'''

app_updated = app_original.replace(
    anchor,
    tomorrow_block + anchor,
    1,
)


# ============================================================
# 6. VALIDAR APP
# ============================================================

markers = [
    "CONFIA 5B — SEMENTE DE AMANHÃ",
    'dailyContext.state === "first_today"',
    't("dailyMoment.tomorrow.learnedImpulse")',
    't("dailyMoment.tomorrow.effectiveImpulse")',
    't("dailyMoment.tomorrow.repeatedSignals")',
    't("dailyMoment.tomorrow.early")',
    't("dailyMoment.tomorrow.neutral")',
]

for marker in markers:
    if marker not in app_updated:
        fail(
            f"Bloco 5B incompleto:\n{marker}"
        )


# ============================================================
# 7. PERFORMANCE
# ============================================================

performance_tokens = [
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

for token in performance_tokens:

    before = app_original.count(token)
    after = app_updated.count(token)

    if before != after:
        fail(
            f"A Fase 5B alterou a contagem de {token}\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 8. GARANTIR QUE NÃO CRIÁMOS STREAK
# ============================================================

for forbidden in [
    "streak",
    "consecutiveDays",
    "dailyStreak",
    "openCount",
    "lastRewardDate",
    "dailyReward",
]:
    if (
        app_updated.count(forbidden)
        != app_original.count(forbidden)
    ):
        fail(
            f"Foi introduzido mecanismo indesejado:\n"
            f"{forbidden}"
        )


# ============================================================
# 9. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "learnedImpulse":
            "Já há experiências que estamos a começar a reconhecer. Amanhã continuamos a perceber se esta aprendizagem continua a fazer sentido para ti.",

        "effectiveImpulse":
            "Há algo que te ajudou numa experiência anterior. Amanhã podemos continuar a perceber se também faz sentido noutros momentos.",

        "repeatedSignals":
            "Alguns sinais começaram a repetir-se. Amanhã continuamos a reparar neles, sem tirar conclusões antes do tempo.",

        "early":
            "A CONFIA ainda está a conhecer o teu ritmo. Amanhã haverá mais um pouco de contexto para continuarmos.",

        "neutral":
            "Hoje começámos por aqui. Amanhã continuamos, com aquilo que o teu dia trouxer.",
    },

    "en": {
        "learnedImpulse":
            "There are experiences we are beginning to recognise. Tomorrow we can keep seeing whether this learning still makes sense for you.",

        "effectiveImpulse":
            "Something helped you in a previous experience. Tomorrow we can keep noticing whether it also makes sense in other moments.",

        "repeatedSignals":
            "Some signals have started to repeat. Tomorrow we can keep noticing them without drawing conclusions too soon.",

        "early":
            "CONFIA is still getting to know your rhythm. Tomorrow there will be a little more context to continue from.",

        "neutral":
            "This is where we started today. Tomorrow we continue with whatever your day brings.",
    },

    "es": {
        "learnedImpulse":
            "Hay experiencias que estamos empezando a reconocer. Mañana seguiremos viendo si este aprendizaje sigue teniendo sentido para ti.",

        "effectiveImpulse":
            "Hubo algo que te ayudó en una experiencia anterior. Mañana podemos seguir observando si también tiene sentido en otros momentos.",

        "repeatedSignals":
            "Algunas señales han empezado a repetirse. Mañana seguiremos observándolas sin sacar conclusiones demasiado pronto.",

        "early":
            "CONFIA todavía está conociendo tu ritmo. Mañana habrá un poco más de contexto para continuar.",

        "neutral":
            "Hoy empezamos por aquí. Mañana continuamos con lo que traiga tu día.",
    },

    "fr": {
        "learnedImpulse":
            "Certaines expériences commencent à devenir reconnaissables. Demain, nous continuerons à voir si cet apprentissage reste pertinent pour toi.",

        "effectiveImpulse":
            "Quelque chose t’a aidé lors d’une expérience précédente. Demain, nous pourrons continuer à voir si cela a aussi du sens à d’autres moments.",

        "repeatedSignals":
            "Certains signaux ont commencé à se répéter. Demain, nous continuerons à les observer sans tirer de conclusions trop vite.",

        "early":
            "CONFIA apprend encore à connaître ton rythme. Demain, il y aura un peu plus de contexte pour continuer.",

        "neutral":
            "C’est ici que nous avons commencé aujourd’hui. Demain, nous continuerons avec ce que ta journée apportera.",
    },
}

locale_updated = {}


# ============================================================
# 10. INSERIR NO dailyMoment EXISTENTE
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

    if "tomorrow" in daily_moment:
        fail(
            f"{language}: dailyMoment.tomorrow já existe."
        )

    daily_moment["tomorrow"] = translations[
        language
    ]

    locale_updated[language] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


# ============================================================
# 11. PARIDADE DOS 4 IDIOMAS
# ============================================================

expected_keys = {
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
        .get("tomorrow")
    )

    if not isinstance(block, dict):
        fail(
            f"{language}: tomorrow ausente."
        )

    if set(block.keys()) != expected_keys:
        fail(
            f"{language}: chaves tomorrow incorretas."
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
# 12. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 13. ESCREVER
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
# 14. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:

    written_app = APP.read_text(
        encoding="utf-8"
    )

    if (
        written_app.count(
            "CONFIA 5B — SEMENTE DE AMANHÃ"
        )
        != 1
    ):
        raise RuntimeError(
            "Marcador 5B inválido."
        )

    if (
        written_app.count(
            'dailyContext.state === "first_today"'
        )
        < 1
    ):
        raise RuntimeError(
            "Condição first_today ausente."
        )

    for language, path in LOCALES.items():

        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        tomorrow = (
            data
            .get("dailyMoment", {})
            .get("tomorrow")
        )

        if (
            not isinstance(tomorrow, dict)
            or set(tomorrow.keys())
            != expected_keys
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
# 15. RESULTADO
# ============================================================

print()
print("=" * 78)
print(
    "CONFIA — FASE 5B / SEMENTE DE AMANHÃ"
)
print("=" * 78)
print()

print("✓ Continuidade para amanhã")
print("✓ Apenas na primeira abertura do dia")
print("✓ Usa dailyLearningLevel existente")
print("✓ learned_impulse")
print("✓ effective_impulse")
print("✓ repeated_signals")
print("✓ early_learning")
print("✓ neutral")
print("✓ Nenhuma promessa artificial")
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
print("Backups:")
print("  /tmp/App.tsx.before_fase5b_semente_amanha")
print("  /tmp/pt.json.before_fase5b_semente_amanha")
print("  /tmp/en.json.before_fase5b_semente_amanha")
print("  /tmp/es.json.before_fase5b_semente_amanha")
print("  /tmp/fr.json.before_fase5b_semente_amanha")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
