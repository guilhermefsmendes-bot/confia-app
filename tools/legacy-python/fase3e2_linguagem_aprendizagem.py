from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 3
# 3E.2 — LINGUAGEM DE APRENDIZAGEM
#
# Objetivo:
#
# Fazer o "Momento de Hoje" comunicar a memória existente
# com um grau de certeza proporcional à evidência.
#
# NÍVEIS:
#
# learned_impulse
#   -> padrão sustentado por múltiplos episódios eficazes
#
# effective_impulse
#   -> uma experiência anterior pareceu ajudar
#
# repeated_signals
#   -> existem sinais repetidos, sem afirmar causalidade
#
# early_learning
#   -> a CONFIA ainda está a conhecer o utilizador
#
# none
#   -> linguagem neutra
#
# REGRAS:
#
# - não criar memória;
# - não criar storage;
# - não chamar Reactive Engine;
# - não recolher memória novamente;
# - não alterar homeNowAction;
# - não alterar navegação;
# - não criar state/effect/timer/listener;
# - não afirmar diagnóstico ou causalidade;
# - PT / EN / ES / FR.
#
# ALTERA:
#   src/App.tsx
#   src/locales/pt.json
#   src/locales/en.json
#   src/locales/es.json
#   src/locales/fr.json
#
# BACKUPS:
#   /tmp/App.tsx.before_fase3e2_linguagem
#   /tmp/pt.json.before_fase3e2_linguagem
#   /tmp/en.json.before_fase3e2_linguagem
#   /tmp/es.json.before_fase3e2_linguagem
#   /tmp/fr.json.before_fase3e2_linguagem
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
    APP: Path(
        "/tmp/App.tsx.before_fase3e2_linguagem"
    ),
    LOCALES["pt"]: Path(
        "/tmp/pt.json.before_fase3e2_linguagem"
    ),
    LOCALES["en"]: Path(
        "/tmp/en.json.before_fase3e2_linguagem"
    ),
    LOCALES["es"]: Path(
        "/tmp/es.json.before_fase3e2_linguagem"
    ),
    LOCALES["fr"]: Path(
        "/tmp/fr.json.before_fase3e2_linguagem"
    ),
}


def fail(message):
    print()
    print("=" * 78)
    print("ERRO — FASE 3E.2 NÃO APLICADA")
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
# 2. VALIDAR ARQUITETURA
# ============================================================

required = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA",
    "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE",
    "dailyLearningLevel,",
    't("dailyMoment.firstToday.title")',
    't("dailyMoment.firstToday.learningText")',
    't("dailyMoment.firstToday.memoryText")',
    't("dailyMoment.firstToday.continuityText")',
]

missing = [
    marker
    for marker in required
    if marker not in app_original
]

if missing:
    fail(
        "Arquitetura esperada incompleta:\n\n"
        + "\n".join(missing)
    )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

if (
    "CONFIA 3E.2 — LINGUAGEM DE APRENDIZAGEM"
    in app_original
):
    fail(
        "A Fase 3E.2 já parece estar aplicada."
    )


# ============================================================
# 4. ISOLAR MOMENTO DE HOJE
# ============================================================

start = app_original.find(
    "CONFIA 3C.1 — MOMENTO DE HOJE"
)

end = app_original.find(
    '{homeScreen === "home" && (\n  <>',
    start,
)

if start == -1 or end == -1:
    fail(
        "Não consegui isolar o Momento de Hoje."
    )

old_block = app_original[start:end]


# ============================================================
# 5. LOCALIZAR TEXTO first_today ATUAL
#
# 3C.1 usa:
#
# isEarlyLearning
# hasImpulseLearning
# hasContinuityMemory
#
# Vamos substituir apenas essa decisão de apresentação
# pelo nível explícito criado na 3E.1.
# ============================================================

old_text = '''              ? dailyContext.isEarlyLearning
                ? t("dailyMoment.firstToday.learningText")
                : dailyContext.hasImpulseLearning
                  ? t("dailyMoment.firstToday.memoryText")
                  : dailyContext.hasContinuityMemory
                    ? t("dailyMoment.firstToday.continuityText")
                    : t("dailyMoment.firstToday.text")'''

