from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — FASE 3
# 3C.1 — MOMENTO DE HOJE / CAMADA VISUAL
#
# Objetivo:
#
# Tornar visível o contexto diário criado em 3A + 3B.
#
# Hierarquia:
#
# HomeWorld
#    ↓
# Momento de Hoje
#    ↓
# A CONFIA percebeu / memória
#    ↓
# Para ti agora
#
# REGRAS:
#
# - não mostrar no first_contact, porque a Principal já possui
#   uma experiência específica para esse estado;
# - não criar ação/botão ainda;
# - não duplicar o Reactive Engine;
# - não criar storage;
# - não criar state/effect;
# - não criar timers/listeners;
# - PT / EN / ES / FR;
# - visual premium leve;
# - apenas CSS/Tailwind + ícone já disponível.
#
# ALTERA:
# src/App.tsx
# src/locales/pt.json
# src/locales/en.json
# src/locales/es.json
# src/locales/fr.json
#
# BACKUPS:
# /tmp/App.tsx.before_fase3c1_momento_hoje
# /tmp/pt.json.before_fase3c1_momento_hoje
# /tmp/en.json.before_fase3c1_momento_hoje
# /tmp/es.json.before_fase3c1_momento_hoje
# /tmp/fr.json.before_fase3c1_momento_hoje
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
        "/tmp/App.tsx.before_fase3c1_momento_hoje"
    ),
    LOCALES["pt"]: Path(
        "/tmp/pt.json.before_fase3c1_momento_hoje"
    ),
    LOCALES["en"]: Path(
        "/tmp/en.json.before_fase3c1_momento_hoje"
    ),
    LOCALES["es"]: Path(
        "/tmp/es.json.before_fase3c1_momento_hoje"
    ),
    LOCALES["fr"]: Path(
        "/tmp/fr.json.before_fase3c1_momento_hoje"
    ),
}


def fail(message: str):
    print()
    print("=" * 78)
    print("ERRO — FASE 3C.1 NÃO APLICADA")
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
# 2. VALIDAR 3A + 3B
# ============================================================

required_architecture = [
    "CONFIA 3A — ESTADO DIÁRIO",
    "const isFirstAppOpenToday",
    "const daysSincePreviousAppOpen",
    "CONFIA 3B — CONTEXTO DIÁRIO",
    "type DailyContextState",
    "const dailyContext =",
    '"first_contact"',
    '"return_after_absence"',
    '"first_today"',
    '"already_here_today"',
]

missing = [
    marker
    for marker in required_architecture
    if marker not in app_original
]

if missing:
    fail(
        "A arquitetura 3A/3B não está completa.\n\n"
        "Falta:\n"
        + "\n".join(missing)
    )


# ============================================================
# 3. IMPEDIR DUPLICAÇÃO
# ============================================================

if (
    "CONFIA 3C.1 — MOMENTO DE HOJE"
    in app_original
):
    fail(
        "A Fase 3C.1 já parece estar aplicada."
    )


# ============================================================
# 4. VALIDAR ESTRUTURA VISUAL
# ============================================================

home_world = '''<HomeWorld
  avatar={avatar}
  avatarCelebrating={avatarCelebrating}
  avatarMemoryMessage={avatarMemoryMessage}
  morningRating={morningRating}
  afternoonRating={afternoonRating}
  handlePetAvatar={handlePetAvatar}
/>'''

if app_original.count(home_world) != 1:
    fail(
        "Não encontrei exatamente uma instância "
        "do HomeWorld na estrutura esperada."
    )


after_world_anchor = '''/>

{homeScreen === "home" && (
  <>'''

if app_original.count(after_world_anchor) != 1:
    fail(
        "Não encontrei a âncora imediatamente "
        "a seguir ao HomeWorld."
    )


# ============================================================
# 5. CONTAGENS DE SEGURANÇA
# ============================================================

before_counts = {
    "useState":
        app_original.count("useState("),

    "useEffect":
        app_original.count("useEffect("),

    "getItem":
        app_original.count("localStorage.getItem"),

    "setItem":
        app_original.count("localStorage.setItem"),

    "analyze":
        app_original.count("analyzeReactiveState("),

    "record":
        app_original.count("recordReactiveResponse("),

    "collect":
        app_original.count("collectReactiveRecentMemory("),

    "setTimeout":
        app_original.count("setTimeout("),

    "setInterval":
        app_original.count("setInterval("),

    "requestAnimationFrame":
        app_original.count("requestAnimationFrame"),
}


