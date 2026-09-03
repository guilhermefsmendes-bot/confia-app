from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2E
# Percurso semanal premium
#
# ALTERA:
# - src/components/WeeklyGoalSection.tsx
# - src/locales/pt.json
# - src/locales/en.json
# - src/locales/es.json
# - src/locales/fr.json
#
# PRESERVA:
# - criação do objetivo semanal
# - completedDays
# - dailyCredits
# - limite de 2 créditos
# - recuperação
# - dailyRatings
# - ease 1–5
# - notas
# - medalUnlocked
# - callbacks
# ============================================================

ROOT = Path.cwd()

COMPONENT = ROOT / "src/components/WeeklyGoalSection.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUP = Path(
    "/tmp/WeeklyGoalSection.tsx.before_objectives_2e"
)

LOCALE_BACKUPS = {
    lang: Path(
        f"/tmp/{lang}.json.before_objectives_2e"
    )
    for lang in LOCALES
}


def fail(message):
    print()
    print("ERRO:")
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    sys.exit(1)


# ============================================================
# 1. VALIDAR
# ============================================================

if not COMPONENT.exists():
    fail(f"Não encontrei {COMPONENT}")

for lang, path in LOCALES.items():
    if not path.exists():
        fail(f"Não encontrei {path}")


component_original = COMPONENT.read_text(
    encoding="utf-8"
)

locale_data = {}

for lang, path in LOCALES.items():
    try:
        locale_data[lang] = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(f"{lang}: JSON inválido: {exc}")


# ============================================================
# 2. GUARDRAILS
# ============================================================

required = [
    "const todayCredits =",
    "const missedDays =",
    "const selectedAlreadyCompleted =",
    "const selectedIsRecovery =",
    "const canUseToday =",
    "const openDay =",
    "const handleSaveDay =",
    "weeklyGoal.dailyRatings",
    "weeklyGoal.medalUnlocked",
    "onCompleteDay(",
    "completedDays.includes(date)",
    "weekDates.map((date, index) =>",
]

for marker in required:
    if marker not in component_original:
        fail(
            "WeeklyGoalSection não corresponde "
            "à versão auditada.\n"
            f"Falta: {marker}"
        )

if "weeklyGoalPremium.pathEyebrow" in component_original:
    fail("A 2E parece já estar aplicada.")


# ============================================================
# 3. REMOVER DEBUG
# ============================================================

component_new = component_original

debug_start = component_new.find(
    '  console.log(\n'
)

if debug_start != -1:
    debug_end_marker = '  );'

    debug_end = component_new.find(
        debug_end_marker,
        debug_start
    )

    if debug_end == -1:
        fail(
            "Encontrei console.log mas não consegui "
            "determinar o seu final."
        )

    debug_end += len(debug_end_marker)

    component_new = (
        component_new[:debug_start]
        + component_new[debug_end:]
    )


# ============================================================
# 4. ADICIONAR MÉTRICAS VISUAIS DERIVADAS
# ============================================================

metrics_anchor = """  const progress = completedDays.length;

  const todayCredits"""

metrics_new = """  const progress = completedDays.length;

  const weeklyPercentage = Math.round(
    (progress / 7) * 100
  );

  const remainingDays = Math.max(
    0,
    7 - progress
  );

  const todayCredits"""

if component_new.count(metrics_anchor) != 1:
    fail(
        "Não encontrei o ponto das métricas semanais."
    )

component_new = component_new.replace(
    metrics_anchor,
    metrics_new,
    1
)


# ============================================================
# 5. LOCALIZAR CARD PRINCIPAL COM OBJETIVO EXISTENTE
# ============================================================

return_anchor = """  return (
    <>"""

if component_new.count(return_anchor) != 1:
    fail(
        "Não encontrei o return principal."
    )

card_start_marker = """      <div className="mt-6 rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">"""

card_start = component_new.find(
    card_start_marker,
    component_new.index(return_anchor)
)

if card_start == -1:
    fail(
        "Não encontrei o card semanal principal."
    )

modal_marker = """      {selectedDate && ("""

modal_start = component_new.find(
    modal_marker,
    card_start
)

if modal_start == -1:
    fail(
        "Não encontrei o início do modal semanal."
    )

old_card_region = component_new[
    card_start:modal_start
]