if old_block.count(old_text) != 1:
    fail(
        "Não encontrei exatamente uma vez "
        "a decisão textual firstToday da 3C.1."
    )


new_text = '''              ? (
                  <>
                    {/* CONFIA 3E.2 — LINGUAGEM DE APRENDIZAGEM */}
                    {dailyContext.dailyLearningLevel === "learned_impulse"
                      ? t("dailyMoment.learning.learnedImpulse")
                      : dailyContext.dailyLearningLevel === "effective_impulse"
                        ? t("dailyMoment.learning.effectiveImpulse")
                        : dailyContext.dailyLearningLevel === "repeated_signals"
                          ? t("dailyMoment.learning.repeatedSignals")
                          : dailyContext.dailyLearningLevel === "early_learning"
                            ? t("dailyMoment.learning.early")
                            : t("dailyMoment.learning.neutral")}
                  </>
                )'''

new_block = old_block.replace(
    old_text,
    new_text,
    1,
)

if new_block == old_block:
    fail(
        "A linguagem de aprendizagem não foi inserida."
    )


# ============================================================
# 6. RECONSTRUIR APP
# ============================================================

app_updated = (
    app_original[:start]
    + new_block
    + app_original[end:]
)


# ============================================================
# 7. VALIDAR NOVA LINGUAGEM
# ============================================================

required_new = [
    "CONFIA 3E.2 — LINGUAGEM DE APRENDIZAGEM",
    'dailyContext.dailyLearningLevel === "learned_impulse"',
    'dailyContext.dailyLearningLevel === "effective_impulse"',
    'dailyContext.dailyLearningLevel === "repeated_signals"',
    'dailyContext.dailyLearningLevel === "early_learning"',
    't("dailyMoment.learning.learnedImpulse")',
    't("dailyMoment.learning.effectiveImpulse")',
    't("dailyMoment.learning.repeatedSignals")',
    't("dailyMoment.learning.early")',
    't("dailyMoment.learning.neutral")',
]

for marker in required_new:
    if marker not in app_updated:
        fail(
            "Implementação incompleta:\n"
            f"{marker}"
        )


# ============================================================
# 8. GARANTIR QUE NÃO CRIÁMOS NOVA LÓGICA
# ============================================================

new_start = app_updated.find(
    "CONFIA 3E.2 — LINGUAGEM DE APRENDIZAGEM"
)

new_end = app_updated.find(
    "</>",
    new_start,
)

if new_start == -1 or new_end == -1:
    fail(
        "Não consegui isolar a 3E.2."
    )

region = app_updated[
    new_start:new_end
]

for forbidden in [
    "localStorage.",
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
    "useState(",
    "useEffect(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
    "setCurrentTab(",
    "setHomeScreen(",
    "onClick=",
]:
    if forbidden in region:
        fail(
            "A 3E.2 introduziu lógica proibida:\n"
            f"{forbidden}"
        )


# ============================================================
# 9. CONTAGENS GLOBAIS
# ============================================================

tracked = [
    "useState(",
    "useEffect(",
    "localStorage.getItem",
    "localStorage.setItem",
    "localStorage.removeItem",
    "analyzeReactiveState(",
    "recordReactiveResponse(",
    "collectReactiveRecentMemory(",
    "setTimeout(",
    "setInterval(",
    "requestAnimationFrame",
    "addEventListener(",
    "onClick={handleHomeNowAction}",
]

for token in tracked:
    before = app_original.count(token)
    after = app_updated.count(token)

    if before != after:
        fail(
            f"A contagem de {token} mudou.\n\n"
            f"Antes: {before}\n"
            f"Depois: {after}"
        )


# ============================================================
# 10. TRADUÇÕES
#
# Linguagem deliberadamente prudente.
#
# learnedImpulse:
# múltiplos episódios eficazes já suportam "mais do que
# uma vez".
#
# effectiveImpulse:
# apenas uma experiência -> "pareceu ajudar".
#
# repeatedSignals:
# falamos de repetição, nunca de causa.
#
# early:
# dizemos explicitamente que ainda estamos a aprender.
#
# neutral:
# nenhuma alegação de conhecimento.
# ============================================================