# ============================================================
# 6. MOMENTO DE HOJE
#
# Não existe botão nesta fase.
#
# O conteúdo muda exclusivamente com dailyContext.state.
#
# first_contact fica excluído porque já existe:
# firstContactInsight.
# ============================================================

daily_moment = r'''
/>

{/* ======================================================
    CONFIA 3C.1 — MOMENTO DE HOJE

    Primeira manifestação visual do Ritual Diário.

    Não substitui:
    - A CONFIA percebeu;
    - Para ti agora;
    - primeiro contacto;
    - Reactive Engine.

    Apenas dá contexto à chegada do utilizador naquele dia.
====================================================== */}
{dailyContext &&
 dailyContext.state !== "first_contact" && (
  <section
    className="relative mt-4 overflow-hidden rounded-[30px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF8F3] via-white to-[#FFFDFB] px-5 py-4 shadow-[0_12px_32px_rgba(92,64,52,0.055)]"
    aria-label={t("dailyMoment.eyebrow")}
  >
    {/* detalhe atmosférico — CSS puro */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#F8E4D8]/35 blur-2xl"
    />

    <div
      aria-hidden="true"
      className="absolute left-0 top-5 h-14 w-[3px] rounded-r-full bg-gradient-to-b from-[#E5A88B]/70 to-[#E5A88B]/15"
    />

    <div className="relative flex items-start gap-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/20 bg-white/90 shadow-sm">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {t("dailyMoment.eyebrow")}
        </p>

        <h2 className="mt-1 text-[15px] font-black leading-snug text-[#4E3B36]">
          {dailyContext.state === "return_after_absence"
            ? t("dailyMoment.return.title")
            : dailyContext.state === "first_today"
              ? t("dailyMoment.firstToday.title")
              : t("dailyMoment.continueToday.title")}
        </h2>

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-[#8A6A5D]">
          {dailyContext.state === "return_after_absence"
            ? t("dailyMoment.return.text")
            : dailyContext.state === "first_today"
              ? dailyContext.isEarlyLearning
                ? t("dailyMoment.firstToday.learningText")
                : dailyContext.hasImpulseLearning
                  ? t("dailyMoment.firstToday.memoryText")
                  : dailyContext.hasContinuityMemory
                    ? t("dailyMoment.firstToday.continuityText")
                    : t("dailyMoment.firstToday.text")
              : t("dailyMoment.continueToday.text")}
        </p>

        {dailyContext.state === "return_after_absence" &&
         typeof dailyContext.daysSincePreviousOpen === "number" &&
         dailyContext.daysSincePreviousOpen >= 2 && (
          <div className="mt-3 inline-flex items-center rounded-full border border-[#E5A88B]/15 bg-white/80 px-3 py-1.5">
            <span className="text-[9px] font-bold text-[#9A7567]">
              {t("dailyMoment.return.days", {
                count: dailyContext.daysSincePreviousOpen,
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  </section>
)}

{homeScreen === "home" && (
  <>'''


app_updated = app_original.replace(
    after_world_anchor,
    daily_moment,
    1,
)


# ============================================================
# 7. VALIDAR BLOCO VISUAL
# ============================================================

start_marker = (
    "CONFIA 3C.1 — MOMENTO DE HOJE"
)

start = app_updated.find(
    start_marker
)

end = app_updated.find(
    '{homeScreen === "home" && (',
    start,
)

if start == -1 or end == -1:
    fail(
        "Não consegui isolar o Momento de Hoje."
    )

visual_block = app_updated[
    start:end
]


required_visual = [
    'dailyContext.state !== "first_contact"',
    '"return_after_absence"',
    '"first_today"',
    "dailyContext.isEarlyLearning",
    "dailyContext.hasImpulseLearning",
    "dailyContext.hasContinuityMemory",
    "dailyContext.daysSincePreviousOpen",
    't("dailyMoment.eyebrow")',
    't("dailyMoment.return.title")',
    't("dailyMoment.firstToday.title")',
    't("dailyMoment.continueToday.title")',
]

