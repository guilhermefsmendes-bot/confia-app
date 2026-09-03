from pathlib import Path
import shutil
import json
import sys

app_path = Path("src/App.tsx")
summary_path = Path("src/components/HomeProgressSummary.tsx")

locale_values = {
    "pt": {
        "title": "Hoje",
        "subtitle": "O teu momento, num só lugar",
    },
    "en": {
        "title": "Today",
        "subtitle": "Your moment, in one place",
    },
    "es": {
        "title": "Hoy",
        "subtitle": "Tu momento, en un solo lugar",
    },
    "fr": {
        "title": "Aujourd'hui",
        "subtitle": "Ton moment, en un seul endroit",
    },
}

# ============================================================
# CONFIA — PRINCIPAL PREMIUM 1B.5A.2
#
# Objetivo:
# - criar uma área "Hoje"
# - integrar o resumo semanal nessa área
# - ligar visualmente o registo diário ao resumo
# - preservar toda a lógica existente
# - preservar PT / EN / ES / FR
# ============================================================

# ------------------------------------------------------------
# 0. Verificações iniciais
# ------------------------------------------------------------

for path in [app_path, summary_path]:
    if not path.exists():
        print(f"ERRO: {path} não encontrado.")
        sys.exit(1)

app = app_path.read_text(encoding="utf-8")
summary = summary_path.read_text(encoding="utf-8")

original_app = app
original_summary = summary

# ------------------------------------------------------------
# 1. HomeProgressSummary passa a abrir visualmente a área Hoje
# ------------------------------------------------------------

old_summary_start = '''    <section className="mx-1 mt-3 mb-2 rounded-[26px] border border-[#E8DDD7]/80 bg-white/80 px-4 py-4">

      {/* Cabeçalho compacto */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#C97B5E]">
            {t("homeProgress.eyebrow")}
          </p>

          <h3 className="mt-0.5 text-base font-black tracking-tight text-[#4E3B36]">
            {t("homeProgress.title")}
          </h3>
        </div>

        <span className="shrink-0 pt-1 text-[9px] font-bold text-slate-400">
          {t("homeProgress.period")}
        </span>
      </div>'''

new_summary_start = '''    <section className="overflow-hidden rounded-t-[30px] border border-b-0 border-[#E8DDD7]/70 bg-gradient-to-b from-[#FFFDFC] to-[#FFF9F5] px-5 pt-5 pb-4">

      {/* Identidade da área Hoje */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
            {t("homeToday.title")}
          </p>

          <h3 className="mt-1 text-base font-black tracking-tight text-[#4E3B36]">
            {t("homeToday.subtitle")}
          </h3>
        </div>

        <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold text-slate-400">
          {t("homeProgress.period")}
        </span>
      </div>'''

if summary.count(old_summary_start) != 1:
    print(
        "ERRO: início esperado de HomeProgressSummary "
        "não encontrado exatamente uma vez."
    )
    sys.exit(1)

summary = summary.replace(
    old_summary_start,
    new_summary_start,
    1
)

# ------------------------------------------------------------
# 2. Refinar apresentação discreta do XP
# ------------------------------------------------------------

old_xp = '''      {/* XP discreto */}
      <div className="mt-2 flex justify-end">
        <span className="text-[9px] font-black text-[#C97B5E]">
          {analysis.xp} XP
        </span>
      </div>'''

new_xp = '''      {/* XP discreto */}
      <div className="mt-3 flex items-center justify-end border-t border-[#E8DDD7]/50 pt-2.5">
        <span className="text-[9px] font-black tracking-wide text-[#C97B5E]">
          {analysis.xp} XP
        </span>
      </div>'''

if summary.count(old_xp) != 1:
    print(
        "ERRO: bloco XP esperado não encontrado "
        "exatamente uma vez."
    )
    sys.exit(1)

summary = summary.replace(
    old_xp,
    new_xp,
    1
)

# ------------------------------------------------------------
# 3. Retirar HomeProgressSummary da posição antiga
# ------------------------------------------------------------

old_progress_position = '''  <HomeProgressSummary />

  </>
)}'''

new_progress_position = '''  </>
)}'''

if app.count(old_progress_position) != 1:
    print(
        "ERRO: posição antiga de HomeProgressSummary "
        "não encontrada exatamente uma vez."
    )
    sys.exit(1)

app = app.replace(
    old_progress_position,
    new_progress_position,
    1
)

# ------------------------------------------------------------
# 4. Criar a nova área Hoje imediatamente antes
#    do registo diário
# ------------------------------------------------------------

daily_anchor = '''              {/* Registo diário premium — progressivo e leve */}
              <section className="overflow-hidden rounded-[28px] border border-[#E5A88B]/15 bg-white shadow-sm">'''

daily_new = '''              {/* Hoje — resumo + registo diário */}
              <div className="mt-1">
                <HomeProgressSummary />

                {/* Registo diário premium — integrado na área Hoje */}
                <section className="overflow-hidden rounded-b-[30px] border border-[#E8DDD7]/70 bg-white shadow-[0_12px_30px_rgba(92,64,52,0.06)]">'''

