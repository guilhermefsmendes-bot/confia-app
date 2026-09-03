from pathlib import Path
import json
import shutil
import sys


APP = Path("src/App.tsx")
SUMMARY = Path("src/components/HomeProgressSummary.tsx")

LOCALES = {
    lang: Path(f"src/locales/{lang}.json")
    for lang in ("pt", "en", "es", "fr")
}


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


# ============================================================
# 1. LER TUDO PRIMEIRO
# ============================================================

for path in [APP, SUMMARY, *LOCALES.values()]:
    if not path.exists():
        fail(f"não encontrado: {path}")

app = APP.read_text(encoding="utf-8")
summary = SUMMARY.read_text(encoding="utf-8")

locale_data = {}

for lang, path in LOCALES.items():
    try:
        with path.open("r", encoding="utf-8") as f:
            locale_data[lang] = json.load(f)
    except Exception as e:
        fail(f"{lang}.json inválido: {e}")


# ============================================================
# 2. VALIDAR ESTADO ATUAL
# ============================================================

required_app = [
    'import HomeProgressSummary from "./components/HomeProgressSummary";',
    "ProgressoDashboard",
    '"home" | "companion" | "patterns" | "shop" | "inventory" | "settings"',
    "<HomeProgressSummary />",
    'homeScreen === "patterns"',
    "completedObjectivesCount",
    "objectivesHistory",
    "ratings",
    "avatar.level",
    "avatar.xp",
]

for fragment in required_app:
    if fragment not in app:
        fail(f"estrutura App.tsx inesperada: {fragment}")


required_summary = [
    "export default function HomeProgressSummary()",
    'homeProgress.feedbackTitle',
    "trendLabelKey",
    "analysis.xp",
]

for fragment in required_summary:
    if fragment not in summary:
        fail(
            f"estrutura HomeProgressSummary inesperada: {fragment}"
        )


# Impedir aplicação duplicada.
if '"progress"' in app.split(
    'const [homeScreen, setHomeScreen]'
)[1].split('>("home")')[0]:
    fail('homeScreen já contém "progress". Não aplicar novamente.')

if "onOpenProgress" in summary:
    fail("HomeProgressSummary já contém onOpenProgress.")


# ============================================================
# 3. HOMESCREEN — ACRESCENTAR PROGRESS
# ============================================================

old_union = (
    '"home" | "companion" | "patterns" | '
    '"shop" | "inventory" | "settings"'
)

new_union = (
    '"home" | "companion" | "patterns" | '
    '"shop" | "inventory" | "settings" | "progress"'
)

if app.count(old_union) != 1:
    fail("union homeScreen não encontrada exatamente uma vez.")

app = app.replace(
    old_union,
    new_union,
    1
)


# ============================================================
# 4. PASSAR CALLBACK AO HOME PROGRESS SUMMARY
# ============================================================

old_summary_usage = "<HomeProgressSummary />"

new_summary_usage = '''<HomeProgressSummary
  onOpenProgress={() => setHomeScreen("progress")}
/>'''

if app.count(old_summary_usage) != 1:
    fail(
        "uso de HomeProgressSummary não encontrado exatamente uma vez."
    )

app = app.replace(
    old_summary_usage,
    new_summary_usage,
    1
)


# ============================================================
# 5. ECRÃ PROGRESS DENTRO DO PRINCIPAL
# ============================================================

anchor = '''{/* Padrões — ecrã próprio dentro do Principal */}
{currentTab === 0 && homeScreen === "patterns" && ('''

if anchor not in app:
    fail("âncora antes de Padrões não encontrada.")


progress_screen = '''{/* Evolução — ecrã próprio dentro do Principal */}
{currentTab === 0 && homeScreen === "progress" && (
  <div
    key="progress-screen"
    className="flex-1"
  >
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setHomeScreen("home")}
        aria-label={t("back")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8DDD7]/80 bg-white text-[#C97B5E] shadow-sm transition-transform active:scale-95"
      >
        <ArrowLeft
          size={18}
          strokeWidth={1.9}
        />
      </button>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
          {t("homeProgress.eyebrow")}
        </p>

        <h2 className="text-lg font-black tracking-tight text-[#4E3B36]">
          {t("homeProgress.evolutionTitle")}
        </h2>
      </div>
    </div>

    <ProgressoDashboard
      ratings={ratings}
      avatarLevel={avatar.level}
      avatarXp={avatar.xp}
      completedObjectivesCount={completedObjectivesCount}
      objectivesHistory={objectivesHistory}
    />
  </div>
)}

'''

app = app.replace(
    anchor,
    progress_screen + anchor,
    1
)


# ============================================================
# 6. HOME PROGRESS SUMMARY — PROP
# ============================================================

old_function = '''export default function HomeProgressSummary() {
  const { t } = useTranslation();'''

new_function = '''interface HomeProgressSummaryProps {
  onOpenProgress: () => void;
}

export default function HomeProgressSummary({
  onOpenProgress,
}: HomeProgressSummaryProps) {
  const { t } = useTranslation();'''

if summary.count(old_function) != 1:
    fail(
        "assinatura de HomeProgressSummary não encontrada exatamente uma vez."
    )

