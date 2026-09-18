from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2F.1
# Fundação reativa dos Objetivos
# VERSÃO 3 — ADAPTADA AO HANDLER REAL
#
# ALTERA:
# - src/data/reactive/reactiveTypes.ts
# - src/data/reactive/reactiveEngine.ts
# - src/App.tsx
#
# NÃO ALTERA:
# - UI
# - traduções
# - storage keys
# - XP
# - lógica de reversão
# - Weekly Goal
# ============================================================

ROOT = Path.cwd()

TYPES = ROOT / "src/data/reactive/reactiveTypes.ts"
ENGINE = ROOT / "src/data/reactive/reactiveEngine.ts"
APP = ROOT / "src/App.tsx"

BACKUPS = {
    TYPES: Path("/tmp/reactiveTypes.ts.before_objectives_2f1"),
    ENGINE: Path("/tmp/reactiveEngine.ts.before_objectives_2f1"),
    APP: Path("/tmp/App.tsx.before_objectives_2f1"),
}


def fail(message: str):
    print()
    print("=" * 72)
    print("ERRO — 2F.1 NÃO APLICADA")
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

for path in (TYPES, ENGINE, APP):
    if not path.exists():
        fail(f"Ficheiro não encontrado: {path}")


# ============================================================
# 2. LER TUDO PRIMEIRO
# ============================================================

types_original = TYPES.read_text(encoding="utf-8")
engine_original = ENGINE.read_text(encoding="utf-8")
app_original = APP.read_text(encoding="utf-8")


# ============================================================
# 3. VALIDAR ARQUITETURA REAL
# ============================================================

types_required = [
    "export interface ReactiveAnalysisInput",
    "source?: ReactiveActionSource;",
    "currentMood?: number;",
    "currentNeed?: string;",
    '| "objective"',
    '| "objective_completed"',
]

engine_required = [
    "export function buildReactiveContext(",
    'input.source === "impulse"',
    'input.source === "daily_checkin"',
    'input.source === "mood"',
    "detection = detectSituation(metrics, data);",
]

app_required = [
    "const handleToggleObjective = (id: string) => {",
    "setObjectives(prev => {",
    "const updatedObjectives = prev.map(obj => {",
    "const nextCompleted = !obj.completed;",
    "if (nextCompleted) {",
    "addXp(obj.xpReward);",
    "return { ...obj, completed: nextCompleted };",
    "const completedCount = updatedObjectives.filter(",
    "setObjectivesHistory(prevHistory => {",
    "completed: completedCount",
]

for marker in types_required:
    if marker not in types_original:
        fail(
            "reactiveTypes.ts não corresponde à estrutura esperada.\n\n"
            f"Falta:\n{marker}"
        )

for marker in engine_required:
    if marker not in engine_original:
        fail(
            "reactiveEngine.ts não corresponde à estrutura esperada.\n\n"
            f"Falta:\n{marker}"
        )