# ============================================================
# 6. NOVO PERCURSO SEMANAL
# ============================================================

new_card_region = """      <section className="mt-6 overflow-hidden rounded-[30px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFF3EC] shadow-sm">
        <div className="relative p-5">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#E5A88B]/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/25 bg-white text-xl shadow-sm">
                  {weeklyGoal.medalUnlocked ? "🏅" : "🏆"}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
                    {t("weeklyGoalPremium.pathEyebrow")}
                  </p>

                  <h3 className="mt-0.5 text-base font-black text-[#4E3B36]">
                    {t("weeklyGoalPremium.pathTitle")}
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#79665E]">
                    {weeklyGoal.title}
                  </p>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-[#E5A88B]/20 bg-white px-3 py-2 text-right shadow-sm">
                <div className="text-lg font-black leading-none text-[#4E3B36]">
                  {progress}/7
                </div>

                <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-[#A88A7D]">
                  {t("weeklyGoal.days")}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white bg-white/75 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A88A7D]">
                    {t("weeklyGoalPremium.continuity")}
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#5D4942]">
                    {weeklyGoal.medalUnlocked
                      ? t("weeklyGoalPremium.pathComplete")
                      : t("weeklyGoalPremium.remaining", {
                          count: remainingDays
                        })}
                  </p>
                </div>

                <span className="rounded-full bg-[#FFF0E8] px-2.5 py-1 text-[10px] font-black text-[#C97B5E]">
                  {weeklyPercentage}%
                </span>
              </div>

              <div className="mt-5">
                <div className="relative">
                  <div
                    className="absolute left-[7%] right-[7%] top-5 h-1 rounded-full bg-[#F1E5DF]"
                    aria-hidden="true"
                  />

                  <div
                    className="absolute left-[7%] top-5 h-1 rounded-full bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] transition-all duration-500"
                    style={{
                      width: `${
                        progress <= 1
                          ? 0
                          : ((Math.min(progress, 7) - 1) / 6) * 86
                      }%`
                    }}
                    aria-hidden="true"
                  />

                  <div className="relative grid grid-cols-7 gap-1">
                    {weekDates.map((date, index) => {
                      const completed =
                        completedDays.includes(date);

                      const hasRating =
                        !!weeklyGoal.dailyRatings?.[date];

                      const isToday =
                        date === today;

                      const isMissed =
                        date < today &&
                        !completed;

                      const disabled =
                        !completed &&
                        !canUseToday &&
                        !(
                          date < today &&
                          missedDays.includes(date)
                        );

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => openDay(date)}
                          disabled={disabled}
                          aria-label={t(
                            "weeklyGoalPremium.dayLabel",
                            {
                              day: index + 1
                            }
                          )}
                          className="group flex min-w-0 flex-col items-center disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span
                            className={`relative z-10 flex h-10 w-10 max-w-full items-center justify-center rounded-full border text-[11px] font-black transition-all active:scale-95 ${
                              completed
                                ? "border-[#E5A88B] bg-[#E5A88B] text-white shadow-md shadow-[#E5A88B]/20"
                                : isToday
                                  ? "border-[#C97B5E] bg-white text-[#C97B5E] shadow-sm ring-4 ring-[#E5A88B]/10"
                                  : isMissed
                                    ? "border-[#E8D8D0] bg-[#FBF7F5] text-[#AD9489]"
                                    : "border-[#E8DDD7] bg-white text-[#9B857B]"
                            }`}
                          >
                            {completed ? (
                              <span className="text-sm">
                                ✓
                              </span>
                            ) : (
                              index + 1
                            )}

                            {hasRating && (
                              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-[#C97B5E] text-[7px] text-white">
                                ★
                              </span>
                            )}
                          </span>

                          <span
                            className={`mt-2 text-[8px] font-black uppercase tracking-tight ${
                              isToday
                                ? "text-[#C97B5E]"
                                : completed
                                  ? "text-[#8D746A]"
                                  : "text-[#B09B92]"
                            }`}
                          >
                            {isToday
                              ? t("weeklyGoalPremium.today")
                              : t(
                                  "weeklyGoalPremium.shortDay",
                                  {
                                    day: index + 1
                                  }
                                )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F0E5DF] pt-3">
                <p className="text-[10px] font-semibold leading-relaxed text-[#9A857C]">
                  {t("weeklyGoalPremium.tapHint")}
                </p>

                {!weeklyGoal.medalUnlocked && (
                  <span className="shrink-0 text-[9px] font-black text-[#C97B5E]">
                    {t("weeklyGoalPremium.credits", {
                      count: Math.max(0, 2 - todayCredits)
                    })}
                  </span>
                )}
              </div>
            </div>

            {weeklyGoal.medalUnlocked && (
              <div className="mt-4 rounded-[24px] border border-[#E5A88B]/25 bg-gradient-to-r from-[#FFF0E8] to-[#FFF8F4] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                    🏅
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#4E3B36]">
                      {t("weeklyGoal.completed")}
                    </p>

                    <p className="mt-1 text-xs font-medium leading-relaxed text-[#7A6A64]">
                      {t("weeklyGoal.medalReady")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

"""