if app.count(daily_anchor) != 1:
    print(
        "ERRO: início do registo diário não encontrado "
        "exatamente uma vez."
    )
    sys.exit(1)

app = app.replace(
    daily_anchor,
    daily_new,
    1
)

# ------------------------------------------------------------
# 5. Fechar corretamente o wrapper da área Hoje
#
# Esta âncora corresponde ao JSX REAL do App.tsx:
#
# </section>
#
# </div>
#
# </div>
# )}
# ------------------------------------------------------------

old_daily_end = '''              </section>

</div>

            </div>
          )}'''

new_daily_end = '''                </section>
              </div>

</div>

            </div>
          )}'''

if app.count(old_daily_end) != 1:
    print(
        "ERRO: fim real do registo diário não encontrado "
        "exatamente uma vez."
    )
    print("Nenhuma alteração foi escrita.")
    sys.exit(1)

app = app.replace(
    old_daily_end,
    new_daily_end,
    1
)

# ------------------------------------------------------------
# 6. Preparar traduções PT / EN / ES / FR
# ------------------------------------------------------------

locale_data = {}

for lang, values in locale_values.items():
    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        print(f"ERRO: locale ausente: {path}")
        sys.exit(1)

    try:
        data = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        print(f"ERRO ao ler {path}: {exc}")
        sys.exit(1)

    # Não sobrescreve silenciosamente conteúdo existente.
    if "homeToday" in data:
        existing = data["homeToday"]

        if existing != values:
            print(
                f"ERRO: homeToday já existe com "
                f"conteúdo diferente em {path}."
            )
            sys.exit(1)
    else:
        data["homeToday"] = values

    locale_data[path] = data

# ------------------------------------------------------------
# 7. Verificações do App antes de escrever
# ------------------------------------------------------------

required_app = [
    "<HomeProgressSummary />",
    "Hoje — resumo + registo diário",
    "integrado na área Hoje",
    "rounded-b-[30px]",
    "showDayRatingPanel",
    "handleSaveRatings",
    "selectedDate",
    "morningRating",
    "afternoonRating",
    "noteText",
    "todayLogged",
]

for fragment in required_app:
    if fragment not in app:
        print(
            f"ERRO App.tsx: verificação falhou: "
            f"{fragment}"
        )
        sys.exit(1)

if app.count("<HomeProgressSummary />") != 1:
    print(
        "ERRO: HomeProgressSummary deve existir "
        "exatamente uma vez no App.tsx."
    )
    sys.exit(1)

# ------------------------------------------------------------
# 8. Verificações do HomeProgressSummary
# ------------------------------------------------------------

required_summary = [
    't("homeToday.title")',
    't("homeToday.subtitle")',
    't("homeProgress.period")',
    't("homeProgress.mood")',
    't("homeProgress.activeDays")',
    't("homeProgress.objectives")',
    "analysis.activeDays",
    "analysis.xp",
    "objectiveText",
    "moodText",
]

for fragment in required_summary:
    if fragment not in summary:
        print(
            f"ERRO HomeProgressSummary: "
            f"verificação falhou: {fragment}"
        )
        sys.exit(1)

# ------------------------------------------------------------
# 9. Confirmar que houve alterações
# ------------------------------------------------------------

if app == original_app:
    print("ERRO: App.tsx não sofreu alterações.")
    sys.exit(1)

if summary == original_summary:
    print(
        "ERRO: HomeProgressSummary.tsx "
        "não sofreu alterações."
    )
    sys.exit(1)

# ------------------------------------------------------------
# 10. Backups fora do projeto
# ------------------------------------------------------------

shutil.copy2(
    app_path,
    "/tmp/App.tsx.before_principal_today"
)

shutil.copy2(
    summary_path,
    "/tmp/HomeProgressSummary.tsx.before_principal_today"
)

for path in locale_data:
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_principal_today"
    )

# ------------------------------------------------------------
# 11. Escrita
# ------------------------------------------------------------

app_path.write_text(
    app,
    encoding="utf-8"
)

summary_path.write_text(
    summary,
    encoding="utf-8"
)

for path, data in locale_data.items():
    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8",
    )

# ------------------------------------------------------------
# 12. Resultado
# ------------------------------------------------------------

print("=" * 72)
print("CONFIA — PRINCIPAL PREMIUM 1B.5A.2")
print("=" * 72)
print("✓ Criada área Hoje")
print("✓ Progresso semanal integrado em Hoje")
print("✓ Registo diário ligado visualmente ao resumo")
print("✓ Formulário expansível preservado")
print("✓ selectedDate preservado")
print("✓ morningRating preservado")
print("✓ afternoonRating preservado")
print("✓ noteText preservado")
print("✓ handleSaveRatings preservado")
print("✓ todayLogged preservado")
print("✓ XP preservado")
print("✓ Nenhum storage novo")
print("✓ Nenhuma dependência nova")
print("✓ PT / EN / ES / FR atualizados")
print()
print("OK — área Hoje criada.")