for marker in required_visual:
    if marker not in visual_block:
        fail(
            "Falta elemento visual obrigatório:\n"
            f"{marker}"
        )


# ============================================================
# 8. NÃO CRIAR AÇÃO AINDA
# ============================================================

for forbidden in [
    "onClick=",
    "<button",
    "changeTab(",
    "setCurrentTab(",
    "setHomeScreen(",
]:
    if forbidden in visual_block:
        fail(
            "A 3C.1 não deve criar ação ainda:\n"
            f"{forbidden}"
        )


# ============================================================
# 9. NÃO CRIAR LÓGICA PESADA
# ============================================================

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
    "addEventListener",
    "ResizeObserver",
    "fetch(",
]:
    if forbidden in visual_block:
        fail(
            "Operação não permitida no Momento de Hoje:\n"
            f"{forbidden}"
        )


# ============================================================
# 10. CONTAGENS GLOBAIS
# ============================================================

after_counts = {
    "useState":
        app_updated.count("useState("),

    "useEffect":
        app_updated.count("useEffect("),

    "getItem":
        app_updated.count("localStorage.getItem"),

    "setItem":
        app_updated.count("localStorage.setItem"),

    "analyze":
        app_updated.count("analyzeReactiveState("),

    "record":
        app_updated.count("recordReactiveResponse("),

    "collect":
        app_updated.count("collectReactiveRecentMemory("),

    "setTimeout":
        app_updated.count("setTimeout("),

    "setInterval":
        app_updated.count("setInterval("),

    "requestAnimationFrame":
        app_updated.count("requestAnimationFrame"),
}

for key in before_counts:
    if before_counts[key] != after_counts[key]:
        fail(
            f"A contagem global de {key} mudou.\n\n"
            f"Antes: {before_counts[key]}\n"
            f"Depois: {after_counts[key]}"
        )


# ============================================================
# 11. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "eyebrow": "Hoje",
        "return": {
            "title": "Bom ter-te de volta",
            "text": "Não há nada para recuperar. Podemos simplesmente começar pelo momento em que estás agora.",
            "days_one": "Passou {{count}} dia desde a última vez que abriste a CONFIA",
            "days_other": "Passaram {{count}} dias desde a última vez que abriste a CONFIA"
        },
        "firstToday": {
            "title": "O teu momento de hoje",
            "text": "Um novo dia não precisa de começar com uma grande mudança. Basta perceberes onde estás agora.",
            "learningText": "Ainda estamos a conhecer o teu ritmo. Cada pequeno registo ajuda a CONFIA a tornar-se mais útil para ti.",
            "memoryText": "Já há experiências anteriores que podem ajudar a orientar o teu dia sem começares sempre do zero.",
            "continuityText": "Já existem alguns sinais de continuidade. Hoje podemos acrescentar apenas mais um pequeno passo."
        },
        "continueToday": {
            "title": "Continuamos por aqui",
            "text": "Já passaste pela CONFIA hoje. Não precisas de recomeçar — continuamos a partir daqui."
        }
    },

    "en": {
        "eyebrow": "Today",
        "return": {
            "title": "Good to have you back",
            "text": "There is nothing to catch up on. We can simply start with where you are right now.",
            "days_one": "It has been {{count}} day since you last opened CONFIA",
            "days_other": "It has been {{count}} days since you last opened CONFIA"
        },
        "firstToday": {
            "title": "Your moment today",
            "text": "A new day does not need to begin with a big change. Simply notice where you are right now.",
            "learningText": "We are still getting to know your rhythm. Each small check-in helps CONFIA become more useful to you.",
            "memoryText": "There are already previous experiences that can help guide today without always starting from zero.",
            "continuityText": "There are already a few signs of continuity. Today, one more small step is enough."
        },
        "continueToday": {
            "title": "We continue from here",
            "text": "You have already been with CONFIA today. There is no need to start again — we continue from here."
        }
    },

    "es": {
        "eyebrow": "Hoy",
        "return": {
            "title": "Qué bueno tenerte de vuelta",
            "text": "No hay nada que recuperar. Podemos simplemente empezar por cómo estás en este momento.",
            "days_one": "Ha pasado {{count}} día desde la última vez que abriste CONFIA",
            "days_other": "Han pasado {{count}} días desde la última vez que abriste CONFIA"
        },
        "firstToday": {
            "title": "Tu momento de hoy",
            "text": "Un nuevo día no necesita empezar con un gran cambio. Basta con percibir cómo estás ahora.",
            "learningText": "Todavía estamos conociendo tu ritmo. Cada pequeño registro ayuda a que CONFIA sea más útil para ti.",
            "memoryText": "Ya hay experiencias anteriores que pueden ayudar a orientar tu día sin empezar siempre desde cero.",
            "continuityText": "Ya existen algunas señales de continuidad. Hoy basta con añadir un pequeño paso más."
        },
        "continueToday": {
            "title": "Seguimos desde aquí",
            "text": "Ya has pasado por CONFIA hoy. No necesitas volver a empezar: seguimos desde aquí."
        }
    },

    "fr": {
        "eyebrow": "Aujourd’hui",
        "return": {
            "title": "Heureux de te retrouver",
            "text": "Il n’y a rien à rattraper. Nous pouvons simplement commencer par là où tu en es maintenant.",
            "days_one": "{{count}} jour s’est écoulé depuis ta dernière ouverture de CONFIA",
            "days_other": "{{count}} jours se sont écoulés depuis ta dernière ouverture de CONFIA"
        },
        "firstToday": {
            "title": "Ton moment d’aujourd’hui",
            "text": "Une nouvelle journée n’a pas besoin de commencer par un grand changement. Il suffit de voir où tu en es maintenant.",
            "learningText": "Nous apprenons encore à connaître ton rythme. Chaque petit repère aide CONFIA à devenir plus utile pour toi.",
            "memoryText": "Certaines expériences précédentes peuvent déjà aider à orienter ta journée sans repartir de zéro.",
            "continuityText": "Quelques signes de continuité apparaissent déjà. Aujourd’hui, un petit pas de plus suffit."
        },
        "continueToday": {
            "title": "On continue à partir d’ici",
            "text": "Tu es déjà passé par CONFIA aujourd’hui. Pas besoin de recommencer — on continue à partir d’ici."
        }
    },
}


