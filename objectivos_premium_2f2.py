from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2F.2
# Tendência real dos Objetivos
# VERSÃO CORRIGIDA — anchors estruturais
#
# ALTERA:
# - src/data/reactive/reactiveTypes.ts
# - src/data/reactive/reactiveEngine.ts
#
# NÃO ALTERA:
# - App.tsx
# - UI
# - traduções
# - storage
# - XP
# ============================================================

ROOT = Path.cwd()

TYPES = ROOT / "src/data/reactive/reactiveTypes.ts"
ENGINE = ROOT / "src/data/reactive/reactiveEngine.ts"

BACKUPS = {
    TYPES: Path(
        "/tmp/reactiveTypes.ts.before_objectives_2f2"
    ),
    ENGINE: Path(
        "/tmp/reactiveEngine.ts.before_objectives_2f2"
    ),
}


def fail(message: str):
    print()
    print("=" * 72)
    print("ERRO — 2F.2 NÃO APLICADA")
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

for path in (TYPES, ENGINE):
    if not path.exists():
        fail(f"Ficheiro não encontrado: {path}")


# ============================================================
# 2. LER TUDO ANTES DE ESCREVER
# ============================================================

types_original = TYPES.read_text(
    encoding="utf-8"
)

engine_original = ENGINE.read_text(
    encoding="utf-8"
)


# ============================================================
# 3. CONFIRMAR 2F.1
# ============================================================

for marker in [
    "objectiveCompleted?: boolean;",
    "objectiveCompletionRate?: number;",
    '| "objective_completed"',
    '| "objectives_improving"',
    '| "objectives_declining"',
    '| "objectives_consistent"',
]:
    if marker not in types_original:
        fail(
            "A base esperada da 2F.1 não existe "
            "em reactiveTypes.ts.\n\n"
            f"Falta:\n{marker}"
        )


