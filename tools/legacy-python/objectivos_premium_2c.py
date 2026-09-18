from pathlib import Path
import json
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2C
# Objetivo em destaque + pequenas vitórias
#
# ALTERA:
# - src/components/ObjectivosList.tsx
# - src/locales/pt.json
# - src/locales/en.json
# - src/locales/es.json
# - src/locales/fr.json
#
# NÃO ALTERA:
# - callbacks
# - lógica de XP
# - histórico
# - storage
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
    "/tmp/ObjectivosList.tsx.before_objectives_2c"
)

LOCALE_BACKUPS = {
    lang: Path(
        f"/tmp/{lang}.json.before_objectives_2c"
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
        fail(f"Não encontrei {path}")


# ============================================================
# 2. LER TUDO ANTES DE ALTERAR
# ============================================================

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
        fail(
            f"{path} não é JSON válido antes da alteração: "
            f"{exc}"
        )


# ============================================================
# 3. GUARDRAILS — VERSÃO 2B
# ============================================================

required_markers = [
    "const completionPercentage =",
    "const earnedXp = objectives",
    't("objectivesPremium.title")',
    't("objectivesPremium.progressHint")',
    "onToggleComplete(objective.id)",
    "onAddCustomObjective(newText.trim(), newCategory)",
    "onDeleteObjective(objective.id)",
    "objectives.map(objective =>",
]

for marker in required_markers:
    if marker not in component_original:
        fail(
            "ObjectivosList.tsx não corresponde à versão "
            "2B esperada.\n"
            f"Falta: {marker}"
        )

if component_original.count(
    't("objectivesPremium.title")'
) != 1:
    fail(
        "O cabeçalho premium 2B está ausente ou duplicado."
    )

if "objectivesPremium.nextStep" in component_original:
    fail(
        "A 2C parece já estar aplicada."
    )


# ============================================================
# 4. IMPORT — ADICIONAR ÍCONE DE AÇÃO
# ============================================================

old_import = """import { Check, Plus, Trash2, Heart, Award, Smile, Coffee, Users, Sparkles } from 'lucide-react';"""

new_import = """import { Check, Plus, Trash2, Heart, Award, Smile, Coffee, Users, Sparkles, ArrowRight, CircleCheckBig, Footprints } from 'lucide-react';"""

if component_original.count(old_import) != 1:
    fail(
        "Import do lucide-react não corresponde "
        "à versão auditada."
    )

component_new = component_original.replace(
    old_import,
    new_import,
    1
)


# ============================================================
# 5. CATEGORIA AÇÃO
# ============================================================

old_social_case = """      case 'social':
        return {
          bg: 'bg-[#FFF0E8] text-[#8A5C50] border-[#FFF0E8]',
          badge: 'bg-[#FFF0E8] text-[#8A5C50] border border-[#E5A88B]/15',
          icon: <Users size={14} />,
         label: t("social")
        };
      case 'nutricao':
      default:"""

new_social_case = """      case 'social':
        return {
          bg: 'bg-[#FFF0E8] text-[#8A5C50] border-[#FFF0E8]',
          badge: 'bg-[#FFF0E8] text-[#8A5C50] border border-[#E5A88B]/15',
          icon: <Users size={14} />,
         label: t("social")
        };
      case 'acao':
        return {
          bg: 'bg-[#F2EDE8] text-[#765D52] border-[#E7DDD7]',
          badge: 'bg-[#F7F2EE] text-[#765D52] border border-[#E7DDD7]',
          icon: <Footprints size={14} />,
          label: t("objectivesPremium.actionCategory")
        };
      case 'nutricao':
      default:"""

if component_new.count(old_social_case) != 1:
    fail(
        "Não encontrei exatamente o bloco de categorias "
        "esperado."
    )

component_new = component_new.replace(
    old_social_case,
    new_social_case,
    1
)


# ============================================================
# 6. MÉTRICAS DERIVADAS DO ESTADO EXISTENTE
# ============================================================

old_metrics_end = """  const earnedXp = objectives
    .filter(objective => objective.completed)
    .reduce((total, objective) => total + objective.xpReward, 0);

  return ("""

new_metrics_end = """  const earnedXp = objectives
    .filter(objective => objective.completed)
    .reduce((total, objective) => total + objective.xpReward, 0);

  const featuredObjective =
    objectives.find(objective => !objective.completed) ?? null;

  const remainingObjectives = featuredObjective
    ? objectives.filter(
        objective => objective.id !== featuredObjective.id
      )
    : objectives;

  const featuredCategory = featuredObjective
    ? getCategoryStyles(featuredObjective.category)
    : null;

  const allObjectivesCompleted =
    objectives.length > 0 &&
    completedCount === objectives.length;

  return ("""

if component_new.count(old_metrics_end) != 1:
    fail(
        "Não encontrei o ponto das métricas 2B."
    )

component_new = component_new.replace(
    old_metrics_end,
    new_metrics_end,
    1
)


# ============================================================
# 7. INSERIR OBJETIVO EM DESTAQUE
# ============================================================

anchor = """      {/* Custom Objective Trigger Button */}"""

if component_new.count(anchor) != 1:
    fail(
        "Não encontrei o ponto de inserção antes "
        "do objetivo personalizado."
    )

featured_block = """      {/* 2C — Próximo passo */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
              {allObjectivesCompleted
                ? t("objectivesPremium.completedEyebrow")
                : t("objectivesPremium.nextStep")}
            </p>

            <h3 className="mt-0.5 text-base font-black text-[#4E3B36] font-display">
              {allObjectivesCompleted
                ? t("objectivesPremium.completedTitle")
                : t("objectivesPremium.nextStepTitle")}
            </h3>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
              allObjectivesCompleted
                ? "border-[#E5A88B]/30 bg-[#FFF0E8] text-[#C97B5E]"
                : "border-[#E5A88B]/20 bg-white text-[#C97B5E] shadow-sm"
            }`}
          >
            {allObjectivesCompleted ? (
              <CircleCheckBig size={19} strokeWidth={2.3} />
            ) : (
              <ArrowRight size={19} strokeWidth={2.3} />
            )}
          </div>
        </div>

        {featuredObjective && featuredCategory ? (
          <motion.div
            key={featuredObjective.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] border border-[#E5A88B]/30 bg-gradient-to-br from-[#FFF8F4] via-white to-[#FFF0E8] p-5 shadow-md shadow-[#E5A88B]/10"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#E5A88B]/10 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${featuredCategory.badge}`}>
                  {featuredCategory.icon}
                  <span>{featuredCategory.label}</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-[#E5A88B]/15 bg-white px-2.5 py-1 text-[9px] font-black text-[#C97B5E]">
                  <Sparkles size={10} />
                  +{featuredObjective.xpReward} XP
                </span>
              </div>

              <p className="mt-4 text-[17px] font-black leading-snug text-[#4E3B36] font-display">
                {t(featuredObjective.text)}
              </p>

              <p className="mt-2 text-xs font-medium leading-relaxed text-[#8A7770]">
                {t("objectivesPremium.nextStepHint")}
              </p>

              <button
                type="button"
                onClick={() =>
                  onToggleComplete(featuredObjective.id)
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] px-4 py-3.5 text-xs font-black text-white shadow-md shadow-[#E5A88B]/20 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Check size={16} strokeWidth={3} />
                {t("objectivesPremium.completeStep")}
              </button>
            </div>
          </motion.div>
        ) : allObjectivesCompleted ? (
          <div className="rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF9F5] to-[#FFF0E8]/70 p-5 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5A88B]/25 bg-white text-[#C97B5E] shadow-sm">
              <CircleCheckBig size={23} strokeWidth={2.3} />
            </div>

            <p className="mt-3 text-sm font-black text-[#4E3B36]">
              {t("objectivesPremium.allDone")}
            </p>

            <p className="mx-auto mt-1.5 max-w-[290px] text-xs font-medium leading-relaxed text-[#8A7770]">
              {t("objectivesPremium.allDoneHint")}
            </p>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#E5A88B]/25 bg-[#FFF9F5] p-4 text-center">
            <p className="text-xs font-semibold text-[#8A7770]">
              {t("objectivesPremium.noObjectives")}
            </p>
          </div>
        )}
      </section>

      {/* Custom Objective Trigger Button */}"""

component_new = component_new.replace(
    anchor,
    featured_block,
    1
)


# ============================================================
# 8. TRANSFORMAR LISTA EM "PEQUENAS VITÓRIAS"
# ============================================================

old_stack_start = """      {/* Objectives Stack */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {objectives.map(objective => {"""

new_stack_start = """      {/* 2C — Pequenas vitórias */}
      {remainingObjectives.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A88A7D]">
                {t("objectivesPremium.smallWinsEyebrow")}
              </p>

              <h3 className="mt-0.5 text-base font-black text-[#4E3B36] font-display">
                {t("objectivesPremium.smallWins")}
              </h3>
            </div>

            <span className="shrink-0 rounded-full border border-[#E5A88B]/15 bg-[#FFF8F4] px-2.5 py-1 text-[9px] font-black text-[#A06E5B]">
              {completedCount}/{objectives.length}
            </span>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {remainingObjectives.map(objective => {"""

if component_new.count(old_stack_start) != 1:
    fail(
        "Não encontrei o início da lista de objetivos."
    )

component_new = component_new.replace(
    old_stack_start,
    new_stack_start,
    1
)


# O ficheiro termina este bloco com:
#         </AnimatePresence>
#       </div>
#     </div>
#   );
# };
#
# Precisamos fechar também o novo <section> condicional.

old_stack_end = """        </AnimatePresence>
      </div>
    </div>
  );
};"""

new_stack_end = """            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
};"""

if component_new.count(old_stack_end) != 1:
    fail(
        "Não encontrei o final da lista na forma esperada."
    )

component_new = component_new.replace(
    old_stack_end,
    new_stack_end,
    1
)


# ============================================================
# 9. TRADUÇÕES 2C
# ============================================================

translations = {
    "pt": {
        "nextStep": "Próximo passo",
        "nextStepTitle": "Um passo de cada vez",
        "nextStepHint": (
            "Não precisas de fazer tudo agora. "
            "Começa por esta pequena ação."
        ),
        "completeStep": "Concluir este passo",
        "smallWinsEyebrow": "O resto do teu dia",
        "smallWins": "Pequenas vitórias",
        "completedEyebrow": "Hoje",
        "completedTitle": "Caminho concluído",
        "allDone": "Concluíste todos os objetivos de hoje",
        "allDoneHint": (
            "Cada passo contou. Aproveita este momento "
            "antes de pensares no próximo."
        ),
        "noObjectives": (
            "Ainda não tens um próximo passo. "
            "Podes criar um objetivo teu abaixo."
        ),
        "actionCategory": "Ação"
    },
    "en": {
        "nextStep": "Next step",
        "nextStepTitle": "One step at a time",
        "nextStepHint": (
            "You don't need to do everything now. "
            "Start with this small action."
        ),
        "completeStep": "Complete this step",
        "smallWinsEyebrow": "The rest of your day",
        "smallWins": "Small wins",
        "completedEyebrow": "Today",
        "completedTitle": "Path completed",
        "allDone": "You've completed all of today's goals",
        "allDoneHint": (
            "Every step counted. Take in this moment "
            "before thinking about the next one."
        ),
        "noObjectives": (
            "You don't have a next step yet. "
            "You can create your own goal below."
        ),
        "actionCategory": "Action"
    },
    "es": {
        "nextStep": "Siguiente paso",
        "nextStepTitle": "Un paso cada vez",
        "nextStepHint": (
            "No necesitas hacerlo todo ahora. "
            "Empieza por esta pequeña acción."
        ),
        "completeStep": "Completar este paso",
        "smallWinsEyebrow": "El resto de tu día",
        "smallWins": "Pequeñas victorias",
        "completedEyebrow": "Hoy",
        "completedTitle": "Camino completado",
        "allDone": "Has completado todos los objetivos de hoy",
        "allDoneHint": (
            "Cada paso ha contado. Disfruta de este momento "
            "antes de pensar en el siguiente."
        ),
        "noObjectives": (
            "Todavía no tienes un siguiente paso. "
            "Puedes crear tu propio objetivo abajo."
        ),
        "actionCategory": "Acción"
    },
    "fr": {
        "nextStep": "Prochaine étape",
        "nextStepTitle": "Un pas à la fois",
        "nextStepHint": (
            "Tu n'as pas besoin de tout faire maintenant. "
            "Commence par cette petite action."
        ),
        "completeStep": "Terminer cette étape",
        "smallWinsEyebrow": "Le reste de ta journée",
        "smallWins": "Petites victoires",
        "completedEyebrow": "Aujourd'hui",
        "completedTitle": "Parcours accompli",
        "allDone": "Tu as accompli tous les objectifs du jour",
        "allDoneHint": (
            "Chaque pas a compté. Profite de ce moment "
            "avant de penser au suivant."
        ),
        "noObjectives": (
            "Tu n'as pas encore de prochaine étape. "
            "Tu peux créer ton propre objectif ci-dessous."
        ),
        "actionCategory": "Action"
    },
}


# ============================================================
# 10. PREPARAR LOCALES SEM DESTRUIR 2B
# ============================================================

locale_new_text = {}

for lang, data in locale_data.items():
    premium = data.get("objectivesPremium")

    if not isinstance(premium, dict):
        fail(
            f"{lang}: objectivesPremium da 2B não existe "
            "ou não é um objeto."
        )

    expected_2b = {
        "eyebrow",
        "title",
        "subtitle",
        "today",
        "todayProgress",
        "progressHint",
    }

    missing_2b = expected_2b - set(premium.keys())

    if missing_2b:
        fail(
            f"{lang}: faltam chaves da 2B: "
            + ", ".join(sorted(missing_2b))
        )

    collision = (
        set(translations[lang].keys())
        & set(premium.keys())
    )

    if collision:
        fail(
            f"{lang}: chaves 2C já existem: "
            + ", ".join(sorted(collision))
        )

    new_data = dict(data)

    new_premium = dict(premium)
    new_premium.update(translations[lang])

    new_data["objectivesPremium"] = new_premium

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

    for key, value in translations[lang].items():
        if (
            parsed["objectivesPremium"].get(key)
            != value
        ):
            fail(
                f"{lang}: falhou validação da chave {key}"
            )

    locale_new_text[lang] = rendered


# ============================================================
# 11. GUARDRAILS PÓS-TRANSFORMAÇÃO
# ============================================================

post_markers = [
    "const featuredObjective =",
    "const remainingObjectives =",
    "const allObjectivesCompleted =",
    "case 'acao':",
    "<Footprints",
    't("objectivesPremium.nextStep")',
    't("objectivesPremium.nextStepTitle")',
    't("objectivesPremium.completeStep")',
    't("objectivesPremium.smallWins")',
    't("objectivesPremium.allDone")',
    "remainingObjectives.map(objective =>",
    "onToggleComplete(featuredObjective.id)",
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

if "objectives.map(objective =>" in component_new:
    fail(
        "A lista original ainda usa objectives.map; "
        "o protagonista seria duplicado."
    )

if component_new.count(
    "onToggleComplete(featuredObjective.id)"
) != 1:
    fail(
        "Callback do objetivo em destaque duplicado "
        "ou ausente."
    )


# ============================================================
# 12. BACKUPS
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
# 13. ESCREVER
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
# 14. VALIDAÇÃO FINAL EM DISCO
# ============================================================

written_component = COMPONENT.read_text(
    encoding="utf-8"
)

final_required = [
    't("objectivesPremium.title")',
    't("objectivesPremium.nextStep")',
    't("objectivesPremium.smallWins")',
    "remainingObjectives.map(objective =>",
    "onToggleComplete(featuredObjective.id)",
]

for marker in final_required:
    if marker not in written_component:
        print()
        print("ATENÇÃO:")
        print(
            "A escrita ocorreu, mas a validação final "
            f"não encontrou: {marker}"
        )
        sys.exit(1)

for lang, path in LOCALES.items():
    try:
        written_data = json.loads(
            path.read_text(encoding="utf-8")
        )
    except Exception as exc:
        print()
        print(
            f"ATENÇÃO: {lang} ficou inválido: {exc}"
        )
        sys.exit(1)

    premium = written_data.get(
        "objectivesPremium",
        {}
    )

    for key, value in translations[lang].items():
        if premium.get(key) != value:
            print()
            print(
                f"ATENÇÃO: validação final falhou "
                f"em {lang}.{key}"
            )
            sys.exit(1)


# ============================================================
# 15. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2C")
print("=" * 72)
print()
print("✓ Primeiro objetivo ativo transformado em protagonista")
print("✓ Protagonista deixa de ser duplicado na lista")
print("✓ Próximo objetivo sobe automaticamente após conclusão")
print("✓ Restantes objetivos organizados como Pequenas vitórias")
print("✓ Estado de todos concluídos adicionado")
print("✓ Categoria Ação ganhou identidade própria")
print("✓ XP original preservado")
print("✓ Callbacks originais preservados")
print("✓ Criação de objetivo preservada")
print("✓ Eliminação de personalizados preservada")
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
