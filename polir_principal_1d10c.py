from pathlib import Path
import shutil
import sys


SUMMARY_FILE = Path("src/components/HomeProgressSummary.tsx")
APP_FILE = Path("src/App.tsx")

SUMMARY_BACKUP = Path(
    "/tmp/HomeProgressSummary.tsx.before_1d10c"
)
APP_BACKUP = Path(
    "/tmp/App.tsx.before_1d10c"
)


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


def replace_once(text, old, new, label):
    count = text.count(old)

    if count != 1:
        fail(
            f"{label}: esperava 1 ocorrência, "
            f"encontrei {count}."
        )

    return text.replace(old, new, 1)


print("=" * 72)
print("CONFIA — PRINCIPAL VIVO — 1D.10C")
print("POLIMENTO PREMIUM — HOJE + REGISTAR")
print("=" * 72)


# ============================================================
# 1. CARREGAR — SEM ESCREVER
# ============================================================

if not SUMMARY_FILE.exists():
    fail("HomeProgressSummary.tsx não encontrado.")

if not APP_FILE.exists():
    fail("App.tsx não encontrado.")

summary_original = SUMMARY_FILE.read_text(
    encoding="utf-8"
)

app_original = APP_FILE.read_text(
    encoding="utf-8"
)

summary = summary_original
app = app_original


# ============================================================
# 2. VALIDAR ESTADO ORIGINAL
# ============================================================

metric_old = (
    '<div className="px-2 text-center">'
)

metric_new = (
    '<div className="rounded-[18px] border '
    'border-[#E8DDD7]/60 bg-white/70 px-2 py-3 '
    'text-center shadow-[0_5px_16px_rgba(92,64,52,0.035)]">'
)

if summary.count(metric_old) != 3:
    fail(
        "Esperava exatamente 3 indicadores "
        f"originais; encontrei {summary.count(metric_old)}."
    )

if metric_new in summary:
    fail(
        "HomeProgressSummary parece já ter sido "
        "parcialmente alterado."
    )


# ============================================================
# 3. SUPERFÍCIE PRINCIPAL DE HOJE
# ============================================================

summary = replace_once(
    summary,
    '''<section className="overflow-hidden rounded-t-[30px] border border-b-0 border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-[#FFF9F5] to-[#FFF7F2] px-5 pb-5 pt-5">''',
    '''<section className="relative overflow-hidden rounded-t-[30px] border border-b-0 border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] via-[#FFF9F5] to-[#FFF7F2] px-5 pb-5 pt-5">''',
    "superfície principal de Hoje",
)


# ============================================================
# 4. LEITURA PRINCIPAL DA CONFIA
# ============================================================

summary = replace_once(
    summary,
    '''<div className="mt-4 rounded-[22px] border border-[#E8DDD7]/70 bg-white/80 p-4 shadow-[0_10px_30px_rgba(107,78,67,0.05)]">''',
    '''<div className="relative mt-4 overflow-hidden rounded-[22px] border border-[#E5A88B]/20 bg-gradient-to-br from-white via-white to-[#FFF5EF] p-4 shadow-[0_10px_28px_rgba(107,78,67,0.055)]">
        <div
          aria-hidden="true"
          className="absolute left-0 top-4 h-10 w-[3px] rounded-r-full bg-[#E5A88B]/55"
        />''',
    "leitura principal da CONFIA",
)


# ============================================================
# 5. INDICADORES — OS 3 DE UMA VEZ
# ============================================================

summary = replace_once(
    summary,
    '''<div className="mt-4 grid grid-cols-3 divide-x divide-[#E8DDD7]/70">''',
    '''<div className="mt-4 grid grid-cols-3 gap-2">''',
    "grelha de indicadores",
)

if summary.count(metric_old) != 3:
    fail(
        "Os 3 indicadores deixaram de estar "
        "identificáveis antes da conversão."
    )

summary = summary.replace(
    metric_old,
    metric_new,
)

if summary.count(metric_new) != 3:
    fail(
        "A conversão dos 3 indicadores falhou."
    )

if metric_old in summary:
    fail(
        "Permaneceu pelo menos um indicador antigo."
    )


# ============================================================
# 6. XP — BADGE PREMIUM
# ============================================================

summary = replace_once(
    summary,
    '''<span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-black tracking-wide text-[#C97B5E]">
          <Sparkles size={11} />
          {analysis.xp} XP
        </span>''',
    '''<span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5A88B]/15 bg-white/80 px-2.5 py-1.5 text-[9px] font-black tracking-wide text-[#C97B5E]">
          <Sparkles size={11} />
          {analysis.xp} XP
        </span>''',
    "badge XP",
)