for marker in app_required:
    if marker not in app_original:
        fail(
            "App.tsx não corresponde ao handleToggleObjective "
            "que foi auditado.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 4. EVITAR APLICAÇÃO DUPLA/PARCIAL
# ============================================================

if "objectiveCompleted?: boolean;" in types_original:
    fail(
        "objectiveCompleted já existe em ReactiveAnalysisInput.\n"
        "A alteração pode já estar parcialmente aplicada."
    )

if (
    'input.source === "objective"' in engine_original
    and "input.objectiveCompleted" in engine_original
):
    fail(
        "O Reactive Engine já contém o ramo explícito "
        "de Objective."
    )

if "objectiveCompleted: true" in app_original:
    fail(
        "App.tsx já envia objectiveCompleted ao motor."
    )

if "total: updatedObjectives.length" in app_original:
    fail(
        "O histórico de objetivos já contém total. "
        "A alteração pode estar parcialmente aplicada."
    )


# ============================================================
# 5. REACTIVE TYPES
# ============================================================

types_anchor = """  // Daily Check-In
  currentMood?: number;
  currentNeed?: string;
}"""

types_replacement = """  // Daily Check-In
  currentMood?: number;
  currentNeed?: string;

  // Objetivos
  /**
   * Resultado da ação atual sobre um objetivo.
   *
   * true:
   * o utilizador acabou de concluir o objetivo.
   *
   * false:
   * o utilizador voltou a marcá-lo como pendente.
   *
   * undefined:
   * não existe uma ação atual de objetivo.
   */
  objectiveCompleted?: boolean;
}"""

if types_original.count(types_anchor) != 1:
    fail(
        "Não encontrei exatamente o final esperado "
        "de ReactiveAnalysisInput."
    )

types_new = types_original.replace(
    types_anchor,
    types_replacement,
    1,
)


# ============================================================
# 6. REACTIVE ENGINE
# ============================================================

engine_anchor = """  } else if (input.source === "mood") {
    const hasMood ="""

engine_replacement = """  } else if (
    input.source === "objective" &&
    input.objectiveCompleted === true
  ) {
    /**
     * A ação atual tem prioridade.
     *
     * O utilizador acabou de concluir um objetivo,
     * portanto essa conclusão não deve ser substituída
     * por um sinal histórico de humor, Impulso ou uso.
     */
    detection = {
      situation: "objective_completed" as const,
      confidence: 0.98,
      reasoning:
        "O utilizador acabou de concluir um objetivo.",
    };

  } else if (input.source === "mood") {
    const hasMood ="""

if engine_original.count(engine_anchor) != 1:
    fail(
        "Não encontrei exatamente o ponto entre "
        "Daily Check-In e Mood no Reactive Engine."
    )

engine_new = engine_original.replace(
    engine_anchor,
    engine_replacement,
    1,
)


# ============================================================
# 7. APP — HISTÓRICO COM DENOMINADOR REAL
# ============================================================

history_anchor = """        const entry = {
          date: todayStr,
          completed: completedCount
        };"""

history_replacement = """        const entry = {
          date: todayStr,
          completed: completedCount,
          total: updatedObjectives.length
        };"""

if app_original.count(history_anchor) != 1:
    fail(
        "Não encontrei exatamente o objeto 'entry' "
        "do histórico de objetivos."
    )

app_new = app_original.replace(
    history_anchor,
    history_replacement,
    1,
)


# ============================================================
# 8. APP — REAGIR À CONCLUSÃO ATUAL
# ============================================================

#
# IMPORTANTE:
#
# O handler real já possui:
#
# const nextCompleted = !obj.completed;
#
# Logo usamos esse valor real.
#
# Só reagimos quando nextCompleted === true.
# Desmarcar NÃO significa automaticamente declínio.
#

completion_anchor = """          if (nextCompleted) {
            // Reward XP on check
            addXp(obj.xpReward);
          } else {"""

completion_replacement = """          if (nextCompleted) {
            // Reward XP on check
            addXp(obj.xpReward);

            /**
             * 2F.1 — conclusão atual.
             *
             * Informamos o mesmo Reactive Engine usado
             * pelo resto da CONFIA.
             *
             * Não criamos regras editoriais locais.
             */
            analyzeReactiveState({
              source: "objective",
              objectiveCompleted: true,
            });
          } else {"""

if app_new.count(completion_anchor) != 1:
    fail(
        "Não encontrei exatamente o ramo "
        "'if (nextCompleted)' do handler real."
    )

app_new = app_new.replace(
    completion_anchor,
    completion_replacement,
    1,
)


# ============================================================
# 9. VALIDAR ALTERAÇÕES EM MEMÓRIA
# ============================================================

required_types_after = [
    "objectiveCompleted?: boolean;",
    '| "objective_completed"',
]

required_engine_after = [
    'input.source === "objective"',
    "input.objectiveCompleted === true",
    'situation: "objective_completed" as const',
    'reasoning:',
    '"O utilizador acabou de concluir um objetivo."',
]

required_app_after = [
    "const nextCompleted = !obj.completed;",
    "if (nextCompleted) {",
    "addXp(obj.xpReward);",
    'source: "objective"',
    "objectiveCompleted: true",
    "completed: completedCount,",
    "total: updatedObjectives.length",
]

for marker in required_types_after:
    if marker not in types_new:
        fail(
            "Validação pós-transformação falhou "
            "em reactiveTypes.ts:\n"
            f"{marker}"
        )

for marker in required_engine_after:
    if marker not in engine_new:
        fail(
            "Validação pós-transformação falhou "
            "em reactiveEngine.ts:\n"
            f"{marker}"
        )

for marker in required_app_after:
    if marker not in app_new:
        fail(
            "Validação pós-transformação falhou "
            "em App.tsx:\n"
            f"{marker}"
        )


# ============================================================
# 10. GARANTIR QUE NÃO DUPLICÁMOS NADA
# ============================================================

if types_new.count("objectiveCompleted?: boolean;") != 1:
    fail(
        "objectiveCompleted ficou duplicado "
        "em reactiveTypes.ts."
    )

if engine_new.count('input.source === "objective"') != 1:
    fail(
        "O ramo source=objective ficou duplicado "
        "no Reactive Engine."
    )

if app_new.count("objectiveCompleted: true") != 1:
    fail(
        "A sinalização de conclusão ficou duplicada "
        "em App.tsx."
    )

if app_new.count("total: updatedObjectives.length") != 1:
    fail(
        "O total do histórico ficou duplicado "
        "em App.tsx."
    )


# ============================================================
# 11. PRESERVAR IMPULSO / CHECK-IN / MOOD
# ============================================================

for marker in [
    'input.source === "impulse"',
    'input.source === "daily_checkin"',
    'input.source === "mood"',
    "detection = detectSituation(metrics, data);",
]:
    if marker not in engine_new:
        fail(
            "Um fluxo reativo existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 12. PRESERVAR HANDLER ORIGINAL
# ============================================================

for marker in [
    "setObjectives(prev => {",
    "const updatedObjectives = prev.map(obj => {",
    "const nextCompleted = !obj.completed;",
    "addXp(obj.xpReward);",
    "setAvatar(a => ({",
    "a.points - Math.round(obj.xpReward / 2)",
    "return { ...obj, completed: nextCompleted };",
    "setObjectivesHistory(prevHistory => {",
    "updatedHistory[existing] = entry;",
    "updatedHistory.push(entry);",
    "return updatedHistory;",
    "return updatedObjectives;",
]:
    if marker not in app_new:
        fail(
            "Parte do comportamento original "
            "do handler desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 13. GARANTIR QUE NÃO CRIÁMOS STORAGE NOVO
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
# 14. GARANTIR QUE NÃO CRIÁMOS ESTADO NOVO
# ============================================================

if (
    app_new.count("useState")
    != app_original.count("useState")
):
    fail(
        "O número de useState em App.tsx mudou."
    )


# ============================================================
# 15. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(source, backup)


# ============================================================
# 16. ESCREVER APENAS AGORA
# ============================================================

TYPES.write_text(
    types_new,
    encoding="utf-8",
)

ENGINE.write_text(
    engine_new,
    encoding="utf-8",
)

APP.write_text(
    app_new,
    encoding="utf-8",
)


# ============================================================
# 17. VALIDAR FICHEIROS ESCRITOS
# ============================================================

written_types = TYPES.read_text(encoding="utf-8")
written_engine = ENGINE.read_text(encoding="utf-8")
written_app = APP.read_text(encoding="utf-8")

for marker in required_types_after:
    if marker not in written_types:
        fail(
            "Validação final falhou em "
            "reactiveTypes.ts:\n"
            f"{marker}"
        )

for marker in required_engine_after:
    if marker not in written_engine:
        fail(
            "Validação final falhou em "
            "reactiveEngine.ts:\n"
            f"{marker}"
        )

for marker in required_app_after:
    if marker not in written_app:
        fail(
            "Validação final falhou em App.tsx:\n"
            f"{marker}"
        )


# ============================================================
# 18. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2F.1")
print("=" * 72)
print()
print("✓ ReactiveAnalysisInput preparado para Objetivos")
print("✓ Ação atual de conclusão explicitamente identificada")
print("✓ objective_completed ligado ao Reactive Engine")
print("✓ Ação atual tem prioridade sobre memória/histórico")
print("✓ Histórico passa a guardar completed + total real")
print("✓ objectiveCompletionRate passa a ter denominador válido")
print("✓ XP de conclusão preservado")
print("✓ Reversão do objetivo preservada")
print("✓ Desmarcar não é interpretado como declínio")
print("✓ Histórico anterior não foi fabricado nem reescrito")
print("✓ Mesmo localStorage preservado")
print("✓ Impulso preservado")
print("✓ Daily Check-In preservado")
print("✓ Mood preservado")
print("✓ Sem novo estado")
print("✓ Sem novo storage")
print("✓ Sem novas dependências")
print("✓ Sem alterações visuais")
print()
print("Backups:")
print(f"  {BACKUPS[TYPES]}")
print(f"  {BACKUPS[ENGINE]}")
print(f"  {BACKUPS[APP]}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