translations = {
    "pt": {
        "learnedImpulse":
            "Já vimos mais do que uma vez que algumas das tuas experiências na CONFIA terminaram mais leves do que começaram. Podemos usar essa aprendizagem sem assumir que todos os dias são iguais.",

        "effectiveImpulse":
            "Há uma experiência anterior em que terminaste mais leve do que começaste. Ainda é cedo para chamar-lhe um padrão, mas vale a pena tê-la em mente.",

        "repeatedSignals":
            "Alguns sinais têm voltado a aparecer nos teus registos. Ainda não precisamos de tirar conclusões — basta continuar a reparar neles.",

        "early":
            "Ainda estamos a conhecer o teu ritmo. Cada pequeno registo ajuda a CONFIA a perceber melhor o que pode ser útil para ti.",

        "neutral":
            "Hoje não precisamos de partir de nenhuma conclusão. Podemos simplesmente começar pelo momento em que estás agora."
    },

    "en": {
        "learnedImpulse":
            "We have seen more than once that some of your experiences with CONFIA ended lighter than they began. We can use that learning without assuming every day is the same.",

        "effectiveImpulse":
            "There was a previous experience where you ended lighter than you began. It is still too early to call it a pattern, but it is worth keeping in mind.",

        "repeatedSignals":
            "Some signals have been appearing again in your records. We do not need to draw conclusions yet — simply keep noticing them.",

        "early":
            "We are still getting to know your rhythm. Each small check-in helps CONFIA understand what may be useful for you.",

        "neutral":
            "Today we do not need to start from any conclusion. We can simply begin with where you are right now."
    },

    "es": {
        "learnedImpulse":
            "Ya hemos visto más de una vez que algunas de tus experiencias en CONFIA terminaron más ligeras de lo que empezaron. Podemos usar ese aprendizaje sin asumir que todos los días son iguales.",

        "effectiveImpulse":
            "Hubo una experiencia anterior en la que terminaste más ligero de lo que empezaste. Aún es pronto para llamarlo un patrón, pero merece la pena tenerlo en cuenta.",

        "repeatedSignals":
            "Algunas señales han vuelto a aparecer en tus registros. Todavía no necesitamos sacar conclusiones: basta con seguir observándolas.",

        "early":
            "Todavía estamos conociendo tu ritmo. Cada pequeño registro ayuda a CONFIA a entender mejor qué puede ser útil para ti.",

        "neutral":
            "Hoy no necesitamos partir de ninguna conclusión. Podemos simplemente empezar por cómo estás ahora."
    },

    "fr": {
        "learnedImpulse":
            "Nous avons vu plus d’une fois que certaines de tes expériences avec CONFIA se sont terminées plus légèrement qu’elles n’avaient commencé. Nous pouvons nous appuyer sur cet apprentissage sans supposer que chaque journée est identique.",

        "effectiveImpulse":
            "Une expérience précédente s’est terminée plus légèrement qu’elle n’avait commencé. Il est encore trop tôt pour parler d’un schéma, mais cela mérite d’être gardé à l’esprit.",

        "repeatedSignals":
            "Certains signaux reviennent dans tes repères. Il n’est pas encore nécessaire d’en tirer des conclusions — continuons simplement à les observer.",

        "early":
            "Nous apprenons encore à connaître ton rythme. Chaque petit repère aide CONFIA à mieux comprendre ce qui peut t’être utile.",

        "neutral":
            "Aujourd’hui, nous n’avons pas besoin de partir d’une conclusion. Nous pouvons simplement commencer par là où tu en es maintenant."
    },
}


# ============================================================
# 11. PREPARAR LOCALES
# ============================================================

locale_updated = {}

for language, path in LOCALES.items():
    text = path.read_text(
        encoding="utf-8"
    )

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        fail(
            f"{path} contém JSON inválido:\n{exc}"
        )

    daily = data.get("dailyMoment")

    if not isinstance(daily, dict):
        fail(
            f"{language}: dailyMoment inválido."
        )

    if "learning" in daily:
        fail(
            f"{language}: dailyMoment.learning "
            "já existe."
        )

    daily["learning"] = (
        translations[language]
    )

    locale_updated[language] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


