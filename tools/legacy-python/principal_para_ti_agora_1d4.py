from pathlib import Path
import json
import shutil
import sys


APP = Path("src/App.tsx")
LOCALES = {
    lang: Path(f"src/locales/{lang}.json")
    for lang in ("pt", "en", "es", "fr")
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


# ============================================================
# 1. LER E VALIDAR TUDO ANTES DE ESCREVER
# ============================================================

if not APP.exists():
    fail("src/App.tsx não encontrado.")

app = APP.read_text(encoding="utf-8")

locale_data = {}

for lang, path in LOCALES.items():
    if not path.exists():
        fail(f"{path} não encontrado.")

    try:
        with path.open("r", encoding="utf-8") as f:
            locale_data[lang] = json.load(f)
    except Exception as e:
        fail(f"{lang}.json inválido: {e}")


required_app = [
    "analyzeReactiveState",
    "const changeTab = (tab:number) => {",
    'setHomeScreen("home");',
    "setCurrentTab(tab);",
    "const [showDayRatingPanel, setShowDayRatingPanel] = useState(false);",
    'setHomeScreen("patterns")',
    'setHomeScreen("progress")',
    "completedObjectivesCount",
    "{/* O teu espaço — navegação secundária premium */}",
]

for fragment in required_app:
    if fragment not in app:
        fail(f"estrutura App.tsx inesperada: {fragment}")


if "homeNowAction" in app:
    fail("A 1D.4 parece já estar aplicada.")


# ============================================================
# 2. CRIAR DECISÃO "PARA TI AGORA"
#
# Não altera o Reactive Engine.
# Apenas traduz a intenção que ele já escolheu
# numa ação existente da interface.
# ============================================================

anchor_state = '''const [showDayRatingPanel, setShowDayRatingPanel] = useState(false);'''

action_logic = '''const [showDayRatingPanel, setShowDayRatingPanel] = useState(false);

/**
 * 1D.4 — PARA TI AGORA
 *
 * O Reactive Engine continua a decidir situação + intenção.
 * A Home limita-se a transformar essa intenção numa ação
 * já existente na aplicação.
 *
 * Não existe storage, listener ou motor paralelo.
 */
const homeNowAction = (() => {
  if (currentTab !== 0 || homeScreen !== "home") {
    return null;
  }

  const result = analyzeReactiveState({
    source: "general",
  });

  const intent = result?.intent;

  if (!intent) {
    return null;
  }

  switch (intent) {
    // Regulação / momento difícil
    case "calm":
    case "ground":
    case "encourage_regulation":
    case "support_difficult_moment":
    case "gentle_check":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulse.title",
        textKey: "homeNow.impulse.text",
        actionKey: "homeNow.impulse.action",
      };

    // Aprendizagem a partir do Impulso
    case "reinforce_impulse":
    case "review_impulse":
    case "reinforce_effective_strategy":
      return {
        kind: "impulse" as const,
        titleKey: "homeNow.impulseMemory.title",
        textKey: "homeNow.impulseMemory.text",
        actionKey: "homeNow.impulseMemory.action",
      };

    // Padrões / reflexão
    case "connect_pattern":
    case "invite_reflection":
    case "explore":
    case "reflect":
    case "clarify":
      return {
        kind: "patterns" as const,
        titleKey: "homeNow.patterns.title",
        textKey: "homeNow.patterns.text",
        actionKey: "homeNow.patterns.action",
      };

    // Objetivos
    case "celebrate_objective":
    case "redirect_objective":
      return {
        kind: "objectives" as const,
        titleKey: "homeNow.objectives.title",
        textKey: "homeNow.objectives.text",
        actionKey: "homeNow.objectives.action",
      };

    // Evolução
    case "reinforce_progress":
    case "highlight_small_win":
    case "recognize_consistency":
      return {
        kind: "progress" as const,
        titleKey: "homeNow.progress.title",
        textKey: "homeNow.progress.text",
        actionKey: "homeNow.progress.action",
      };

    // Retoma / início
    case "welcome":
    case "encourage_return":
      return {
        kind: "record" as const,
        titleKey: "homeNow.record.title",
        textKey: "homeNow.record.text",
        actionKey: "homeNow.record.action",
      };

    /*
     * Intenções genéricas não recebem uma recomendação
     * artificial apenas para preencher espaço.
     */
    default:
      return null;
  }
})();

const handleHomeNowAction = () => {
  if (!homeNowAction) {
    return;
  }

  switch (homeNowAction.kind) {
    case "impulse":
      changeTab(3);
      return;

    case "patterns":
      setPatternsPage("menu");
      setHomeScreen("patterns");
      return;

    case "objectives":
      changeTab(2);
      return;

    case "progress":
      setHomeScreen("progress");
      return;

    case "record":
      setShowDayRatingPanel(true);

      requestAnimationFrame(() => {
        document
          .getElementById("home-daily-record")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      });

      return;
  }
};'''

if app.count(anchor_state) != 1:
    fail(
        "estado showDayRatingPanel não encontrado exatamente uma vez."
    )

app = app.replace(
    anchor_state,
    action_logic,
    1
)


# ============================================================
# 3. ID NO REGISTO DIÁRIO
# ============================================================

daily_anchor = '''<section className="overflow-hidden rounded-b-[30px] border border-[#E8DDD7]/70 bg-white shadow-[0_12px_30px_rgba(92,64,52,0.06)]">'''

daily_replacement = '''<section
                  id="home-daily-record"
                  className="overflow-hidden rounded-b-[30px] border border-[#E8DDD7]/70 bg-white shadow-[0_12px_30px_rgba(92,64,52,0.06)]"
                >'''

if app.count(daily_anchor) != 1:
    fail(
        "secção de registo diário não encontrada exatamente uma vez."
    )

app = app.replace(
    daily_anchor,
    daily_replacement,
    1
)


# ============================================================
# 4. CARTÃO PARA TI AGORA
# ============================================================

space_anchor = '''{/* O teu espaço — navegação secundária premium */}
{homeScreen === "home" && ('''

home_now_ui = '''{/* Para ti agora — ação contextual da CONFIA */}
{homeScreen === "home" && homeNowAction && (
  <section
    className="rounded-[28px] border border-[#E5A88B]/20 bg-gradient-to-br from-[#FFF7F2] via-white to-[#FFFDFC] p-5 shadow-[0_10px_28px_rgba(92,64,52,0.05)]"
    aria-label={t("homeNow.eyebrow")}
  >
    <div className="flex items-start gap-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/15 bg-white text-[#C97B5E] shadow-sm">
        <Compass
          size={18}
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
          {t("homeNow.eyebrow")}
        </p>

        <h3 className="mt-1 text-sm font-black leading-snug text-[#4E3B36]">
          {t(homeNowAction.titleKey)}
        </h3>

        <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">
          {t(homeNowAction.textKey)}
        </p>

        <button
          type="button"
          onClick={handleHomeNowAction}
          className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl text-[10px] font-black text-[#C97B5E] transition-opacity active:opacity-70"
        >
          <span>
            {t(homeNowAction.actionKey)}
          </span>

          <span aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  </section>
)}

{/* O teu espaço — navegação secundária premium */}
{homeScreen === "home" && ('''

if app.count(space_anchor) != 1:
    fail(
        'âncora "O teu espaço" não encontrada exatamente uma vez.'
    )

app = app.replace(
    space_anchor,
    home_now_ui,
    1
)


# ============================================================
# 5. GARANTIR IMPORT DO COMPASS
# ============================================================

# App já usa lucide-react. Acrescentamos Compass ao import
# existente sem criar dependências.
if "Compass," not in app and "Compass " not in app:
    lucide_start = app.find('from "lucide-react"')

    if lucide_start == -1:
        lucide_start = app.find("from 'lucide-react'")

    if lucide_start == -1:
        fail("import lucide-react não encontrado.")

    # Encontrar o início do import correspondente.
    import_start = app.rfind("import", 0, lucide_start)

    if import_start == -1:
        fail("início do import lucide-react não encontrado.")

    import_block = app[import_start:lucide_start]

    brace = import_block.find("{")

    if brace == -1:
        fail("import lucide-react não é import nomeado.")

    new_import_block = (
        import_block[:brace + 1]
        + "\n  Compass,"
        + import_block[brace + 1:]
    )

    app = (
        app[:import_start]
        + new_import_block
        + app[lucide_start:]
    )


# ============================================================
# 6. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "eyebrow": "Para ti agora",
        "impulse": {
            "title": "Um momento para voltares a ti",
            "text": "Pelo que tens registado, pode ser útil criares agora um pequeno espaço para acalmar e recuperar o teu centro.",
            "action": "Ir para o Impulso",
        },
        "impulseMemory": {
            "title": "Voltar ao que já te ajudou",
            "text": "A CONFIA reconhece uma estratégia que já fez parte dos teus momentos de regulação. Podes voltar a experimentá-la.",
            "action": "Abrir o Impulso",
        },
        "patterns": {
            "title": "Há algo que vale a pena observar",
            "text": "Os teus registos podem ganhar mais significado quando os observas em conjunto.",
            "action": "Explorar os meus padrões",
        },
        "objectives": {
            "title": "Um pequeno passo pode ser suficiente",
            "text": "Este pode ser um bom momento para voltares aos teus objetivos e escolheres onde queres colocar a tua energia.",
            "action": "Ver os meus objetivos",
        },
        "progress": {
            "title": "Olha para o caminho que tens feito",
            "text": "Os teus registos mostram informação que vale a pena veres com alguma distância.",
            "action": "Ver a minha evolução",
        },
        "record": {
            "title": "Começa por dizer como estás",
            "text": "Um registo simples ajuda a CONFIA a compreender melhor o teu momento e a acompanhar-te de forma mais útil.",
            "action": "Registar como estou",
        },
    },

    "en": {
        "eyebrow": "For you now",
        "impulse": {
            "title": "A moment to come back to yourself",
            "text": "Based on what you've been recording, it may help to create a little space now to settle and regain your centre.",
            "action": "Go to Impulse",
        },
        "impulseMemory": {
            "title": "Return to what has helped before",
            "text": "Confia recognises a strategy that has already been part of your regulation moments. You can try it again.",
            "action": "Open Impulse",
        },
        "patterns": {
            "title": "There's something worth noticing",
            "text": "Your records can become more meaningful when you look at them together.",
            "action": "Explore my patterns",
        },
        "objectives": {
            "title": "One small step may be enough",
            "text": "This may be a good moment to return to your goals and choose where you want to place your energy.",
            "action": "See my goals",
        },
        "progress": {
            "title": "Look at the path you've been taking",
            "text": "Your records contain information that may be useful to look at with a little distance.",
            "action": "See my progress",
        },
        "record": {
            "title": "Start by saying how you are",
            "text": "A simple check-in helps Confia understand your current moment and support you more usefully.",
            "action": "Record how I am",
        },
    },

    "es": {
        "eyebrow": "Para ti ahora",
        "impulse": {
            "title": "Un momento para volver a ti",
            "text": "Por lo que has ido registrando, puede ayudarte crear ahora un pequeño espacio para calmarte y recuperar tu centro.",
            "action": "Ir a Impulso",
        },
        "impulseMemory": {
            "title": "Volver a lo que ya te ayudó",
            "text": "Confia reconoce una estrategia que ya ha formado parte de tus momentos de regulación. Puedes volver a probarla.",
            "action": "Abrir Impulso",
        },
        "patterns": {
            "title": "Hay algo que merece la pena observar",
            "text": "Tus registros pueden adquirir más significado cuando los observas en conjunto.",
            "action": "Explorar mis patrones",
        },
        "objectives": {
            "title": "Un pequeño paso puede ser suficiente",
            "text": "Este puede ser un buen momento para volver a tus objetivos y elegir dónde quieres poner tu energía.",
            "action": "Ver mis objetivos",
        },
        "progress": {
            "title": "Mira el camino que has recorrido",
            "text": "Tus registros contienen información que puede ser útil observar con un poco de distancia.",
            "action": "Ver mi evolución",
        },
        "record": {
            "title": "Empieza por decir cómo estás",
            "text": "Un registro sencillo ayuda a Confia a comprender mejor tu momento y acompañarte de forma más útil.",
            "action": "Registrar cómo estoy",
        },
    },

    "fr": {
        "eyebrow": "Pour toi maintenant",
        "impulse": {
            "title": "Un moment pour revenir à toi",
            "text": "D'après ce que tu as noté, il peut être utile de créer maintenant un petit espace pour t'apaiser et retrouver ton centre.",
            "action": "Aller à Impulsion",
        },
        "impulseMemory": {
            "title": "Revenir à ce qui t'a déjà aidé",
            "text": "Confia reconnaît une stratégie qui a déjà fait partie de tes moments de régulation. Tu peux l'essayer à nouveau.",
            "action": "Ouvrir Impulsion",
        },
        "patterns": {
            "title": "Il y a quelque chose à observer",
            "text": "Tes notes peuvent prendre davantage de sens lorsque tu les regardes ensemble.",
            "action": "Explorer mes tendances",
        },
        "objectives": {
            "title": "Un petit pas peut suffire",
            "text": "C'est peut-être un bon moment pour revenir à tes objectifs et choisir où tu veux placer ton énergie.",
            "action": "Voir mes objectifs",
        },
        "progress": {
            "title": "Regarde le chemin que tu as parcouru",
            "text": "Tes notes contiennent des informations qu'il peut être utile d'observer avec un peu de recul.",
            "action": "Voir mon évolution",
        },
        "record": {
            "title": "Commence par dire comment tu vas",
            "text": "Une simple note aide Confia à mieux comprendre ton moment et à t'accompagner de façon plus utile.",
            "action": "Noter comment je vais",
        },
    },
}