for marker in [
    'input.source === "objective"',
    "input.objectiveCompleted === true",
    'situation: "objective_completed" as const',
    "const objectives = data.objectives.slice(-7);",
    "const objectiveCompletionRate =",
    "// Objetivos em evolução",
    'situation: "objectives_improving"',
]:
    if marker not in engine_original:
        fail(
            "A base esperada da 2F.1 não existe "
            "em reactiveEngine.ts.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 4. EVITAR APLICAÇÃO DUPLA
# ============================================================

for marker in [
    "previousObjectiveCompletionRate?: number;",
    "objectiveValidDays?: number;",
    "previousObjectiveValidDays?: number;",
]:
    if marker in types_original:
        fail(
            "A 2F.2 parece já estar aplicada "
            "parcial ou totalmente.\n\n"
            f"Encontrado:\n{marker}"
        )


if "calculateObjectivePeriodRate" in engine_original:
    fail(
        "calculateObjectivePeriodRate já existe."
    )


# ============================================================
# 5. TYPES — MÉTRICAS DE COMPARAÇÃO
# ============================================================

types_anchor = """  objectivesCompleted?: number;
  objectivesTotal?: number;
  objectiveCompletionRate?: number;"""

types_replacement = """  objectivesCompleted?: number;
  objectivesTotal?: number;

  /**
   * Taxa real do período recente de Objetivos.
   * Apenas usa registos cujo total seja > 0.
   */
  objectiveCompletionRate?: number;

  /**
   * Taxa real do período imediatamente anterior.
   */
  previousObjectiveCompletionRate?: number;

  /**
   * Número de dias válidos disponíveis
   * em cada período comparado.
   */
  objectiveValidDays?: number;
  previousObjectiveValidDays?: number;"""

if types_original.count(types_anchor) != 1:
    fail(
        "Não encontrei exatamente o bloco das "
        "métricas de Objetivos em reactiveTypes.ts."
    )

types_new = types_original.replace(
    types_anchor,
    types_replacement,
    1,
)


# ============================================================
# 6. ENGINE — LOCALIZAR BLOCO ANTIGO DE OBJETIVOS
# ============================================================

start_marker = (
    "  const objectives = data.objectives.slice(-7);"
)

end_marker = """  const dates = sortDates(["""

start = engine_original.find(start_marker)

if start == -1:
    fail(
        "Não encontrei o início estrutural "
        "das métricas de Objetivos."
    )

end = engine_original.find(
    end_marker,
    start
)

if end == -1:
    fail(
        "Não encontrei o final estrutural "
        "das métricas de Objetivos."
    )

if end <= start:
    fail(
        "A ordem do bloco das métricas "
        "de Objetivos é inválida."
    )

old_objective_block = engine_original[start:end]


# ============================================================
# 7. VALIDAR CONTEÚDO DO BLOCO ANTIGO
# ============================================================

for marker in [
    "const objectivesCompleted =",
    "const objectivesTotal =",
    "const objectiveCompletionRate =",
    "objectivesCompleted / objectivesTotal",
]:
    if marker not in old_objective_block:
        fail(
            "O bloco antigo de métricas não contém "
            "a estrutura esperada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 8. NOVO BLOCO DE MÉTRICAS
# ============================================================

new_objective_block = """  /**
   * Objetivos — períodos comparáveis.
   *
   * O histórico anterior à 2F.1 pode conter
   * registos sem denominador real.
   *
   * Por isso apenas usamos registos com total > 0.
   */
  const validObjectiveRecords =
    data.objectives.filter(
      (item) =>
        typeof item.completed === "number" &&
        typeof item.total === "number" &&
        item.total > 0
    );

  /**
   * Trabalhamos com até 6 dias válidos:
   *
   * - últimos 3 = período recente
   * - 3 anteriores = período anterior
   */
  const recentObjectiveRecords =
    validObjectiveRecords.slice(-3);

  const previousObjectiveRecords =
    validObjectiveRecords.slice(-6, -3);

  const calculateObjectivePeriodRate = (
    records: typeof validObjectiveRecords
  ) => {
    const completed = records.reduce(
      (sum, item) => sum + item.completed,
      0
    );

    const total = records.reduce(
      (sum, item) => sum + item.total,
      0
    );

    return {
      completed,
      total,
      rate:
        total > 0
          ? completed / total
          : undefined,
      validDays: records.length,
    };
  };

  const recentObjectivePeriod =
    calculateObjectivePeriodRate(
      recentObjectiveRecords
    );

  const previousObjectivePeriod =
    calculateObjectivePeriodRate(
      previousObjectiveRecords
    );

  const objectivesCompleted =
    recentObjectivePeriod.completed;

  const objectivesTotal =
    recentObjectivePeriod.total;

  const objectiveCompletionRate =
    recentObjectivePeriod.rate;

  const previousObjectiveCompletionRate =
    previousObjectivePeriod.rate;

  const objectiveValidDays =
    recentObjectivePeriod.validDays;

  const previousObjectiveValidDays =
    previousObjectivePeriod.validDays;

"""

engine_new = (
    engine_original[:start]
    + new_objective_block
    + engine_original[end:]
)


# ============================================================
# 9. ENGINE — DEVOLVER NOVAS MÉTRICAS
# ============================================================

return_anchor = """    objectiveCompletionRate,

    impulseCount: data.impulse.length,"""

return_replacement = """    objectiveCompletionRate,

    previousObjectiveCompletionRate,

    objectiveValidDays,

    previousObjectiveValidDays,

    impulseCount: data.impulse.length,"""

if engine_new.count(return_anchor) != 1:
    fail(
        "Não encontrei exatamente o retorno "
        "de objectiveCompletionRate."
    )

engine_new = engine_new.replace(
    return_anchor,
    return_replacement,
    1,
)


# ============================================================
# 10. LOCALIZAR DETEÇÃO ANTIGA
# ============================================================

detection_start_marker = (
    "  // Objetivos em evolução"
)

detection_end_marker = (
    "  // Utilização consistente"
)

detection_start = engine_new.find(
    detection_start_marker
)

if detection_start == -1:
    fail(
        "Não encontrei o início da regra antiga "
        "de Objetivos."
    )

detection_end = engine_new.find(
    detection_end_marker,
    detection_start
)

if detection_end == -1:
    fail(
        "Não encontrei o final da regra antiga "
        "de Objetivos."
    )

if detection_end <= detection_start:
    fail(
        "A ordem da deteção antiga "
        "de Objetivos é inválida."
    )

old_detection_block = engine_new[
    detection_start:detection_end
]


# ============================================================
# 11. VALIDAR REGRA ANTIGA
# ============================================================

for marker in [
    "metrics.objectiveCompletionRate",
    "0.75",
    '"objectives_improving"',
]:
    if marker not in old_detection_block:
        fail(
            "A regra antiga não contém "
            "a estrutura esperada.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 12. NOVA DETEÇÃO DE TENDÊNCIA
# ============================================================

new_detection_block = """  /**
   * Objetivos — tendência temporal real.
   *
   * Para chamar algo de tendência precisamos
   * de dados dos dois lados da comparação.
   *
   * Exigimos pelo menos:
   * - 2 dias válidos recentes
   * - 2 dias válidos anteriores
   */
  const hasComparableObjectivePeriods =
    typeof metrics.objectiveCompletionRate === "number" &&
    typeof metrics.previousObjectiveCompletionRate === "number" &&
    typeof metrics.objectiveValidDays === "number" &&
    typeof metrics.previousObjectiveValidDays === "number" &&
    metrics.objectiveValidDays >= 2 &&
    metrics.previousObjectiveValidDays >= 2;

  if (hasComparableObjectivePeriods) {
    const recentRate =
      metrics.objectiveCompletionRate as number;

    const previousRate =
      metrics.previousObjectiveCompletionRate as number;

    const change =
      recentRate - previousRate;

    /**
     * Melhoria real:
     * pelo menos +15 pontos percentuais.
     */
    if (change >= 0.15) {
      return {
        situation: "objectives_improving",
        confidence: 0.88,
        reasoning:
          "A conclusão de objetivos melhorou face ao período anterior.",
      };
    }

    /**
     * Declínio real:
     * pelo menos -15 pontos percentuais.
     *
     * Uma simples reversão de um objetivo
     * não é suficiente para produzir este estado.
     */
    if (change <= -0.15) {
      return {
        situation: "objectives_declining",
        confidence: 0.86,
        reasoning:
          "A conclusão de objetivos diminuiu face ao período anterior.",
      };
    }

    /**
     * Consistência positiva:
     *
     * - variação inferior a 15 pontos percentuais
     * - pelo menos 60% em ambos os períodos
     *
     * Desta forma 10% -> 10% não é apresentado
     * como uma conquista de consistência.
     */
    if (
      Math.abs(change) < 0.15 &&
      recentRate >= 0.60 &&
      previousRate >= 0.60
    ) {
      return {
        situation: "objectives_consistent",
        confidence: 0.84,
        reasoning:
          "A conclusão de objetivos manteve-se consistente entre períodos.",
      };
    }
  }

"""

engine_new = (
    engine_new[:detection_start]
    + new_detection_block
    + engine_new[detection_end:]
)


# ============================================================
# 13. VALIDAR RESULTADO — TYPES
# ============================================================

for marker in [
    "objectiveCompletionRate?: number;",
    "previousObjectiveCompletionRate?: number;",
    "objectiveValidDays?: number;",
    "previousObjectiveValidDays?: number;",
    "objectiveCompleted?: boolean;",
]:
    if marker not in types_new:
        fail(
            "Validação em memória falhou "
            "em reactiveTypes.ts:\n"
            f"{marker}"
        )


# ============================================================
# 14. VALIDAR RESULTADO — ENGINE
# ============================================================

for marker in [
    "const validObjectiveRecords =",
    "validObjectiveRecords.slice(-3)",
    "validObjectiveRecords.slice(-6, -3)",
    "const calculateObjectivePeriodRate =",
    "const recentObjectivePeriod =",
    "const previousObjectivePeriod =",
    "const previousObjectiveCompletionRate =",
    "const objectiveValidDays =",
    "const previousObjectiveValidDays =",
    "const hasComparableObjectivePeriods =",
    "metrics.objectiveValidDays >= 2",
    "metrics.previousObjectiveValidDays >= 2",
    "change >= 0.15",
    "change <= -0.15",
    "recentRate >= 0.60",
    "previousRate >= 0.60",
    'situation: "objectives_improving"',
    'situation: "objectives_declining"',
    'situation: "objectives_consistent"',
]:
    if marker not in engine_new:
        fail(
            "Validação em memória falhou "
            "em reactiveEngine.ts:\n"
            f"{marker}"
        )


# ============================================================
# 15. OBJECTIVE_COMPLETED CONTINUA PRIORITÁRIO
# ============================================================

objective_action_pos = engine_new.find(
    'input.source === "objective"'
)

objective_completed_pos = engine_new.find(
    'situation: "objective_completed" as const'
)

fallback_pos = engine_new.find(
    "detection = detectSituation(metrics, data);"
)

if (
    objective_action_pos == -1
    or objective_completed_pos == -1
    or fallback_pos == -1
):
    fail(
        "Não consegui validar o fluxo "
        "objective_completed."
    )

if objective_action_pos >= fallback_pos:
    fail(
        "A ação atual Objective deixou de ter "
        "prioridade sobre o histórico."
    )


# ============================================================
# 16. REGRA ANTIGA TEM DE DESAPARECER
# ============================================================

if (
    "metrics.objectiveCompletionRate >= 0.75"
    in engine_new
):
    fail(
        "A regra antiga >= 75% ainda existe."
    )

if (
    "A taxa recente de conclusão dos objetivos é elevada."
    in engine_new
):
    fail(
        "O reasoning antigo ainda existe."
    )


# ============================================================
# 17. PRESERVAR OUTROS FLUXOS
# ============================================================

for marker in [
    'input.source === "impulse"',
    'input.source === "daily_checkin"',
    'input.source === "mood"',
    'input.source === "objective"',
    "input.objectiveCompleted === true",
    "calculateImpulseReduction(data)",
    "calculateStreak(data)",
]:
    if marker not in engine_new:
        fail(
            "Fluxo existente desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 18. CONTAGENS CRÍTICAS
# ============================================================

checks = {
    "previousObjectiveCompletionRate?: number;":
        types_new.count(
            "previousObjectiveCompletionRate?: number;"
        ),
    "objectiveValidDays?: number;":
        types_new.count(
            "objectiveValidDays?: number;"
        ),
    "previousObjectiveValidDays?: number;":
        types_new.count(
            "previousObjectiveValidDays?: number;"
        ),
}

for marker, count in checks.items():
    if count != 1:
        fail(
            f"{marker} aparece {count} vezes "
            "em reactiveTypes.ts."
        )


if engine_new.count(
    "const calculateObjectivePeriodRate ="
) != 1:
    fail(
        "calculateObjectivePeriodRate "
        "não ficou exatamente uma vez."
    )


if engine_new.count(
    "const hasComparableObjectivePeriods ="
) != 1:
    fail(
        "hasComparableObjectivePeriods "
        "não ficou exatamente uma vez."
    )


# ============================================================
# 19. BACKUPS
# ============================================================

for source, backup in BACKUPS.items():
    shutil.copy2(
        source,
        backup
    )


# ============================================================
# 20. ESCREVER
# ============================================================

TYPES.write_text(
    types_new,
    encoding="utf-8"
)

ENGINE.write_text(
    engine_new,
    encoding="utf-8"
)


# ============================================================
# 21. VALIDAÇÃO FINAL EM DISCO
# ============================================================

written_types = TYPES.read_text(
    encoding="utf-8"
)

written_engine = ENGINE.read_text(
    encoding="utf-8"
)


for marker in [
    "previousObjectiveCompletionRate?: number;",
    "objectiveValidDays?: number;",
    "previousObjectiveValidDays?: number;",
]:
    if marker not in written_types:
        print()
        print("ATENÇÃO:")
        print(
            "Validação final falhou "
            "em reactiveTypes.ts:"
        )
        print(marker)
        print()
        print("Backup:")
        print(BACKUPS[TYPES])
        sys.exit(1)


for marker in [
    "const validObjectiveRecords =",
    "const hasComparableObjectivePeriods =",
    'situation: "objectives_improving"',
    'situation: "objectives_declining"',
    'situation: "objectives_consistent"',
    'situation: "objective_completed" as const',
]:
    if marker not in written_engine:
        print()
        print("ATENÇÃO:")
        print(
            "Validação final falhou "
            "em reactiveEngine.ts:"
        )
        print(marker)
        print()
        print("Backup:")
        print(BACKUPS[ENGINE])
        sys.exit(1)


# ============================================================
# 22. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2F.2")
print("=" * 72)
print()
print("✓ Histórico antigo sem total válido é ignorado")
print("✓ Apenas registos com total > 0 entram na tendência")
print("✓ Período recente usa até 3 dias válidos")
print("✓ Período anterior usa até 3 dias válidos")
print("✓ Taxa usa completed / total real")
print("✓ Pelo menos 2 dias de cada lado são exigidos")
print("✓ Melhoria exige subida >= 15 pontos percentuais")
print("✓ Declínio exige descida >= 15 pontos percentuais")
print("✓ Consistência exige variação < 15 pontos percentuais")
print("✓ Consistência exige >= 60% nos dois períodos")
print("✓ Estabilidade baixa não é chamada de consistência")
print("✓ objective_completed continua prioritário")
print("✓ Regra antiga >= 75% removida")
print("✓ Impulso preservado")
print("✓ Daily Check-In preservado")
print("✓ Mood preservado")
print("✓ App.tsx não alterado")
print("✓ UI não alterada")
print("✓ Sem novo estado")
print("✓ Sem novo localStorage")
print("✓ Sem novas dependências")
print()
print("Backups:")
print(f"  {BACKUPS[TYPES]}")
print(f"  {BACKUPS[ENGINE]}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
