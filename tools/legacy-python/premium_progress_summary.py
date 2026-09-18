from pathlib import Path
import shutil
import sys

path = Path("src/components/HomeProgressSummary.tsx")

if not path.exists():
    print("ERRO: HomeProgressSummary.tsx não encontrado.")
    sys.exit(1)

text = path.read_text(encoding="utf-8")
original = text

shutil.copy2(
    path,
    "/tmp/HomeProgressSummary.tsx.before_premium_1B1"
)

start_marker = "  return (\n"
end_marker = "\n  );\n}"

start = text.find(start_marker)

if start == -1:
    print("ERRO: início do return não encontrado.")
    sys.exit(1)

end = text.rfind(end_marker)

if end == -1 or end <= start:
    print("ERRO: fim do return não encontrado.")
    sys.exit(1)

old_return = text[start:end + len("\n  );")]

# Segurança: confirmar que estamos no componente esperado.
required_old = [
    't("homeProgress.eyebrow")',
    't("homeProgress.title")',
    't("homeProgress.subtitle")',
    't("homeProgress.mood")',
    't("homeProgress.activeDays")',
    't("homeProgress.objectives")',
    't("homeProgress.feedbackTitle")',
    't("homeProgress.period")',
    't(reactiveResult.response.translationKey)',
]

for item in required_old:
    if item not in old_return:
        print(f"ERRO: estrutura esperada não encontrada: {item}")
        sys.exit(1)

new_return = """  return (
    <section className="mx-1 mt-3 mb-2 rounded-[26px] border border-[#E8DDD7]/80 bg-white/80 px-4 py-4">

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
      </div>

      {/* Indicadores principais */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-[#E8DDD7]/70">

        <div className="px-2 text-center">
          <div className="text-base font-black text-[#4E3B36]">
            {moodText}
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.mood")}
          </div>
        </div>

        <div className="px-2 text-center">
          <div className="text-base font-black text-[#4E3B36]">
            {analysis.activeDays}/7
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.activeDays")}
          </div>
        </div>

        <div className="px-2 text-center">
          <div className="text-base font-black text-[#4E3B36]">
            {objectiveText}
          </div>

          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {t("homeProgress.objectives")}
          </div>
        </div>

      </div>

      {/* Leitura reativa */}
      <div className="mt-3 flex items-start gap-2.5 border-t border-[#E8DDD7]/60 pt-3">

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#FAF7F5] text-sm font-bold text-[#C97B5E]">
          {trendIcon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black text-[#4E3B36]">
            {t("homeProgress.feedbackTitle")}
          </p>

          <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500">
            {t(reactiveResult.response.translationKey)}
          </p>
        </div>

      </div>

      {/* XP discreto */}
      <div className="mt-2 flex justify-end">
        <span className="text-[9px] font-black text-[#C97B5E]">
          {analysis.xp} XP
        </span>
      </div>

    </section>
  );"""

text = text[:start] + new_return + text[end + len("\n  );"):]

# =========================================================
# VERIFICAÇÕES DE SEGURANÇA
# =========================================================

required_after = [
    "collectCompanionData()",
    "analyzeReactiveState()",
    "recordReactiveResponse({",
    "analysis.averageMood",
    "analysis.activeDays",
    "analysis.objectivesCompleted",
    "analysis.objectivesTotal",
    "analysis.xp",
    't("homeProgress.mood")',
    't("homeProgress.activeDays")',
    't("homeProgress.objectives")',
    't("homeProgress.feedbackTitle")',
    't("homeProgress.period")',
    't(reactiveResult.response.translationKey)',
]

for item in required_after:
    if item not in text:
        print(f"ERRO de segurança: desapareceu {item}")
        sys.exit(1)

if text == original:
    print("ERRO: nenhuma alteração produzida.")
    sys.exit(1)

path.write_text(text, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM HOME 1B.1")
print("=" * 72)
print("✓ Resumo semanal convertido para formato compacto")
print("✓ Média de humor preservada")
print("✓ Dias ativos preservados")
print("✓ Objetivos preservados")
print("✓ XP preservado")
print("✓ Tendência preservada")
print("✓ Resposta reativa preservada")
print("✓ Histórico reativo preservado")
print("✓ collectCompanionData preservado")
print("✓ Zero traduções novas")
print("✓ PT / EN / ES / FR preservados")
print("✓ Zero bibliotecas novas")
print("✓ Zero assets novos")
print("✓ Menos caixas e menos sombra")
print()
print("OK — Fase 1B.1 aplicada.")
