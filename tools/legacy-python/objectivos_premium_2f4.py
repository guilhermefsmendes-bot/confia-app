from pathlib import Path
import shutil
import sys

# ============================================================
# CONFIA — OBJETIVOS PREMIUM 2F.4
# Isolamento contextual do source Objective
#
# OBJETIVO:
# impedir que source="objective" receba uma situação
# genérica de Mood / Impulso / uso quando ainda não existe
# tendência suficiente de Objetivos.
#
# ALTERA:
# - src/data/reactive/reactiveEngine.ts
#
# NÃO ALTERA:
# - UI
# - App.tsx
# - traduções
# - storage
# - responses
# - intents
# ============================================================

ROOT = Path.cwd()

ENGINE = ROOT / "src/data/reactive/reactiveEngine.ts"

BACKUP = Path(
    "/tmp/reactiveEngine.ts.before_objectives_2f4"
)


def fail(message: str):
    print()
    print("=" * 72)
    print("ERRO — 2F.4 NÃO APLICADA")
    print("=" * 72)
    print()
    print(message)
    print()
    print("Nenhum ficheiro foi alterado.")
    print("=" * 72)
    sys.exit(1)


# ============================================================
# 1. VALIDAR FICHEIRO
# ============================================================

if not ENGINE.exists():
    fail(
        f"Ficheiro não encontrado: {ENGINE}"
    )


# ============================================================
# 2. LER ANTES DE ALTERAR
# ============================================================

engine_original = ENGINE.read_text(
    encoding="utf-8"
)


# ============================================================
# 3. CONFIRMAR BASE 2F
# ============================================================

required = [
    'input.source === "objective"',
    "input.objectiveCompleted === true",
    'situation: "objective_completed" as const',
    "const hasComparableObjectivePeriods =",
    'situation: "objectives_improving"',
    'situation: "objectives_declining"',
    'situation: "objectives_consistent"',
    "detection = detectSituation(metrics, data);",
]

for marker in required:
    if marker not in engine_original:
        fail(
            "reactiveEngine.ts não corresponde "
            "à base esperada da 2F.\n\n"
            f"Falta:\n{marker}"
        )


# ============================================================
# 4. EVITAR DUPLICAÇÃO
# ============================================================

if "objectiveHistoricalDetection" in engine_original:
    fail(
        "A 2F.4 parece já estar aplicada."
    )


# ============================================================
# 5. LOCALIZAR O BLOCO SOURCE-SPECIFIC
# ============================================================

objective_anchor = """  } else if (
    input.source === "objective" &&
    input.objectiveCompleted === true
  ) {"""

if engine_original.count(objective_anchor) != 1:
    fail(
        "Não encontrei exatamente o ramo "
        "objective_completed."
    )


# ============================================================
# 6. LOCALIZAR O FALLBACK FINAL
# ============================================================

fallback_anchor = """  } else {
    detection = detectSituation(metrics, data);
  }"""

if engine_original.count(fallback_anchor) != 1:
    fail(
        "Não encontrei exatamente o fallback "
        "genérico final."
    )


# ============================================================
# 7. CRIAR DETEÇÃO HISTÓRICA OBJECTIVE
# ============================================================

#
# Para source=objective sem ação atual:
#
# 1. usamos o mesmo detectSituation;
# 2. aceitamos APENAS situações de Objetivos;
# 3. se vier qualquer outra situação, convertemos
#    para no_data.
#
# Assim não duplicamos o cérebro nem a matemática
# da tendência criada na 2F.2.
#

fallback_replacement = """  } else if (input.source === "objective") {
    /**
     * Leitura histórica dos Objetivos.
     *
     * O detectSituation continua a ser a única fonte
     * das tendências temporais.
     *
     * Porém, quando a origem atual é "objective",
     * não permitimos que uma situação de Mood,
     * Impulso ou utilização seja apresentada dentro
     * do separador Objetivos.
     */
    const objectiveHistoricalDetection =
      detectSituation(metrics, data);

    const objectiveSituations = new Set([
      "objectives_improving",
      "objectives_declining",
      "objectives_consistent",
    ]);

    if (
      objectiveSituations.has(
        objectiveHistoricalDetection.situation
      )
    ) {
      detection = objectiveHistoricalDetection;
    } else {
      detection = {
        situation: "no_data" as const,
        confidence: 0.96,
        reasoning:
          "Ainda não existem dados históricos suficientes de objetivos para identificar uma tendência.",
      };
    }

  } else {
    detection = detectSituation(metrics, data);
  }"""

engine_new = engine_original.replace(
    fallback_anchor,
    fallback_replacement,
    1,
)