# ============================================================
# 12. CARREGAR E VALIDAR JSON
# ============================================================

locale_original_text = {}
locale_data = {}

for language, path in LOCALES.items():
    text = path.read_text(
        encoding="utf-8"
    )

    locale_original_text[language] = text

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        fail(
            f"{path} já contém JSON inválido:\n{exc}"
        )

    if "dailyMoment" in data:
        fail(
            f"A chave dailyMoment já existe em {path}."
        )

    locale_data[language] = data


# ============================================================
# 13. ADICIONAR CHAVES
# ============================================================

for language in LOCALES:
    locale_data[language]["dailyMoment"] = (
        translations[language]
    )


# ============================================================
# 14. SERIALIZAR
#
# JSON válido e Unicode preservado.
# ============================================================

locale_updated_text = {}

for language, data in locale_data.items():
    locale_updated_text[language] = (
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        )
        + "\n"
    )


# ============================================================
# 15. VALIDAR PARIDADE DOS 4 IDIOMAS
# ============================================================

def flatten_keys(value, prefix=""):
    result = set()

    if isinstance(value, dict):
        for key, child in value.items():
            child_prefix = (
                f"{prefix}.{key}"
                if prefix
                else key
            )

            result.add(child_prefix)

            result |= flatten_keys(
                child,
                child_prefix
            )

    return result


reference_keys = flatten_keys(
    translations["pt"]
)

for language in ["en", "es", "fr"]:
    current_keys = flatten_keys(
        translations[language]
    )

    if current_keys != reference_keys:
        fail(
            f"As traduções de {language} "
            "não têm a mesma estrutura de PT."
        )


# ============================================================
# 16. VALIDAR CHAVES USADAS NA UI
# ============================================================

required_translation_paths = [
    "dailyMoment.eyebrow",
    "dailyMoment.return.title",
    "dailyMoment.return.text",
    "dailyMoment.return.days",
    "dailyMoment.firstToday.title",
    "dailyMoment.firstToday.text",
    "dailyMoment.firstToday.learningText",
    "dailyMoment.firstToday.memoryText",
    "dailyMoment.firstToday.continuityText",
    "dailyMoment.continueToday.title",
    "dailyMoment.continueToday.text",
]