# ============================================================
# 7. REGISTAR — SUPERFÍCIE
# ============================================================

app = replace_once(
    app,
    '''className="overflow-hidden rounded-b-[30px] border border-[#E8DDD7]/70 bg-white shadow-[0_12px_30px_rgba(92,64,52,0.06)]"''',
    '''className="overflow-hidden rounded-b-[30px] border border-[#E8DDD7]/70 bg-gradient-to-b from-white to-[#FFFDFC] shadow-[0_12px_30px_rgba(92,64,52,0.06)]"''',
    "superfície do registo",
)

app = replace_once(
    app,
    '''className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 active:bg-[#FFF9F5]"''',
    '''className="w-full flex items-center justify-between gap-4 border-t border-[#E5A88B]/10 px-5 py-4 text-left transition-colors duration-200 active:bg-[#FFF9F5]"''',
    "botão de abrir registo",
)

app = replace_once(
    app,
    '''className="w-11 h-11 shrink-0 rounded-2xl bg-[#FFF5EF] flex items-center justify-center"''',
    '''className="w-11 h-11 shrink-0 rounded-2xl border border-[#E5A88B]/15 bg-gradient-to-br from-[#FFF5EF] to-[#F8EAE2] flex items-center justify-center shadow-[0_5px_14px_rgba(92,64,52,0.04)]"''',
    "ícone do registo",
)

app = replace_once(
    app,
    '''className="shrink-0 w-8 h-8 rounded-full bg-[#FAF5F0] flex items-center justify-center text-[#C97B5E] text-lg font-light"''',
    '''className="shrink-0 w-8 h-8 rounded-full border border-[#E5A88B]/15 bg-white flex items-center justify-center text-[#C97B5E] text-lg font-light shadow-sm"''',
    "controlo expandir/recolher",
)

app = replace_once(
    app,
    '''<div className="border-t border-[#E5A88B]/10 px-5 pb-5 pt-4 space-y-5">''',
    '''<div className="border-t border-[#E5A88B]/10 bg-[#FFFCFA]/70 px-5 pb-5 pt-4 space-y-5">''',
    "painel expandido",
)

app = replace_once(
    app,
    '''className="w-full py-3.5 bg-[#D59375] active:bg-[#C68060] text-white font-extrabold text-xs rounded-2xl transition-colors duration-200 flex items-center justify-center gap-2"''',
    '''className="w-full py-3.5 bg-[#D59375] active:bg-[#C68060] text-white font-extrabold text-xs rounded-2xl shadow-[0_8px_20px_rgba(201,123,94,0.18)] transition-colors duration-200 flex items-center justify-center gap-2"''',
    "botão guardar",
)


# ============================================================
# 8. RETIRAR APENAS OS EMOJIS VISUAIS DOS RATINGS
# ============================================================

morning_emoji = (
    "<span>{getRatingLabel(morningRating).emoji}</span>"
)

afternoon_emoji = (
    "<span>{getRatingLabel(afternoonRating).emoji}</span>"
)

if app.count(morning_emoji) != 1:
    fail(
        "Emoji visual da manhã não encontrado "
        "de forma única."
    )

if app.count(afternoon_emoji) != 1:
    fail(
        "Emoji visual da tarde não encontrado "
        "de forma única."
    )

app = app.replace(
    morning_emoji,
    "",
    1,
)

app = app.replace(
    afternoon_emoji,
    "",
    1,
)


# ============================================================
# 9. GUARDRAILS — HOME PROGRESS
# ============================================================

summary_logic = [
    "collectCompanionData()",
    "analysis.averageMood",
    "analysis.activeDays",
    "analysis.objectivesCompleted",
    "analysis.objectivesTotal",
    "analysis.trend",
    "analysis.xp",
    "onOpenProgress",
    "feedbackKey",
    "trendLabelKey",
]

for marker in summary_logic:
    before = summary_original.count(marker)
    after = summary.count(marker)

    if before != after:
        fail(
            "Lógica de HomeProgressSummary alterada: "
            f"{marker} ({before} → {after})"
        )


# ============================================================
# 10. GUARDRAILS — REGISTO
#
# morningRating / afternoonRating NÃO entram na validação
# por contagem porque estamos deliberadamente a remover
# uma referência visual .emoji de cada um.
#
# Os setters, valores dos inputs e restantes operações
# continuam protegidos.
# ============================================================

app_logic = [
    "showDayRatingPanel",
    "setShowDayRatingPanel",
    "setMorningRating",
    "setAfternoonRating",
    "selectedDate",
    "setSelectedDate",
    "noteText",
    "setNoteText",
    "handleSaveRatings",
    "todayLogged",
    'id="home-daily-record"',
]

