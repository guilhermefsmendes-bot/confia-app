from pathlib import Path
import shutil
import sys

app_path = Path("src/App.tsx")
summary_path = Path("src/components/HomeProgressSummary.tsx")

if not app_path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

if not summary_path.exists():
    print("ERRO: HomeProgressSummary.tsx não encontrado.")
    sys.exit(1)

app = app_path.read_text(encoding="utf-8")
summary = summary_path.read_text(encoding="utf-8")

original_app = app
original_summary = summary

shutil.copy2(
    app_path,
    "/tmp/App.tsx.before_premium_1B2"
)

shutil.copy2(
    summary_path,
    "/tmp/HomeProgressSummary.tsx.before_premium_1B2"
)

# =========================================================
# PARTE A — HomeProgressSummary passa a ser apenas factual
# =========================================================

# React imports
old = 'import React, { useEffect, useMemo } from "react";'
new = 'import React, { useMemo } from "react";'

if old not in summary:
    print("ERRO: import React esperado não encontrado.")
    sys.exit(1)

summary = summary.replace(old, new, 1)

# Remover imports do motor reativo e histórico
old = '''import {
  analyzeReactiveState,
} from "../data/reactive/reactiveEngine";
import {
  recordReactiveResponse,
} from "../data/reactive/reactiveHistoryStorage";
'''

if old not in summary:
    print("ERRO: imports reativos do resumo não encontrados.")
    sys.exit(1)

summary = summary.replace(old, "", 1)

# Remover reactiveResult + useEffect de histórico
start_marker = '''  /**
   * A análise reativa é calculada quando este resumo entra
   * no ecrã. O motor escolhe situação, intenção e resposta.
   */
'''

end_marker = '''  const analysis = useMemo(() => {
'''

start = summary.find(start_marker)
end = summary.find(end_marker)

if start == -1 or end == -1 or end <= start:
    print("ERRO: bloco reativo do HomeProgressSummary não encontrado.")
    sys.exit(1)

summary = summary[:start] + end_marker + summary[end + len(end_marker):]

# Remover feedbackKey, já sem utilidade
old = '''    let feedbackKey = "homeProgress.feedback.noData";

    if (trend === "up") {
      feedbackKey = "homeProgress.feedback.improving";
    } else if (trend === "down") {
      feedbackKey = "homeProgress.feedback.difficult";
    } else if (trend === "stable") {
      feedbackKey = "homeProgress.feedback.stable";
    } else if (activeDays > 0) {
      feedbackKey = "homeProgress.feedback.active";
    }

'''

if old not in summary:
    print("ERRO: feedbackKey antigo não encontrado.")
    sys.exit(1)

summary = summary.replace(old, "", 1)

# Remover feedbackKey do return da análise
old = '''      trend,
      feedbackKey,
      xp: data.xp,
'''

new = '''      trend,
      xp: data.xp,
'''

if old not in summary:
    print("ERRO: feedbackKey no objeto de análise não encontrado.")
    sys.exit(1)

summary = summary.replace(old, new, 1)

# Remover trendIcon, já que não haverá segunda mensagem
start_marker = '''  const trendIcon =
'''
end_marker = '''  return (
'''

start = summary.find(start_marker)
end = summary.find(end_marker)

if start == -1 or end == -1 or end <= start:
    print("ERRO: trendIcon não encontrado.")
    sys.exit(1)

summary = summary[:start] + end_marker + summary[end + len(end_marker):]

# Remover bloco visual de leitura reativa
start_marker = '''      {/* Leitura reativa */}
'''
end_marker = '''      {/* XP discreto */}
'''

start = summary.find(start_marker)
end = summary.find(end_marker)

if start == -1 or end == -1 or end <= start:
    print("ERRO: bloco visual de leitura reativa não encontrado.")
    sys.exit(1)

summary = summary[:start] + end_marker + summary[end + len(end_marker):]

# =========================================================
# PARTE B — App: insight antes do resumo semanal
# =========================================================

old = '''  <HomeProgressSummary />

  {reactiveMessageKey && (
  <div className="mt-5 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#E5A88B]/15">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-[#C97B5E] font-display">
          {t("reactiveInsightTitle")}
        </p>

        <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#4E3B36]">
          {t(reactiveMessageKey)}
        </p>
      </div>
    </div>
  </div>
)}
'''

new = '''  {reactiveMessageKey && (
  <div className="mt-4 rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#E5A88B]/15">
        <Sparkles
          size={18}
          strokeWidth={1.8}
          className="text-[#C97B5E]"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wider text-[#C97B5E] font-display">
          {t("reactiveInsightTitle")}
        </p>

        <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#4E3B36]">
          {t(reactiveMessageKey)}
        </p>
      </div>
    </div>
  </div>
)}

  <HomeProgressSummary />
'''

if old not in app:
    print("ERRO: bloco HomeProgressSummary + insight não encontrado no App.tsx.")
    sys.exit(1)

app = app.replace(old, new, 1)

# =========================================================
# VERIFICAÇÕES DE SEGURANÇA
# =========================================================

summary_forbidden = [
    "analyzeReactiveState",
    "recordReactiveResponse",
    "sessionStorage",
    "reactiveResult",
    "feedbackKey",
]

for item in summary_forbidden:
    if item in summary:
        print(f"ERRO: ainda existe lógica reativa duplicada no resumo: {item}")
        sys.exit(1)

summary_required = [
    "collectCompanionData()",
    "analysis.averageMood",
    "analysis.activeDays",
    "analysis.objectivesCompleted",
    "analysis.objectivesTotal",
    "analysis.xp",
    't("homeProgress.mood")',
    't("homeProgress.activeDays")',
    't("homeProgress.objectives")',
]

for item in summary_required:
    if item not in summary:
        print(f"ERRO de segurança no resumo: desapareceu {item}")
        sys.exit(1)

app_required = [
    'analyzeReactiveState({',
    'recordReactiveResponse({',
    'setReactiveMessageKey(',
    't("reactiveInsightTitle")',
    't(reactiveMessageKey)',
    "<HomeProgressSummary />",
]

for item in app_required:
    if item not in app:
        print(f"ERRO de segurança no App: desapareceu {item}")
        sys.exit(1)

if app == original_app:
    print("ERRO: App.tsx não foi alterado.")
    sys.exit(1)

if summary == original_summary:
    print("ERRO: HomeProgressSummary não foi alterado.")
    sys.exit(1)

summary_path.write_text(summary, encoding="utf-8")
app_path.write_text(app, encoding="utf-8")

print("=" * 72)
print("CONFIA — PREMIUM HOME 1B.2")
print("=" * 72)
print("✓ Uma única voz reativa na Home")
print("✓ Insight da Confia passou para antes do resumo semanal")
print("✓ HomeProgressSummary passou a ser apenas factual")
print("✓ Análise reativa duplicada removida do resumo")
print("✓ Escrita duplicada no histórico removida")
print("✓ sessionStorage removido do resumo")
print("✓ collectCompanionData preservado")
print("✓ Humor médio preservado")
print("✓ Dias ativos preservados")
print("✓ Objetivos preservados")
print("✓ XP preservado")
print("✓ analyzeReactiveState preservado no App")
print("✓ recordReactiveResponse preservado no registo explícito")
print("✓ Zero traduções novas")
print("✓ PT / EN / ES / FR preservados")
print("✓ Zero bibliotecas novas")
print("✓ Zero assets novos")
print("✓ Menos lógica executada ao montar a Home")
print()
print("OK — Fase 1B.2 aplicada.")