# ============================================================
# 8. VALIDAR RESULTADO EM MEMÓRIA
# ============================================================

for marker in [
    'input.source === "objective"',
    "input.objectiveCompleted === true",
    "const objectiveHistoricalDetection =",
    "const objectiveSituations = new Set([",
    '"objectives_improving"',
    '"objectives_declining"',
    '"objectives_consistent"',
    'situation: "no_data" as const',
    "detection = objectiveHistoricalDetection;",
    "detection = detectSituation(metrics, data);",
]:
    if marker not in engine_new:
        fail(
            "Validação em memória falhou:\n"
            f"{marker}"
        )


# ============================================================
# 9. GARANTIR ORDEM CORRETA
# ============================================================

explicit_pos = engine_new.find(
    'input.source === "objective" &&'
)

historical_pos = engine_new.find(
    '} else if (input.source === "objective")'
)

generic_pos = engine_new.rfind(
    "detection = detectSituation(metrics, data);"
)

if explicit_pos == -1:
    fail(
        "Não encontrei objective_completed."
    )

if historical_pos == -1:
    fail(
        "Não encontrei o novo ramo histórico Objective."
    )

if generic_pos == -1:
    fail(
        "Não encontrei o fallback genérico."
    )

if not (
    explicit_pos < historical_pos < generic_pos
):
    fail(
        "A ordem dos ramos Objective ficou incorreta."
    )


# ============================================================
# 10. GARANTIR QUE NO_DATA EXISTE NOS TYPES
# ============================================================

if '"no_data"' not in engine_new:
    fail(
        "Não consegui validar a situação no_data."
    )


# ============================================================
# 11. PRESERVAR OUTRAS ORIGENS
# ============================================================

for marker in [
    'input.source === "impulse"',
    'input.source === "daily_checkin"',
    'input.source === "mood"',
]:
    if marker not in engine_new:
        fail(
            "Um fluxo source-specific desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 12. PRESERVAR TENDÊNCIAS 2F.2
# ============================================================

for marker in [
    "const hasComparableObjectivePeriods =",
    "metrics.objectiveValidDays >= 2",
    "metrics.previousObjectiveValidDays >= 2",
    "change >= 0.15",
    "change <= -0.15",
    "recentRate >= 0.60",
    "previousRate >= 0.60",
]:
    if marker not in engine_new:
        fail(
            "Parte da tendência 2F.2 desapareceu:\n"
            f"{marker}"
        )


# ============================================================
# 13. GARANTIR UM ÚNICO RAMO HISTÓRICO
# ============================================================

if engine_new.count(
    "const objectiveHistoricalDetection ="
) != 1:
    fail(
        "objectiveHistoricalDetection ficou duplicado."
    )


# ============================================================
# 14. BACKUP
# ============================================================

shutil.copy2(
    ENGINE,
    BACKUP
)


# ============================================================
# 15. ESCREVER
# ============================================================

ENGINE.write_text(
    engine_new,
    encoding="utf-8"
)


# ============================================================
# 16. VALIDAÇÃO FINAL
# ============================================================

written = ENGINE.read_text(
    encoding="utf-8"
)

for marker in [
    "const objectiveHistoricalDetection =",
    'situation: "no_data" as const',
    "detection = objectiveHistoricalDetection;",
]:
    if marker not in written:
        print()
        print("ATENÇÃO:")
        print(
            "Validação final falhou:"
        )
        print(marker)
        print()
        print("Backup:")
        print(BACKUP)
        sys.exit(1)


# ============================================================
# 17. RESULTADO
# ============================================================

print()
print("=" * 72)
print("CONFIA — OBJETIVOS PREMIUM 2F.4")
print("=" * 72)
print()
print("✓ source=objective ficou isolado contextualmente")
print("✓ objective_completed continua prioritário")
print("✓ Tendência histórica continua no detectSituation")
print("✓ improving continua permitido")
print("✓ declining continua permitido")
print("✓ consistent continua permitido")
print("✓ Mood não pode contaminar Objetivos")
print("✓ Impulso não pode contaminar Objetivos")
print("✓ Uso geral não pode contaminar Objetivos")
print("✓ Sem dados suficientes -> no_data")
print("✓ Nenhuma tendência é fabricada")
print("✓ Motor único preservado")
print("✓ 2F.2 preservada")
print("✓ Sem alterações em App.tsx")
print("✓ Sem alterações visuais")
print("✓ Sem novo estado")
print("✓ Sem novo storage")
print("✓ Sem novas dependências")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("PRÓXIMO PASSO:")
print("  npm run build")
print("=" * 72)