for marker in app_logic:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            "Lógica do registo alterada: "
            f"{marker} ({before} → {after})"
        )


# ============================================================
# 11. VALIDAR ESPECIFICAMENTE OS DOIS SLIDERS
# ============================================================

slider_markers = [
    'value={morningRating}',
    'setMorningRating(Number(e.target.value))',
    'value={afternoonRating}',
    'setAfternoonRating(Number(e.target.value))',
]

for marker in slider_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != 1 or after != 1:
        fail(
            "Slider alterado ou não identificado "
            f"de forma única: {marker} "
            f"({before} → {after})"
        )


# ============================================================
# 12. CONFIRMAR QUE APENAS O EMOJI VISUAL DESAPARECEU
# ============================================================

if morning_emoji in app:
    fail(
        "O emoji visual da manhã não foi removido."
    )

if afternoon_emoji in app:
    fail(
        "O emoji visual da tarde não foi removido."
    )

if (
    app.count("morningRating")
    != app_original.count("morningRating") - 1
):
    fail(
        "A alteração de morningRating não corresponde "
        "apenas à remoção do emoji."
    )

if (
    app.count("afternoonRating")
    != app_original.count("afternoonRating") - 1
):
    fail(
        "A alteração de afternoonRating não corresponde "
        "apenas à remoção do emoji."
    )


# ============================================================
# 13. GUARDRAILS — OUTRAS ÁREAS
# ============================================================

external_markers = [
    "<HomeWorld",
    "reactiveMessageKey",
    "homeNowAction",
    "homeNowContext",
    "handleHomeNowAction",
    "O teu espaço — navegação secundária premium",
]

for marker in external_markers:
    before = app_original.count(marker)
    after = app.count(marker)

    if before != after:
        fail(
            "Área externa ao Hoje foi alterada: "
            f"{marker} ({before} → {after})"
        )


# ============================================================
# 14. SEM NOVOS EFEITOS / STORAGE
# ============================================================

side_effect_markers = [
    "localStorage.setItem(",
    "localStorage.removeItem(",
    "addEventListener(",
    "onSnapshot(",
]

for marker in side_effect_markers:
    if summary.count(marker) != summary_original.count(marker):
        fail(
            "HomeProgressSummary ganhou efeito: "
            f"{marker}"
        )

    if app.count(marker) != app_original.count(marker):
        fail(
            "App ganhou efeito: "
            f"{marker}"
        )


# ============================================================
# 15. GARANTIR ALTERAÇÃO REAL
# ============================================================

if summary == summary_original:
    fail(
        "HomeProgressSummary não sofreu alterações."
    )

if app == app_original:
    fail(
        "App.tsx não sofreu alterações."
    )


# ============================================================
# 16. BACKUPS
#
# Só chegamos aqui se TODAS as validações anteriores
# tiverem passado.
# ============================================================

shutil.copy2(
    SUMMARY_FILE,
    SUMMARY_BACKUP,
)

shutil.copy2(
    APP_FILE,
    APP_BACKUP,
)


# ============================================================
# 17. WRITE
# ============================================================

SUMMARY_FILE.write_text(
    summary,
    encoding="utf-8",
)

APP_FILE.write_text(
    app,
    encoding="utf-8",
)


print("✓ Leitura de Hoje preservada")
print("✓ Cálculos dos últimos 7 dias preservados")
print("✓ Tendência emocional preservada")
print("✓ 3 indicadores convertidos em mini-cartões")
print("✓ Leitura da CONFIA ganhou profundidade")
print("✓ XP convertido em badge")
print("✓ Hoje → Registar visualmente integrado")
print("✓ Registo diário ganhou superfície premium")
print("✓ Slider da manhã preservado")
print("✓ Slider da tarde preservado")
print("✓ Emojis visuais dos ratings removidos")
print("✓ Guardar/Atualizar preservado")
print("✓ HomeWorld preservado")
print("✓ Motor reativo preservado")
print("✓ Para ti agora preservado")
print("✓ O teu espaço preservado")
print("✓ Nenhuma tradução nova")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print()
print("Nova leitura visual:")
print("  HOJE")
print("    ├─ interpretação da CONFIA")
print("    ├─ estado | presença | objetivos")
print("    ├─ evolução + XP")
print("    └─ registar o dia")
print()
print(f"✓ Backup: {SUMMARY_BACKUP}")
print(f"✓ Backup: {APP_BACKUP}")
print("=" * 72)
print("OK — 1D.10C APLICADA")
print("=" * 72)