component_new = (
    component_new[:card_start]
    + new_card_region
    + component_new[modal_start:]
)


# ============================================================
# 7. REFINAR VISUAL DO MODAL, SEM MUDAR LÓGICA
# ============================================================

component_new = component_new.replace(
    'className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"',
    'className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F302B]/45 p-4 backdrop-blur-sm"',
    1
)

component_new = component_new.replace(
    'className="w-full max-w-md rounded-[30px] bg-white p-6 shadow-2xl"',
    'className="w-full max-w-md rounded-[30px] border border-[#E5A88B]/20 bg-[#FFFCFA] p-6 shadow-2xl"',
    1
)

component_new = component_new.replace(
    'className="w-full rounded-2xl bg-[#4E3B36] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"',
    'className="w-full rounded-2xl bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] px-4 py-3 font-bold text-white shadow-md shadow-[#E5A88B]/20 disabled:cursor-not-allowed disabled:opacity-40"',
    1
)


# ============================================================
# 8. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "pathEyebrow": "A tua semana",
        "pathTitle": "Um caminho de 7 dias",
        "continuity": "Continuidade",
        "remaining": "Faltam {{count}} passos para a medalha",
        "pathComplete": "Percurso concluído",
        "today": "Hoje",
        "shortDay": "D{{day}}",
        "dayLabel": "Dia {{day}} do percurso",
        "tapHint": "Toca num dia para registar como correu.",
        "credits": "{{count}} registos disponíveis hoje"
    },
    "en": {
        "pathEyebrow": "Your week",
        "pathTitle": "A 7-day path",
        "continuity": "Continuity",
        "remaining": "{{count}} steps left to the medal",
        "pathComplete": "Path completed",
        "today": "Today",
        "shortDay": "D{{day}}",
        "dayLabel": "Day {{day}} of the path",
        "tapHint": "Tap a day to record how it went.",
        "credits": "{{count}} entries available today"
    },
    "es": {
        "pathEyebrow": "Tu semana",
        "pathTitle": "Un camino de 7 días",
        "continuity": "Continuidad",
        "remaining": "Faltan {{count}} pasos para la medalla",
        "pathComplete": "Camino completado",
        "today": "Hoy",
        "shortDay": "D{{day}}",
        "dayLabel": "Día {{day}} del camino",
        "tapHint": "Toca un día para registrar cómo fue.",
        "credits": "{{count}} registros disponibles hoy"
    },
    "fr": {
        "pathEyebrow": "Ta semaine",
        "pathTitle": "Un parcours de 7 jours",
        "continuity": "Continuité",
        "remaining": "Encore {{count}} étapes avant la médaille",
        "pathComplete": "Parcours accompli",
        "today": "Aujourd'hui",
        "shortDay": "J{{day}}",
        "dayLabel": "Jour {{day}} du parcours",
        "tapHint": "Touche un jour pour noter comment ça s'est passé.",
        "credits": "{{count}} entrées disponibles aujourd'hui"
    },
}


# ============================================================
# 9. PREPARAR LOCALES
# ============================================================

locale_new_text = {}