for lang, data in locale_data.items():
    if "homeNow" in data:
        fail(
            f"homeNow já existe em {lang}; não vou sobrescrever automaticamente."
        )

    data["homeNow"] = translations[lang]


# ============================================================
# 7. VALIDAR EM MEMÓRIA
# ============================================================

checks = [
    "const homeNowAction = (() => {",
    'source: "general"',
    "const handleHomeNowAction = () => {",
    'case "support_difficult_moment":',
    'case "reinforce_effective_strategy":',
    'case "connect_pattern":',
    'case "celebrate_objective":',
    'case "reinforce_progress":',
    'case "welcome":',
    "changeTab(3);",
    "changeTab(2);",
    'setHomeScreen("patterns");',
    'setHomeScreen("progress");',
    "setShowDayRatingPanel(true);",
    'id="home-daily-record"',
    't("homeNow.eyebrow")',
    "t(homeNowAction.titleKey)",
    "t(homeNowAction.textKey)",
    "t(homeNowAction.actionKey)",
]

for fragment in checks:
    if fragment not in app:
        fail(f"validação App falhou: {fragment}")


serialized = {}

for lang, data in locale_data.items():
    text = json.dumps(
        data,
        ensure_ascii=False,
        indent=2
    ) + "\n"

    # Provar que continua JSON válido.
    json.loads(text)

    serialized[lang] = text


