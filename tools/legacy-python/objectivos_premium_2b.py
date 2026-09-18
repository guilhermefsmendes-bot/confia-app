from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2B
# Identidade premium + progresso diário
#
# ALTERA:
# - src/components/ObjectivosList.tsx
# - src/locales/pt.json
# - src/locales/en.json
# - src/locales/es.json
# - src/locales/fr.json
#
# NÃO ALTERA:
# - lógica de conclusão
# - callbacks
# - XP real
# - storage
# - histórico
# - objetivo semanal
# - Reactive Engine
# - navegação
# ============================================================

ROOT = Path.cwd()

COMPONENT = ROOT / "src/components/ObjectivosList.tsx"

LOCALES = {
    "pt": ROOT / "src/locales/pt.json",
    "en": ROOT / "src/locales/en.json",
    "es": ROOT / "src/locales/es.json",
    "fr": ROOT / "src/locales/fr.json",
}

BACKUP_COMPONENT = Path(
    "/tmp/ObjectivosList.tsx.before_objectives_2b"
)

LOCALE_BACKUPS = {
    lang: Path(
        f"/tmp/{lang}.json.before_objectives_2b"
    )
    for lang in LOCALES
}


def fail(message: str):
    print()
    print("ERRO:")
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

if not COMPONENT.exists():
    fail(f"Não encontrei {COMPONENT}")

for lang, path in LOCALES.items():
    if not path.exists():
        fail(f"Não encontrei locale {lang}: {path}")


# ============================================================
# 2. LER TUDO ANTES DE ALTERAR
# ============================================================

component_original = COMPONENT.read_text(
    encoding="utf-8"
)

locale_original_text = {}
locale_data = {}

for lang, path in LOCALES.items():
    raw = path.read_text(encoding="utf-8")
    locale_original_text[lang] = raw

    try:
        locale_data[lang] = json.loads(raw)
    except Exception as exc:
        fail(
            f"{path} não é JSON válido antes da alteração: "
            f"{exc}"
        )


# ============================================================
# 3. GUARDRAILS DO COMPONENTE
# ============================================================

required_component_markers = [
    "const completedCount = objectives.filter(o => o.completed).length;",
    "onToggleComplete(objective.id)",
    "onAddCustomObjective(newText.trim(), newCategory)",
    "onDeleteObjective(objective.id)",
    "objective.xpReward",
    "objectives.map(objective =>",
]

for marker in required_component_markers:
    if marker not in component_original:
        fail(
            "Estrutura inesperada em ObjectivosList.tsx.\n"
            f"Falta: {marker}"
        )


old_metrics = """  const completedCount = objectives.filter(o => o.completed).length;

  return ("""

if component_original.count(old_metrics) != 1:
    fail(
        "Não encontrei exatamente uma vez o ponto "
        "onde devem ser calculadas as métricas."
    )


old_header_progress = """      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#4E3B36] flex items-center gap-1.5 font-display">
           <span className="text-[#E5A88B]">🎯</span> {t("smallAchievements")}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
{t("goalsDescription")}
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-tr from-[#E5A88B]/10 to-[#FFF0E8]/5 p-5 rounded-[24px] border border-[#E5A88B]/25 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-[#C97B5E] uppercase tracking-widest font-display">{t("dailyGoalsTitle")}</span>
          <h3 className="text-sm font-black text-[#4E3B36]">
          {t("completedGoals", {
  completed: completedCount,
  total: objectives.length,
})}
          </h3>
        </div>

<div className="relative flex items-center justify-center w-12 h-12 bg-white rounded-full border border-[#E5A88B]/30 shadow-md">
          <Award size={20} className="text-[#C97B5E] animate-pulse" />
        </div>
      </div>"""

if component_original.count(old_header_progress) != 1:
    fail(
        "O cabeçalho/progresso atual não corresponde "
        "à versão auditada.\n"
        "O script foi interrompido por segurança."
    )


# ============================================================
# 4. PREPARAR NOVO COMPONENTE EM MEMÓRIA
# ============================================================