# i18next pluraliza "days" através de days_one/days_other.
# Todas as restantes devem existir literalmente.

for language, data in locale_data.items():
    dm = data.get("dailyMoment", {})

    required_top = [
        "eyebrow",
        "return",
        "firstToday",
        "continueToday",
    ]

    for key in required_top:
        if key not in dm:
            fail(
                f"{language}: falta dailyMoment.{key}"
            )

    for key in [
        "title",
        "text",
        "days_one",
        "days_other",
    ]:
        if key not in dm["return"]:
            fail(
                f"{language}: falta return.{key}"
            )

    for key in [
        "title",
        "text",
        "learningText",
        "memoryText",
        "continuityText",
    ]:
        if key not in dm["firstToday"]:
            fail(
                f"{language}: falta firstToday.{key}"
            )

    for key in [
        "title",
        "text",
    ]:
        if key not in dm["continueToday"]:
            fail(
                f"{language}: falta continueToday.{key}"
            )


# ============================================================
# 17. PRESERVAR ESTRUTURA EXISTENTE
# ============================================================

preserved = [
    "<HomeWorld",
    "homeNowMemory?.kind",
    "isFirstContact &&",
    "reactiveMessageKey &&",
    "homeNowAction &&",
    "homeNowContext?.kind",
    "firstContactInsight.",
    "earlyLearningInsight.",
    "reactiveInsightTitle",
    "homeNow.",
]

for marker in preserved:
    if marker not in app_updated:
        fail(
            "Estrutura existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 18. IMPORTS NÃO MUDAM
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
        "A 3C.1 não deveria alterar imports."
    )


# ============================================================
# 19. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 20. ESCREVER TUDO
# ============================================================

APP.write_text(
    app_updated,
    encoding="utf-8"
)

for language, path in LOCALES.items():
    path.write_text(
        locale_updated_text[language],
        encoding="utf-8"
    )


# ============================================================
# 21. VERIFICAÇÃO PÓS-ESCRITA
# ============================================================

try:
    written_app = APP.read_text(
        encoding="utf-8"
    )

    if (
        "CONFIA 3C.1 — MOMENTO DE HOJE"
        not in written_app
    ):
        raise RuntimeError(
            "Bloco visual não encontrado."
        )

    for language, path in LOCALES.items():
        written_locale = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

        if "dailyMoment" not in written_locale:
            raise RuntimeError(
                f"dailyMoment em falta: {language}"
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
# 22. RESULTADO
# ============================================================

print()
print("=" * 78)
print("CONFIA — FASE 3C.1 / MOMENTO DE HOJE")
print("=" * 78)
print()

print("✓ Momento de Hoje adicionado após HomeWorld")
print("✓ HomeWorld continua como entrada emocional")
print("✓ Primeiro contacto não é duplicado")
print("✓ Regresso após ausência tem linguagem própria")
print("✓ Primeira abertura do dia tem linguagem própria")
print("✓ Segunda abertura do dia reconhece continuidade")
print("✓ Early learning respeitado")
print("✓ Aprendizagem do Impulso respeitada")
print("✓ Continuidade respeitada")
print("✓ Nenhuma nova decisão emocional")
print("✓ Nenhuma nova chamada ao Reactive Engine")
print("✓ Nenhum novo storage")
print("✓ Nenhum novo useState")
print("✓ Nenhum novo useEffect")
print("✓ Nenhum timer")
print("✓ Nenhum listener")
print("✓ Nenhum botão ainda")
print("✓ Nenhuma dependência")
print("✓ Visual premium leve")
print("✓ PT")
print("✓ EN")
print("✓ ES")
print("✓ FR")
print()
print("Backups:")
print("  /tmp/App.tsx.before_fase3c1_momento_hoje")
print("  /tmp/pt.json.before_fase3c1_momento_hoje")
print("  /tmp/en.json.before_fase3c1_momento_hoje")
print("  /tmp/es.json.before_fase3c1_momento_hoje")
print("  /tmp/fr.json.before_fase3c1_momento_hoje")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 78)