summary = summary.replace(
    old_function,
    new_function,
    1
)


# ============================================================
# 7. BOTÃO VER EVOLUÇÃO
# ============================================================

old_xp = '''      {/* XP — secundário */}
      <div className="mt-4 flex items-center justify-end border-t border-[#E8DDD7]/50 pt-3">
        <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wide text-[#C97B5E]">
          <Sparkles size={11} />
          {analysis.xp} XP
        </span>
      </div>'''

new_xp = '''      {/* Evolução + XP — ações secundárias */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E8DDD7]/50 pt-3">
        <button
          type="button"
          onClick={onOpenProgress}
          className="group inline-flex min-h-9 items-center gap-2 rounded-xl px-1 text-left text-[10px] font-black text-[#C97B5E] transition-opacity active:opacity-70"
        >
          <span>
            {t("homeProgress.openEvolution")}
          </span>

          <span
            aria-hidden="true"
            className="transition-transform group-active:translate-x-0.5"
          >
            →
          </span>
        </button>

        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-black tracking-wide text-[#C97B5E]">
          <Sparkles size={11} />
          {analysis.xp} XP
        </span>
      </div>'''

if summary.count(old_xp) != 1:
    fail("bloco XP do resumo não encontrado exatamente uma vez.")

summary = summary.replace(
    old_xp,
    new_xp,
    1
)


# ============================================================
# 8. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "openEvolution": "Ver a minha evolução",
        "evolutionTitle": "A minha evolução",
    },
    "en": {
        "openEvolution": "See my progress",
        "evolutionTitle": "My progress",
    },
    "es": {
        "openEvolution": "Ver mi evolución",
        "evolutionTitle": "Mi evolución",
    },
    "fr": {
        "openEvolution": "Voir mon évolution",
        "evolutionTitle": "Mon évolution",
    },
}

for lang, data in locale_data.items():
    hp = data.get("homeProgress")

    if not isinstance(hp, dict):
        fail(f"homeProgress ausente em {lang}")

    hp["openEvolution"] = translations[lang]["openEvolution"]
    hp["evolutionTitle"] = translations[lang]["evolutionTitle"]


# ============================================================
# 9. VALIDAR RESULTADOS EM MEMÓRIA
# ============================================================

checks_app = [
    '"progress"',
    'setHomeScreen("progress")',
    'homeScreen === "progress"',
    "<ProgressoDashboard",
    "ratings={ratings}",
    "avatarLevel={avatar.level}",
    "avatarXp={avatar.xp}",
    "completedObjectivesCount={completedObjectivesCount}",
    "objectivesHistory={objectivesHistory}",
    't("homeProgress.evolutionTitle")',
]

for fragment in checks_app:
    if fragment not in app:
        fail(f"validação App falhou: {fragment}")


checks_summary = [
    "interface HomeProgressSummaryProps",
    "onOpenProgress: () => void",
    "onClick={onOpenProgress}",
    't("homeProgress.openEvolution")',
    "analysis.xp",
]

for fragment in checks_summary:
    if fragment not in summary:
        fail(f"validação Summary falhou: {fragment}")


# Serializar e validar todos os JSON antes de qualquer escrita.
serialized_locales = {}

for lang, data in locale_data.items():
    text = json.dumps(
        data,
        ensure_ascii=False,
        indent=2
    ) + "\n"

    json.loads(text)

    serialized_locales[lang] = text


# ============================================================
# 10. BACKUPS /tmp
# ============================================================

shutil.copy2(
    APP,
    "/tmp/App.tsx.before_1d3"
)

shutil.copy2(
    SUMMARY,
    "/tmp/HomeProgressSummary.tsx.before_1d3"
)

for lang, path in LOCALES.items():
    shutil.copy2(
        path,
        f"/tmp/{lang}.json.before_1d3"
    )


# ============================================================
# 11. ESCREVER APENAS DEPOIS DE TUDO VALIDADO
# ============================================================

APP.write_text(
    app,
    encoding="utf-8"
)

SUMMARY.write_text(
    summary,
    encoding="utf-8"
)

for lang, path in LOCALES.items():
    path.write_text(
        serialized_locales[lang],
        encoding="utf-8"
    )


# ============================================================
# 12. VALIDAÇÃO PÓS-ESCRITA
# ============================================================

for lang, path in LOCALES.items():
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    hp = data["homeProgress"]

    if not hp.get("openEvolution"):
        fail(f"openEvolution ausente em {lang}")

    if not hp.get("evolutionTitle"):
        fail(f"evolutionTitle ausente em {lang}")

    print(f"✓ {lang}: traduções 1D.3 OK")


print()
print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.3 EVOLUÇÃO")
print("=" * 72)
print("✓ progress adicionado ao homeScreen")
print("✓ Hoje ganhou acesso à evolução")
print("✓ ProgressoDashboard reutilizado")
print("✓ Ratings reutilizados")
print("✓ Nível e XP do companheiro reutilizados")
print("✓ Objetivos e histórico reutilizados")
print("✓ Regresso ao Principal adicionado")
print("✓ Footer permanece com 5 separadores")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — 1D.3 aplicada.")