new_metrics = """  const completedCount = objectives.filter(o => o.completed).length;

  const completionPercentage =
    objectives.length > 0
      ? Math.round((completedCount / objectives.length) * 100)
      : 0;

  const earnedXp = objectives
    .filter(objective => objective.completed)
    .reduce((total, objective) => total + objective.xpReward, 0);

  return ("""

component_new = component_original.replace(
    old_metrics,
    new_metrics,
    1
)


new_header_progress = """      {/* 2B — Identidade premium + progresso diário */}
      <section className="relative overflow-hidden rounded-[30px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] via-white to-[#FFF0E8]/70 p-5 shadow-sm">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#E5A88B]/10 blur-2xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[#F5D6C6]/15 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#E5A88B]/25 bg-white text-[#C97B5E] shadow-sm">
                  <Award size={16} strokeWidth={2.2} />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E] font-display">
                  {t("objectivesPremium.eyebrow")}
                </span>
              </div>

              <h2 className="text-[22px] font-black leading-tight text-[#4E3B36] font-display">
                {t("objectivesPremium.title")}
              </h2>

              <p className="mt-1.5 max-w-[290px] text-xs font-medium leading-relaxed text-[#7A6A64]">
                {t("objectivesPremium.subtitle")}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-[#E5A88B]/20 bg-white/85 px-3 py-2 text-right shadow-sm">
              <div className="text-lg font-black leading-none text-[#4E3B36] font-display">
                {completionPercentage}%
              </div>

              <div className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-[#A88A7D]">
                {t("objectivesPremium.today")}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A88A7D]">
                  {t("objectivesPremium.todayProgress")}
                </p>

                <p className="mt-1 text-sm font-black text-[#4E3B36]">
                  {t("completedGoals", {
                    completed: completedCount,
                    total: objectives.length,
                  })}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5A88B]/20 bg-[#FFF7F2] px-2.5 py-1.5 text-[#C97B5E]">
                <Sparkles size={12} />

                <span className="text-[10px] font-black">
                  +{earnedXp} XP
                </span>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3E7E1]">
              <motion.div
                initial={false}
                animate={{
                  width: `${completionPercentage}%`
                }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut"
                }}
                className="h-full rounded-full bg-gradient-to-r from-[#E5A88B] to-[#C97B5E]"
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold text-[#9B857B]">
                {t("objectivesPremium.progressHint")}
              </span>

              <span className="shrink-0 text-[10px] font-black text-[#C97B5E]">
                {completedCount}/{objectives.length}
              </span>
            </div>
          </div>
        </div>
      </section>"""

component_new = component_new.replace(
    old_header_progress,
    new_header_progress,
    1
)


# ============================================================
# 5. TRADUÇÕES
# ============================================================

translations = {
    "pt": {
        "eyebrow": "O teu progresso",
        "title": "O teu caminho",
        "subtitle": (
            "Cada pequena ação conta. Hoje estás a construir "
            "o teu caminho, um passo de cada vez."
        ),
        "today": "Hoje",
        "todayProgress": "Progresso de hoje",
        "progressHint": "Pequenas ações também são progresso."
    },
    "en": {
        "eyebrow": "Your progress",
        "title": "Your path",
        "subtitle": (
            "Every small action counts. Today you're building "
            "your path, one step at a time."
        ),
        "today": "Today",
        "todayProgress": "Today's progress",
        "progressHint": "Small actions are progress too."
    },
    "es": {
        "eyebrow": "Tu progreso",
        "title": "Tu camino",
        "subtitle": (
            "Cada pequeña acción cuenta. Hoy estás construyendo "
            "tu camino, paso a paso."
        ),
        "today": "Hoy",
        "todayProgress": "Progreso de hoy",
        "progressHint": "Las pequeñas acciones también son progreso."
    },
    "fr": {
        "eyebrow": "Ta progression",
        "title": "Ton chemin",
        "subtitle": (
            "Chaque petite action compte. Aujourd'hui, tu construis "
            "ton chemin, un pas après l'autre."
        ),
        "today": "Aujourd'hui",
        "todayProgress": "Progression du jour",
        "progressHint": "Les petites actions sont aussi des progrès."
    },
}