for lang, data in locale_data.items():

    if "weeklyGoalPremium" in data:
        fail(
            f"{lang}: weeklyGoalPremium já existe."
        )

    if not isinstance(
        data.get("weeklyGoal"),
        dict
    ):
        fail(
            f"{lang}: weeklyGoal não existe "
            "ou não é objeto."
        )

    new_data = dict(data)

    new_data["weeklyGoalPremium"] = (
        translations[lang]
    )

    rendered = json.dumps(
        new_data,
        ensure_ascii=False,
        indent=2
    ) + "\n"

    try:
        parsed = json.loads(rendered)
    except Exception as exc:
        fail(
            f"{lang}: JSON preparado inválido: {exc}"
        )

    if (
        parsed.get("weeklyGoalPremium")
        != translations[lang]
    ):
        fail(
            f"{lang}: validação das traduções falhou."
        )

    locale_new_text[lang] = rendered


# ============================================================
# 10. GUARDRAILS FINAIS ANTES DE ESCREVER
# ============================================================

post_required = [
    "const weeklyPercentage =",
    "const remainingDays =",
    't("weeklyGoalPremium.pathEyebrow")',
    't("weeklyGoalPremium.pathTitle")',
    't("weeklyGoalPremium.continuity")',
    't("weeklyGoalPremium.remaining"',
    't("weeklyGoalPremium.tapHint")',
    "weekDates.map((date, index) =>",
    "completedDays.includes(date)",
    "weeklyGoal.dailyRatings?.[date]",
    "onClick={() => openDay(date)}",
    "onCompleteDay(",
    "selectedIsRecovery",
    "todayCredits",
]

for marker in post_required:
    if marker not in component_new:
        fail(
            "Guardrail pós-transformação falhou:\n"
            f"{marker}"
        )

if "WEEKLY GOAL - idioma:" in component_new:
    fail(
        "O console.log de debug não foi removido."
    )

# A lógica crítica tem de continuar exatamente uma vez.
critical_counts = {
    "const canUseToday =": 1,
    "const openDay =": 1,
    "const handleSaveDay =": 1,
    "onCompleteDay(": 1,
}

for marker, expected in critical_counts.items():
    actual = component_new.count(marker)

    if actual != expected:
        fail(
            f"Lógica crítica inesperada: {marker} "
            f"aparece {actual} vezes."
        )


# ============================================================
# 11. BACKUPS
# ============================================================

shutil.copy2(
    COMPONENT,
    BACKUP
)

for lang, path in LOCALES.items():
    shutil.copy2(
        path,
        LOCALE_BACKUPS[lang]
    )


# ============================================================
# 12. ESCREVER
# ============================================================

COMPONENT.write_text(
    component_new,
    encoding="utf-8"
)

for lang, path in LOCALES.items():
    path.write_text(
        locale_new_text[lang],
        encoding="utf-8"
    )


# ============================================================
# 13. VALIDAÇÃO FINAL EM DISCO
# ============================================================

written = COMPONENT.read_text(
    encoding="utf-8"
)

for marker in post_required:
    if marker not in written:
        print()
        print("ATENÇÃO:")
        print(
            "A escrita ocorreu mas não encontrei:"
        )
        print(marker)
        print()
        print("Backup:")
        print(BACKUP)
        sys.exit(1)

for lang, path in LOCALES.items():
    try:
        parsed = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        print(
            f"ATENÇÃO: {lang} inválido após escrita: "
            f"{exc}"
        )
        sys.exit(1)

    if (
        parsed.get("weeklyGoalPremium")
        != translations[lang]
    ):
        print(
            f"ATENÇÃO: traduções finais incorretas "
            f"em {lang}"
        )
        sys.exit(1)


# ============================================================
# 14. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2E")
print("=" * 72)
print()
print("✓ Objetivo semanal transformado num percurso de 7 dias")
print("✓ Progresso semanal continua baseado em completedDays")
print("✓ Dia atual destacado")
print("✓ Dias concluídos visualmente ligados")
print("✓ Avaliações continuam identificadas")
print("✓ Dias anteriores recuperáveis preservados")
print("✓ Limite diário de créditos preservado")
print("✓ Avaliação 1–5 preservada")
print("✓ Nota diária preservada")
print("✓ Medalha preservada")
print("✓ Modal refinado visualmente")
print("✓ console.log de debug removido")
print("✓ Sem novo estado")
print("✓ Sem novo localStorage")
print("✓ Sem novas dependências")
print("✓ PT / EN / ES / FR validados")
print()
print("Backups:")
print(f"  {BACKUP}")

for lang in LOCALES:
    print(f"  {LOCALE_BACKUPS[lang]}")

print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