# ============================================================
# 8. BACKUPS
# ============================================================

shutil.copy2(
    APP,
    "/tmp/App.tsx.before_1d4"
)

for lang, path in LOCALES.items():
    shutil.copy2(
        path,
        f"/tmp/{lang}.json.before_1d4"
    )


# ============================================================
# 9. ESCREVER
# ============================================================

APP.write_text(
    app,
    encoding="utf-8"
)

for lang, path in LOCALES.items():
    path.write_text(
        serialized[lang],
        encoding="utf-8"
    )


# ============================================================
# 10. PÓS-VALIDAÇÃO
# ============================================================

for lang, path in LOCALES.items():
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    home_now = data.get("homeNow")

    if not isinstance(home_now, dict):
        fail(f"homeNow ausente em {lang}")

    for section in (
        "impulse",
        "impulseMemory",
        "patterns",
        "objectives",
        "progress",
        "record",
    ):
        if section not in home_now:
            fail(
                f"homeNow.{section} ausente em {lang}"
            )

    print(f"✓ {lang}: homeNow OK")


print()
print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.4 PARA TI AGORA")
print("=" * 72)
print("✓ Reactive Engine continua a decidir situação e intenção")
print("✓ Nenhum segundo motor de decisão criado")
print("✓ Regulação / dificuldade → Impulso")
print("✓ Estratégia eficaz anterior → Impulso")
print("✓ Reflexão / padrões → Padrões")
print("✓ Objetivos → Objetivos")
print("✓ Progresso / consistência → Evolução")
print("✓ Primeiro uso / regresso → registo de Hoje")
print("✓ Intenções genéricas não forçam recomendação")
print("✓ Cartão inserido entre Hoje e O teu espaço")
print("✓ changeTab reutilizado")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — 1D.4 aplicada.")