# ============================================================
# 6. VALIDAR E PREPARAR LOCALES EM MEMÓRIA
# ============================================================

locale_new_text = {}

for lang, data in locale_data.items():
    if "objectivesPremium" in data:
        fail(
            f'A chave "objectivesPremium" já existe em {lang}. '
            "Não vou sobrescrevê-la automaticamente."
        )

    new_data = dict(data)
    new_data["objectivesPremium"] = translations[lang]

    # Serialização controlada.
    # Mantemos UTF-8 legível.
    rendered = json.dumps(
        new_data,
        ensure_ascii=False,
        indent=2
    ) + "\n"

    # Validar novamente antes de escrever.
    try:
        check = json.loads(rendered)
    except Exception as exc:
        fail(
            f"Falha ao validar locale preparado {lang}: {exc}"
        )

    required_keys = {
        "eyebrow",
        "title",
        "subtitle",
        "today",
        "todayProgress",
        "progressHint",
    }

    if set(check["objectivesPremium"].keys()) != required_keys:
        fail(
            f"Estrutura objectivesPremium inválida em {lang}"
        )

    locale_new_text[lang] = rendered


# ============================================================
# 7. GUARDRAILS PÓS-TRANSFORMAÇÃO
# ============================================================

post_markers = [
    "const completionPercentage =",
    "const earnedXp = objectives",
    't("objectivesPremium.eyebrow")',
    't("objectivesPremium.title")',
    't("objectivesPremium.subtitle")',
    't("objectivesPremium.today")',
    't("objectivesPremium.todayProgress")',
    't("objectivesPremium.progressHint")',
    "onToggleComplete(objective.id)",
    "onAddCustomObjective(newText.trim(), newCategory)",
    "onDeleteObjective(objective.id)",
]

for marker in post_markers:
    if marker not in component_new:
        fail(
            "Falhou guardrail pós-transformação:\n"
            f"{marker}"
        )

# Garantir que não duplicámos o bloco premium.
if component_new.count(
    't("objectivesPremium.title")'
) != 1:
    fail(
        "A nova identidade premium ficou duplicada."
    )


# ============================================================
# 8. BACKUPS
# ============================================================

shutil.copy2(
    COMPONENT,
    BACKUP_COMPONENT
)

for lang, path in LOCALES.items():
    shutil.copy2(
        path,
        LOCALE_BACKUPS[lang]
    )


# ============================================================
# 9. ESCREVER
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
# 10. VALIDAÇÃO FINAL EM DISCO
# ============================================================

written_component = COMPONENT.read_text(
    encoding="utf-8"
)

if written_component.count(
    't("objectivesPremium.title")'
) != 1:
    fail(
        "Validação final falhou no componente."
    )

for lang, path in LOCALES.items():
    try:
        written = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        fail(
            f"Locale {lang} ficou inválido após escrita: {exc}"
        )

    if written.get(
        "objectivesPremium"
    ) != translations[lang]:
        fail(
            f"Locale {lang}: objectivesPremium não corresponde "
            "ao conteúdo esperado."
        )


# ============================================================
# 11. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2B")
print("=" * 72)
print()
print("✓ Identidade 'O teu caminho' adicionada")
print("✓ Progresso diário visual adicionado")
print("✓ Percentagem calculada a partir dos objetivos reais")
print("✓ XP mostrado a partir dos objetivos concluídos")
print("✓ Barra de progresso leve adicionada")
print("✓ Callbacks de objetivos preservados")
print("✓ Criação de objetivo preservada")
print("✓ Eliminação de objetivo personalizado preservada")
print("✓ Sem novo estado")
print("✓ Sem novo localStorage")
print("✓ Sem novas dependências")
print("✓ PT / EN / ES / FR atualizados e validados")
print()
print("Backups:")
print(f"  {BACKUP_COMPONENT}")

for lang in LOCALES:
    print(f"  {LOCALE_BACKUPS[lang]}")

print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