# ============================================================
# 12. PARIDADE DOS QUATRO IDIOMAS
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

    learning = (
        data
        .get("dailyMoment", {})
        .get("learning", {})
    )

    if set(learning.keys()) != expected_keys:
        fail(
            f"{language}: estrutura de "
            "dailyMoment.learning incorreta."
        )

    for key in expected_keys:
        value = learning[key]

        if (
            not isinstance(value, str)
            or not value.strip()
        ):
            fail(
                f"{language}: texto vazio em {key}."
            )


# ============================================================
# 13. PRESERVAR ARQUITETURA
# ============================================================

preserved = [
    "CONFIA 3A.1 — SNAPSHOT ESTÁVEL",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "CONFIA 3C.1 — MOMENTO DE HOJE",
    "CONFIA 3D — AÇÃO INTELIGENTE DO DIA",
    "CONFIA 3E.1 — CONTINUIDADE INTELIGENTE",
    "const dailyLearningLevel =",
    "dailyLearningLevel,",
    "homeNowMemory",
    "homeNowAction",
    "handleHomeNowAction",
    "dailyContext.suggestedAction",
    "<HomeWorld",
]

for marker in preserved:
    if marker not in app_updated:
        fail(
            "Estrutura existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 14. IMPORTS INTACTOS
# ============================================================

original_imports = "\n".join(
    line
    for line in app_original.splitlines()
    if line.startswith("import ")
)

updated_imports = "\n".join(
    line
    for line in app_updated.splitlines()
    if line.startswith("import ")
)

if original_imports != updated_imports:
    fail(
        "A 3E.2 não deveria alterar imports."
    )


# ============================================================
# 15. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 16. ESCREVER
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
# 17. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:
    written = APP.read_text(
        encoding="utf-8"
    )

    if (
        written.count(
            "CONFIA 3E.2 — LINGUAGEM DE APRENDIZAGEM"
        )
        != 1
    ):
        raise RuntimeError(
            "Marcador 3E.2 inválido."
        )

    for language, path in LOCALES.items():
        data = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        learning = (
            data
            .get("dailyMoment", {})
            .get("learning")
        )

        if not isinstance(learning, dict):
            raise RuntimeError(
                f"Tradução 3E.2 ausente: {language}"
            )

except Exception as exc:
    for source, backup in BACKUPS.items():
        shutil.copy2(
            backup,
            source
        )

    print()
    print("=" * 78)
    print("ERRO PÓS-ESCRITA — ROLLBACK EXECUTADO")
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
# 18. RESULTADO
# ============================================================

print()
print("=" * 78)
print(
    "CONFIA — FASE 3E.2 / LINGUAGEM DE APRENDIZAGEM"
)
print("=" * 78)
print()

print("✓ Momento de Hoje passa a comunicar aprendizagem")
print("✓ learned_impulse usa linguagem de evidência repetida")
print("✓ effective_impulse não é apresentado como padrão")
print("✓ repeated_signals não implica causalidade")
print("✓ early_learning assume aprendizagem inicial")
print("✓ none permanece neutro")
print("✓ dailyLearningLevel reutilizado")
print("✓ Nenhuma memória nova")
print("✓ Nenhum novo storage")
print("✓ Nenhuma nova chamada ao Reactive Engine")
print("✓ Nenhuma nova recolha de memória")
print("✓ homeNowAction preservado")
print("✓ Navegação preservada")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum requestAnimationFrame")
print("✓ Nenhuma dependência")
print("✓ PT")
print("✓ EN")
print("✓ ES")
print("✓ FR")
print()
print("Backups:")
print("  /tmp/App.tsx.before_fase3e2_linguagem")
print("  /tmp/pt.json.before_fase3e2_linguagem")
print("  /tmp/en.json.before_fase3e2_linguagem")
print("  /tmp/es.json.before_fase3e2_linguagem")
print("  /tmp/fr.json.before_fase3e2_linguagem")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
