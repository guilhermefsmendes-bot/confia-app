from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2F.3
# CONFIA reage ao progresso
#
# OBJETIVOS:
# 1. Usar a resposta real do Reactive Engine ao concluir.
# 2. Registar essa resposta no histórico reativo.
# 3. Mostrar a reação dentro do separador Objetivos.
# 4. Quando não há ação imediata, permitir leitura histórica.
# 5. Completar intent de objectives_consistent.
#
# ALTERA:
# - src/App.tsx
# - src/data/reactive/reactiveIntentEngine.ts
#
# NÃO ALTERA:
# - ObjectivosList.tsx
# - HomeWorld
# - storage keys
# - respostas editoriais
# - traduções
# - dependências
# ============================================================

ROOT = Path.cwd()

APP = ROOT / "src/App.tsx"
INTENTS = ROOT / "src/data/reactive/reactiveIntentEngine.ts"

BACKUPS = {
    APP: Path("/tmp/App.tsx.before_objectives_2f3"),
    INTENTS: Path(
        "/tmp/reactiveIntentEngine.ts.before_objectives_2f3"
    ),
}


def fail(message: str):
    print()
    print("=" * 72)
    print("ERRO — 2F.3 NÃO APLICADA")
    print("=" * 72)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 72)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIROS
# ============================================================

for path in (APP, INTENTS):
    if not path.exists():
        fail(f"Ficheiro não encontrado: {path}")


# ============================================================
# 2. LER PRIMEIRO
# ============================================================

app_original = APP.read_text(encoding="utf-8")
intents_original = INTENTS.read_text(encoding="utf-8")


# ============================================================
# 3. VALIDAR BASE 2F.1 / 2F.2
# ============================================================

for marker in [
    "const [reactiveMessageKey, setReactiveMessageKey]",
    "recordReactiveResponse({",
    "const handleToggleObjective = (id: string) => {",
    "const nextCompleted = !obj.completed;",
    'source: "objective"',
    "objectiveCompleted: true",
    "total: updatedObjectives.length",
]:
    if marker not in app_original:
        fail(
            "App.tsx não corresponde à base "
            "esperada depois da 2F.1/2F.2.\n\n"
            f"Falta:\n{marker}"
        )


