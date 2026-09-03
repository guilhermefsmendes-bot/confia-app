from pathlib import Path
import re

BASE = Path("src/data/reactive")

MEMORY_FILE = BASE / "reactiveRecentMemory.ts"

print("=" * 72)
print("CONFIA — IMPULSO / MEMÓRIA ADAPTATIVA — 1D.6A")
print("=" * 72)

if not MEMORY_FILE.exists():
    print("ERRO: reactiveRecentMemory.ts não encontrado.")
    raise SystemExit(1)

text = MEMORY_FILE.read_text(encoding="utf-8")


# ================================================================
# 1. CONFIRMAR QUE A MEMÓRIA EXISTENTE ESTÁ PRESENTE
# ================================================================

required = [
    "recentEffectiveImpulse",
    "effectiveImpulseCount",
    "ReactiveMemoryImpulse",
    "buildReactiveRecentMemory",
]

for item in required:
    if item not in text:
        print(f"ERRO: estrutura esperada não encontrada: {item}")
        raise SystemExit(1)


# ================================================================
# 2. ADICIONAR INTERFACE DE APRENDIZAGEM DO IMPULSO
# ================================================================

anchor = """  /**
   * Quantos episódios recentes reduziram
   * a intensidade em pelo menos 2 pontos.
   */
  effectiveImpulseCount: number;
"""

if anchor not in text:
    print("ERRO: âncora effectiveImpulseCount não encontrada.")
    raise SystemExit(1)

new_block = """  /**
   * Quantos episódios recentes reduziram
   * a intensidade em pelo menos 2 pontos.
   */
  effectiveImpulseCount: number;

  /**
   * Número total de episódios de Impulso
   * considerados na memória recente.
   */
  recentImpulseCount: number;

  /**
   * Redução média observada nos episódios
   * recentes com intensidade final disponível.
   */
  recentImpulseAverageReduction?: number;

  /**
   * Necessidade/percurso que mais aparece
   * entre os episódios eficazes recentes.
   *
   * Não representa uma escolha automática.
   * Serve apenas como memória contextual.
   */
  effectiveImpulseNeed?: "calm" | "mind" | "control" | "support";

  /**
   * Número de episódios eficazes associados
   * à necessidade/percurso acima.
   */
  effectiveImpulseNeedCount: number;

  /**
   * Indica se existe evidência suficiente
   * para falar de uma tendência pessoal.
   */
  hasImpulseLearning: boolean;
"""

text = text.replace(anchor, new_block, 1)


# ================================================================
# 3. INSERIR CÁLCULO DA APRENDIZAGEM
# ================================================================

anchor2 = """  const recentEffectiveImpulse =
    effectiveImpulses[
      effectiveImpulses.length - 1
    ];


  /**
   * Dias com qualquer atividade nos
"""

if anchor2 not in text:
    print("ERRO: bloco recentEffectiveImpulse não encontrado.")
    raise SystemExit(1)

new_block2 = """  const recentEffectiveImpulse =
    effectiveImpulses[
      effectiveImpulses.length - 1
    ];

  /**
   * ------------------------------------------------------------
   * APRENDIZAGEM DO IMPULSO
   * ------------------------------------------------------------
   *
   * A memória não escolhe o percurso.
   *
   * Apenas observa resultados já registados e procura
   * consistência suficiente para reconhecer uma tendência.
   */

  const recentImpulses =
    impulses.filter(
      (item) =>
        daysAgo(item.date) <= 30
    );

  const recentImpulseReductions =
    recentImpulses
      .map((item) => item.reduction)
      .filter(
        (value) =>
          typeof value === "number"
      );

  const recentImpulseAverageReduction =
    recentImpulseReductions.length > 0
      ? recentImpulseReductions.reduce(
          (sum, value) => sum + value,
          0
        ) / recentImpulseReductions.length
      : undefined;

  /**
   * Conta quais as necessidades associadas
   * aos episódios eficazes recentes.
   */
  const effectiveNeedCounts:
    Record<string, number> = {};

  effectiveImpulses.forEach(
    (item) => {
      if (!item.need) {
        return;
      }

      effectiveNeedCounts[item.need] =
        (effectiveNeedCounts[item.need] ?? 0) + 1;
    }
  );

  let effectiveImpulseNeed:
    | "calm"
    | "mind"
    | "control"
    | "support"
    | undefined;

  let effectiveImpulseNeedCount = 0;

  Object.entries(
    effectiveNeedCounts
  ).forEach(
    ([need, count]) => {
      if (count > effectiveImpulseNeedCount) {
        effectiveImpulseNeedCount = count;

        effectiveImpulseNeed =
          need as
            | "calm"
            | "mind"
            | "control"
            | "support";
      }
    }
  );

  /**
   * Só consideramos que existe aprendizagem
   * quando há pelo menos dois episódios eficazes.
   *
   * Isto evita conclusões fortes baseadas
   * numa única experiência.
   */
  const hasImpulseLearning =
    effectiveImpulses.length >= 2;


  /**
   * Dias com qualquer atividade nos
"""

text = text.replace(anchor2, new_block2, 1)


# ================================================================
# 4. ADICIONAR CAMPOS AO RETURN
# ================================================================

anchor3 = """    effectiveImpulseCount:
      effectiveImpulses.length,

    activeDaysLast7:
"""

if anchor3 not in text:
    print("ERRO: return de effectiveImpulseCount não encontrado.")
    raise SystemExit(1)

new_block3 = """    effectiveImpulseCount:
      effectiveImpulses.length,

    recentImpulseCount:
      recentImpulses.length,

    recentImpulseAverageReduction,

    effectiveImpulseNeed,

    effectiveImpulseNeedCount,

    hasImpulseLearning,

    activeDaysLast7:
"""

text = text.replace(anchor3, new_block3, 1)


# ================================================================
# 5. SEGURANÇA — NÃO DUPLICAR A ALTERAÇÃO
# ================================================================

if text.count("hasImpulseLearning") != 3:
    print(
        "ERRO: número inesperado de ocorrências de "
        "hasImpulseLearning."
    )
    raise SystemExit(1)


# ================================================================
# 6. BACKUP
# ================================================================

backup = Path(
    "/tmp/reactiveRecentMemory.ts.before_1d6a"
)

backup.write_text(
    MEMORY_FILE.read_text(encoding="utf-8"),
    encoding="utf-8"
)


# ================================================================
# 7. GRAVAR
# ================================================================

MEMORY_FILE.write_text(
    text,
    encoding="utf-8"
)


print()
print("✓ Memória recente localizada")
print("✓ Estrutura existente preservada")
print("✓ Aprendizagem do Impulso adicionada")
print("✓ Redução média dos últimos 30 dias calculada")
print("✓ Necessidade eficaz mais frequente calculada")
print("✓ Número de episódios eficazes calculado")
print("✓ Critério mínimo de 2 episódios eficazes aplicado")
print("✓ Nenhuma seleção automática de percurso")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Episódios antigos continuam compatíveis")
print()
print("=" * 72)
print("OK — 1D.6A APLICADA")
print("=" * 72)
