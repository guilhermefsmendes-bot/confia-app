from pathlib import Path
import shutil
import re

print("=" * 72)
print("CONFIA — CONTINUIDADE CONTEXTUAL — 1D.7A")
print("=" * 72)

path = Path("src/data/reactive/reactiveRecentMemory.ts")

if not path.exists():
    raise SystemExit("ERRO: reactiveRecentMemory.ts não encontrado.")

backup = Path("/tmp/reactiveRecentMemory.ts.before_1d7a")

if not backup.exists():
    shutil.copy2(path, backup)

text = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Adicionar estrutura de continuidade
# ------------------------------------------------------------

marker = """  /**
   * Utilização recente da aplicação.
   */
  activeDaysLast7: number;
"""

addition = """  /**
   * ----------------------------------------------------------
   * CONTINUIDADE CONTEXTUAL — 1D.7A
   * ----------------------------------------------------------
   *
   * Indica se existem sinais pessoais que se repetem
   * ao longo do histórico recente.
   *
   * Isto é apenas contexto.
   * Não escolhe nenhuma ação.
   */
  continuity: {
    hasRepeatedSignals: boolean;

    repeatedNeed?: "calm" | "mind" | "control" | "support";

    repeatedNeedCount: number;

    recentEffectiveImpulseCount: number;

    recentImpulseAverageReduction?: number;
  };

"""

if addition not in text:
    if marker not in text:
        raise SystemExit(
            "ERRO: marcador de activeDaysLast7 não encontrado."
        )

    text = text.replace(
        marker,
        addition + marker,
        1
    )

# ------------------------------------------------------------
# 2. Criar o cálculo de continuidade
# ------------------------------------------------------------

calc_marker = """  /**
   * Dias com qualquer atividade nos
   * últimos sete dias.
   */
"""

calc_addition = """  /**
   * ----------------------------------------------------------
   * CONTINUIDADE CONTEXTUAL — 1D.7A
   * ----------------------------------------------------------
   *
   * A continuidade só é reconhecida quando existe
   * evidência real no histórico recente.
   *
   * Não cria novas conclusões clínicas.
   * Não escolhe percursos.
   */
  const repeatedNeedCount =
    effectiveImpulseNeedCount;

  const recentEffectiveImpulseCount =
    effectiveImpulses.length;

  const hasRepeatedSignals =
    repeatedNeedCount >= 2 ||
    recentEffectiveImpulseCount >= 2 ||
    (
      typeof recentImpulseAverageReduction === "number" &&
      recentEffectiveImpulseCount >= 2
    );

  const continuity = {
    hasRepeatedSignals,

    repeatedNeed:
      repeatedNeedCount >= 2
        ? effectiveImpulseNeed
        : undefined,

    repeatedNeedCount,

    recentEffectiveImpulseCount,

    recentImpulseAverageReduction,
  };

"""

if calc_addition not in text:
    if calc_marker not in text:
        raise SystemExit(
            "ERRO: zona de cálculo da memória não encontrada."
        )

    text = text.replace(
        calc_marker,
        calc_addition + calc_marker,
        1
    )

# ------------------------------------------------------------
# 3. Expor a continuidade no resultado final
# ------------------------------------------------------------

return_marker = """    activeDaysLast7:
      activeDates.size,
"""

return_addition = """    continuity,

"""

if return_addition not in text:
    if return_marker not in text:
        raise SystemExit(
            "ERRO: retorno activeDaysLast7 não encontrado."
        )

    text = text.replace(
        return_marker,
        return_addition + return_marker,
        1
    )

path.write_text(text, encoding="utf-8")

print("✓ Estrutura continuity adicionada")
print("✓ Repetição de necessidade identificada")
print("✓ Episódios eficazes recentes contabilizados")
print("✓ Média de redução preservada")
print("✓ Critério mínimo de repetição aplicado")
print("✓ Nenhuma seleção automática")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Backup criado em /tmp/reactiveRecentMemory.ts.before_1d7a")
print("=" * 72)
print("OK — 1D.7A APLICADA")
print("=" * 72)