for marker in [
    'id: "objective_success"',
    'intent: "celebrate_objective"',
    'situations: ["objective_completed", "objectives_improving"]',
    'id: "objective_difficulty"',
    'intent: "redirect_objective"',
    'situations: ["objectives_declining"]',
]:
    if marker not in intents_original:
        fail(
            "reactiveIntentEngine.ts não corresponde "
            "à arquitetura auditada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 4. EVITAR DUPLICAÇÃO
# ============================================================

if 'id: "objective_consistency"' in intents_original:
    fail(
        "A intent objective_consistency já existe."
    )

if (
    "objectiveReactiveResult.response.translationKey"
    in app_original
):
    fail(
        "A reação Objective parece já estar "
        "ligada à interface."
    )


# ============================================================
# 5. COMPLETAR INTENT DE CONSISTÊNCIA
# ============================================================

intent_anchor = """  {
    id: "objective_difficulty",
    intent: "redirect_objective",
    priority: 70,
    situations: ["objectives_declining"],
    tags: ["objectives", "adjustment"],
  },"""

intent_replacement = """  {
    id: "objective_difficulty",
    intent: "redirect_objective",
    priority: 70,
    situations: ["objectives_declining"],
    tags: ["objectives", "adjustment"],
  },

  {
    id: "objective_consistency",
    intent: "recognize_consistency",
    priority: 80,
    situations: ["objectives_consistent"],
    tags: ["objectives", "consistency"],
  },"""

if intents_original.count(intent_anchor) != 1:
    fail(
        "Não encontrei exatamente a regra "
        "objective_difficulty."
    )

intents_new = intents_original.replace(
    intent_anchor,
    intent_replacement,
    1,
)


# ============================================================
# 6. SUBSTITUIR A CHAMADA DESCARTADA DA 2F.1
# ============================================================

old_objective_call = """            analyzeReactiveState({
              source: "objective",
              objectiveCompleted: true,
            });"""

new_objective_call = """            const objectiveReactiveResult =
              analyzeReactiveState({
                source: "objective",
                objectiveCompleted: true,
              });

            /**
             * A resposta imediata usa o mesmo estado
             * reativo já existente na CONFIA.
             */
            setReactiveMessageKey(
              objectiveReactiveResult.response.translationKey
            );

            /**
             * Esta resposta foi provocada por uma ação
             * explícita do utilizador, por isso entra
             * no histórico/cooldown reativo.
             */
            recordReactiveResponse({
              responseId:
                objectiveReactiveResult.response.id,
              situation:
                objectiveReactiveResult.situation,
              intent:
                objectiveReactiveResult.intent,
              timestamp: new Date().toISOString(),
            });"""

if app_original.count(old_objective_call) != 1:
    fail(
        "Não encontrei exatamente a chamada "
        "Objective criada na 2F.1."
    )

app_new = app_original.replace(
    old_objective_call,
    new_objective_call,
    1,
)


# ============================================================
# 7. DESCOBRIR O RENDER DO SEPARADOR OBJETIVOS
# ============================================================

#
# Não assumimos uma linha específica.
# Procuramos a utilização real de ObjectivosList.
#

objective_component_pos = app_new.find("<ObjectivosList")

if objective_component_pos == -1:
    fail(
        "Não encontrei <ObjectivosList no App.tsx."
    )


# ============================================================
# 8. ENCONTRAR O INÍCIO DA LINHA
# ============================================================

line_start = app_new.rfind(
    "\n",
    0,
    objective_component_pos
) + 1

indent = app_new[
    line_start:objective_component_pos
]


# ============================================================
# 9. VALIDAR QUE NÃO ESTAMOS NA HOME
# ============================================================

#
# O bloco visual será colocado imediatamente antes
# do ObjectivosList real.
#
# Usa apenas traduções já existentes:
#
# homeNow.eyebrow
# reactive response translationKey
#
# Logo não criamos novo texto visível.
#

reaction_ui = f"""{indent}{{currentTab === 1 && reactiveMessageKey && (
{indent}  <section
{indent}    className="mb-4 overflow-hidden rounded-[28px] border border-[#E5A88B]/25 bg-gradient-to-br from-[#FFF8F4] via-white to-[#FFFDFC] shadow-[0_12px_32px_rgba(92,64,52,0.06)]"
{indent}  >
{indent}    <div className="flex items-start gap-3.5 p-5">
{indent}      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E5A88B]/15 bg-white text-[#C97B5E] shadow-sm">
{indent}        <Sparkles
{indent}          size={{18}}
{indent}          strokeWidth={{1.8}}
{indent}        />
{indent}      </div>
{indent}
{indent}      <div className="min-w-0 flex-1">
{indent}        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#C97B5E]">
{indent}          {{t("homeNow.eyebrow")}}
{indent}        </p>
{indent}
{indent}        <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#4E3B36]">
{indent}          {{t(reactiveMessageKey)}}
{indent}        </p>
{indent}      </div>
{indent}    </div>
{indent}
{indent}    <div
{indent}      aria-hidden="true"
{indent}      className="h-[3px] w-full bg-gradient-to-r from-[#E5A88B]/10 via-[#C97B5E]/45 to-[#E5A88B]/10"
{indent}    />
{indent}  </section>
{indent})}}

"""

app_new = (
    app_new[:line_start]
    + reaction_ui
    + app_new[line_start:]
)


# ============================================================
# 10. LEITURA HISTÓRICA AO ENTRAR NOS OBJETIVOS
# ============================================================

#
# O estado reactiveMessageKey já existe.
#
# Quando o utilizador entra no separador Objetivos:
# - analisamos source objective
# - sem objectiveCompleted
# - portanto o motor pode usar a tendência histórica
#
# NÃO registamos esta leitura no histórico porque
# não foi provocada por uma nova ação.
#

home_effect_anchor = """  }, [currentTab, homeScreen, ratings]);

const [selectedDate, setSelectedDate] = useState("""

objective_effect = """  }, [currentTab, homeScreen, ratings]);

  /**
   * Objetivos — leitura contextual ao entrar.
   *
   * Não regista resposta no histórico porque abrir
   * o separador não é uma nova ação emocional.
   *
   * objective_completed continua reservado para
   * uma conclusão acabada de acontecer.
   */
  useEffect(() => {
    if (currentTab !== 1) return;

    const objectiveReactiveResult =
      analyzeReactiveState({
        source: "objective",
      });

    if (
      objectiveReactiveResult?.response?.translationKey
    ) {
      setReactiveMessageKey(
        objectiveReactiveResult.response.translationKey
      );
    }
  }, [currentTab, objectivesHistory]);

const [selectedDate, setSelectedDate] = useState("""

if app_new.count(home_effect_anchor) != 1:
    fail(
        "Não encontrei exatamente o final "
        "do useEffect reativo da Home."
    )

app_new = app_new.replace(
    home_effect_anchor,
    objective_effect,
    1,
)


# ============================================================
# 11. VALIDAR RESULTADO APP
# ============================================================

for marker in [
    "const objectiveReactiveResult =",
    "objectiveReactiveResult.response.translationKey",
    "objectiveReactiveResult.response.id",
    "objectiveReactiveResult.situation",
    "objectiveReactiveResult.intent",
    'if (currentTab !== 1) return;',
    'source: "objective"',
    "currentTab === 1 && reactiveMessageKey",
    't("homeNow.eyebrow")',
    "t(reactiveMessageKey)",
    "<ObjectivosList",
]:
    if marker not in app_new:
        fail(
            "Validação em memória falhou "
            "em App.tsx:\n"
            f"{marker}"
        )


# ============================================================
# 12. VALIDAR RESULTADO INTENTS
# ============================================================

for marker in [
    'id: "objective_consistency"',
    'intent: "recognize_consistency"',
    'situations: ["objectives_consistent"]',
    'tags: ["objectives", "consistency"]',
]:
    if marker not in intents_new:
        fail(
            "Validação em memória falhou "
            "em reactiveIntentEngine.ts:\n"
            f"{marker}"
        )


# ============================================================
# 13. GARANTIR UMA ÚNICA INTENT
# ============================================================

if intents_new.count(
    'id: "objective_consistency"'
) != 1:
    fail(
        "objective_consistency ficou duplicada."
    )


# ============================================================
# 14. GARANTIR QUE NÃO CRIÁMOS NOVO ESTADO
# ============================================================

if (
    app_new.count("useState")
    != app_original.count("useState")
):
    fail(
        "O número de useState mudou."
    )


# ============================================================
# 15. GARANTIR QUE NÃO CRIÁMOS STORAGE
# ============================================================

if (
    app_new.count("localStorage.setItem")
    != app_original.count("localStorage.setItem")
):
    fail(
        "O número de localStorage.setItem mudou."
    )

if (
    app_new.count("localStorage.removeItem")
    != app_original.count("localStorage.removeItem")
):
    fail(
        "O número de localStorage.removeItem mudou."
    )


# ============================================================
# 16. PRESERVAR HOME REATIVA
# ============================================================

for marker in [
    'source: "mood"',
    "setReactiveMessageKey(",
    "homeScreen !== \"home\"",
    "{reactiveMessageKey && (",
    "{t(reactiveMessageKey)}",
]:
    if marker not in app_new:
        fail(
            "A Home reativa perdeu uma estrutura "
            "importante:\n"
            f"{marker}"
        )


# ============================================================
# 17. PRESERVAR OBJECTIVE TOGGLE
# ============================================================

for marker in [
    "const nextCompleted = !obj.completed;",
    "addXp(obj.xpReward);",
    "setAvatar(a => ({",
    "a.points - Math.round(obj.xpReward / 2)",
    "return { ...obj, completed: nextCompleted };",
    "total: updatedObjectives.length",
]:
    if marker not in app_new:
        fail(
            "O handler de Objetivos perdeu "
            "comportamento existente:\n"
            f"{marker}"
        )


# ============================================================
# 18. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 19. ESCREVER
# ============================================================

APP.write_text(
    app_new,
    encoding="utf-8"
)

INTENTS.write_text(
    intents_new,
    encoding="utf-8"
)


# ============================================================
# 20. VALIDAÇÃO FINAL
# ============================================================

written_app = APP.read_text(
    encoding="utf-8"
)

written_intents = INTENTS.read_text(
    encoding="utf-8"
)


for marker in [
    "objectiveReactiveResult.response.translationKey",
    "objectiveReactiveResult.response.id",
    'if (currentTab !== 1) return;',
    "currentTab === 1 && reactiveMessageKey",
]:
    if marker not in written_app:
        print()
        print("ATENÇÃO:")
        print("Validação final App.tsx falhou:")
        print(marker)
        print()
        print("Backup:")
        print(BACKUPS[APP])
        sys.exit(1)


for marker in [
    'id: "objective_consistency"',
    'intent: "recognize_consistency"',
]:
    if marker not in written_intents:
        print()
        print("ATENÇÃO:")
        print(
            "Validação final reactiveIntentEngine.ts falhou:"
        )
        print(marker)
        print()
        print("Backup:")
        print(BACKUPS[INTENTS])
        sys.exit(1)


# ============================================================
# 21. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2F.3")
print("=" * 72)
print()
print("✓ Conclusão deixa de descartar a resposta do motor")
print("✓ Resposta imediata usa reactiveMessageKey existente")
print("✓ Resposta de conclusão entra no histórico reativo")
print("✓ Cooldown/variedade do motor passam a ser respeitados")
print("✓ Objetivos mostram reação contextual da CONFIA")
print("✓ Ao entrar, tendência histórica pode ser interpretada")
print("✓ Leitura passiva não é gravada como nova resposta")
print("✓ objective_completed continua reservado à ação atual")
print("✓ objectives_improving pode aparecer no separador")
print("✓ objectives_declining pode aparecer no separador")
print("✓ objectives_consistent ganhou intent própria")
print("✓ Não foi criado segundo cérebro")
print("✓ Mesmo reactiveMessageKey")
print("✓ Mesmo Reactive Engine")
print("✓ Mesmo histórico reativo")
print("✓ XP preservado")
print("✓ Reversão preservada")
print("✓ Sem novo estado")
print("✓ Sem novo localStorage")
print("✓ Sem novas dependências")
print("✓ Sem novas traduções")
print()
print("Backups:")
print(f"  {BACKUPS[APP]}")
print(f"  {BACKUPS[INTENTS]}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
