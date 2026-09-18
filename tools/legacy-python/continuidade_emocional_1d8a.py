from pathlib import Path
import shutil
import sys

FILE = Path(
    "src/data/reactive/reactiveRecentMemory.ts"
)


def fail(message):
    print(f"ERRO: {message}")
    sys.exit(1)


print("=" * 72)
print("CONFIA — CONTINUIDADE EMOCIONAL TRANSVERSAL — 1D.8A")
print("=" * 72)

if not FILE.exists():
    fail("reactiveRecentMemory.ts não encontrado.")

original = FILE.read_text(encoding="utf-8")
text = original


# ============================================================
# 1. VALIDAR ESTADO ATUAL
# ============================================================

required = [
    "export interface ReactiveRecentMemory",
    "continuity: {",
    "hasRepeatedSignals: boolean;",
    "repeatedNeedCount: number;",
    "recentEffectiveImpulseCount: number;",
    "function getMoodDirection(",
    "function getRepeatedNeed(",
    "const hasImpulseLearning =",
    "const hasRepeatedSignals =",
    "const continuity = {",
]

for fragment in required:
    if fragment not in text:
        fail(
            "estrutura esperada não encontrada: "
            + fragment
        )

if (
    "1D.8A — CONTINUIDADE EMOCIONAL TRANSVERSAL"
    in text
):
    fail(
        "A 1D.8A parece já estar aplicada. "
        "Nenhuma alteração foi feita."
    )


# ============================================================
# 2. EXPANDIR INTERFACE continuity
# ============================================================

old_interface = '''  continuity: {
    hasRepeatedSignals: boolean;

    repeatedNeed?: "calm" | "mind" | "control" | "support";

    repeatedNeedCount: number;

    recentEffectiveImpulseCount: number;

    recentImpulseAverageReduction?: number;
  };'''

new_interface = '''  continuity: {
    /**
     * Existe continuidade suficiente para enriquecer
     * a resposta atual.
     *
     * Não representa diagnóstico nem escolhe ações.
     */
    hasRepeatedSignals: boolean;

    /**
     * Número de fontes independentes que apresentam
     * continuidade: humor, check-in e Impulso.
     */
    signalCount: number;

    /**
     * Direção observada em vários registos recentes
     * de humor.
     */
    moodDirection:
      | "improving"
      | "declining"
      | "stable"
      | "unknown";

    moodRecordCount: number;

    /**
     * Necessidade repetida nos Daily Check-Ins.
     */
    repeatedCheckInNeed?: string;

    repeatedCheckInNeedCount: number;

    /**
     * Necessidade/percurso repetido entre episódios
     * eficazes do Impulso.
     *
     * Campo preservado por compatibilidade com
     * a memória já utilizada pelo motor.
     */
    repeatedNeed?: "calm" | "mind" | "control" | "support";

    repeatedNeedCount: number;

    recentEffectiveImpulseCount: number;

    recentImpulseAverageReduction?: number;
  };'''

if text.count(old_interface) != 1:
    fail(
        "interface continuity não corresponde "
        "ao formato esperado."
    )

text = text.replace(
    old_interface,
    new_interface,
    1
)


# ============================================================
# 3. CONTINUIDADE DO HUMOR
# ============================================================

anchor = '''/**
 * Check-ins ordenados cronologicamente.
 */'''

mood_function = '''/**
 * 1D.8A — CONTINUIDADE EMOCIONAL TRANSVERSAL
 *
 * Observa vários registos recentes de humor para perceber
 * se existe uma direção suficientemente consistente.
 *
 * Não transforma pequenas oscilações em tendência.
 * Não cria situação nem escolhe intenção.
 */
function getRecentMoodContinuity(
  moods: ReactiveMemoryMood[]
): {
  direction: ReactiveMoodDirection;
  recordCount: number;
} {
  const recent = moods.slice(-5);

  if (recent.length < 3) {
    return {
      direction: "unknown",
      recordCount: recent.length,
    };
  }

  let risingSteps = 0;
  let fallingSteps = 0;
  let stableSteps = 0;

  for (
    let index = 1;
    index < recent.length;
    index += 1
  ) {
    const change =
      recent[index].value -
      recent[index - 1].value;

    if (change >= 0.8) {
      risingSteps += 1;
    } else if (change <= -0.8) {
      fallingSteps += 1;
    } else {
      stableSteps += 1;
    }
  }

  const transitions =
    recent.length - 1;

  const requiredDirectionalSteps =
    Math.max(
      2,
      Math.ceil(transitions * 0.6)
    );

  if (
    risingSteps >= requiredDirectionalSteps &&
    risingSteps > fallingSteps
  ) {
    return {
      direction: "improving",
      recordCount: recent.length,
    };
  }

  if (
    fallingSteps >= requiredDirectionalSteps &&
    fallingSteps > risingSteps
  ) {
    return {
      direction: "declining",
      recordCount: recent.length,
    };
  }

  if (
    stableSteps >=
    Math.ceil(transitions * 0.75)
  ) {
    return {
      direction: "stable",
      recordCount: recent.length,
    };
  }

  return {
    direction: "unknown",
    recordCount: recent.length,
  };
}


'''

if text.count(anchor) != 1:
    fail(
        "ponto de inserção da continuidade "
        "do humor não encontrado."
    )

text = text.replace(
    anchor,
    mood_function + anchor,
    1
)


# ============================================================
# 4. CONTAGEM DA NECESSIDADE DO CHECK-IN
# ============================================================

anchor = '''/**
 * Normaliza um episódio do Impulso.
 */'''

checkin_function = '''/**
 * Conta quantas vezes a necessidade repetida aparece
 * nos últimos três Daily Check-Ins.
 */
function getRepeatedNeedCount(
  checkIns: ReactiveMemoryCheckIn[],
  repeatedNeed?: string
): number {
  if (!repeatedNeed) {
    return 0;
  }

  return checkIns
    .slice(-3)
    .filter(
      (item) =>
        item.need === repeatedNeed
    )
    .length;
}


'''

if text.count(anchor) != 1:
    fail(
        "ponto de inserção da contagem "
        "de necessidades não encontrado."
    )

text = text.replace(
    anchor,
    checkin_function + anchor,
    1
)


# ============================================================
# 5. CALCULAR SINAIS TRANSVERSAIS
# ============================================================

anchor = '''  const previousCheckIn =
    checkIns[checkIns.length - 2];


  const impulses = sortByDate('''

replacement = '''  const previousCheckIn =
    checkIns[checkIns.length - 2];

  /**
   * Sinais de continuidade derivados exclusivamente
   * dos registos já existentes.
   */
  const recentMoodContinuity =
    getRecentMoodContinuity(moods);

  const repeatedCheckInNeed =
    getRepeatedNeed(checkIns);

  const repeatedCheckInNeedCount =
    getRepeatedNeedCount(
      checkIns,
      repeatedCheckInNeed
    );


  const impulses = sortByDate('''

if text.count(anchor) != 1:
    fail(
        "ponto de cálculo da memória transversal "
        "não encontrado."
    )

text = text.replace(
    anchor,
    replacement,
    1
)


# ============================================================
# 6. SUBSTITUIR APENAS O BLOCO DE CÁLCULO 1D.7A
#
# IMPORTANTE:
# procuramos DEPOIS de hasImpulseLearning para não tocar
# no comentário da interface continuity.
# ============================================================

learning_pos = text.find(
    "const hasImpulseLearning ="
)

if learning_pos == -1:
    fail(
        "hasImpulseLearning não encontrado."
    )

start_marker = '''  /**
   * ----------------------------------------------------------
   * CONTINUIDADE CONTEXTUAL — 1D.7A'''

start = text.find(
    start_marker,
    learning_pos
)

if start == -1:
    fail(
        "bloco de cálculo da continuidade 1D.7A "
        "não encontrado depois de hasImpulseLearning."
    )

end_marker = '''  /**
   * Dias com qualquer atividade nos
   * últimos sete dias.
   */'''

end = text.find(
    end_marker,
    start
)

if end == -1:
    fail(
        "fim do bloco de continuidade "
        "não encontrado."
    )

new_continuity = '''  /**
   * ----------------------------------------------------------
   * CONTINUIDADE EMOCIONAL TRANSVERSAL — 1D.8A
   * ----------------------------------------------------------
   *
   * Agrega sinais provenientes de:
   *
   * - humor recente;
   * - necessidades do Daily Check-In;
   * - aprendizagem do Impulso.
   *
   * Não cria novas situações.
   * Não escolhe intenções.
   * Não escolhe percursos.
   */

  const repeatedNeedCount =
    effectiveImpulseNeedCount;

  const recentEffectiveImpulseCount =
    effectiveImpulses.length;

  const hasMoodContinuity =
    recentMoodContinuity.direction !== "unknown";

  const hasCheckInContinuity =
    repeatedCheckInNeedCount >= 2;

  const hasImpulseContinuity =
    repeatedNeedCount >= 2 ||
    recentEffectiveImpulseCount >= 2;

  const signalCount = [
    hasMoodContinuity,
    hasCheckInContinuity,
    hasImpulseContinuity,
  ].filter(Boolean).length;

  /**
   * Uma fonte com repetição real já constitui continuidade.
   *
   * signalCount permite distinguir posteriormente
   * continuidade isolada de convergência entre dimensões.
   */
  const hasRepeatedSignals =
    signalCount >= 1;

  const continuity = {
    hasRepeatedSignals,

    signalCount,

    moodDirection:
      recentMoodContinuity.direction,

    moodRecordCount:
      recentMoodContinuity.recordCount,

    repeatedCheckInNeed,

    repeatedCheckInNeedCount,

    repeatedNeed:
      repeatedNeedCount >= 2
        ? effectiveImpulseNeed
        : undefined,

    repeatedNeedCount,

    recentEffectiveImpulseCount,

    recentImpulseAverageReduction,
  };


'''

text = (
    text[:start]
    + new_continuity
    + text[end:]
)


# ============================================================
# 7. EVITAR RECALCULAR repeatedNeed NO RETURN
# ============================================================

old_return = '''    repeatedNeed:
      getRepeatedNeed(
        checkIns
      ),'''

new_return = '''    repeatedNeed:
      repeatedCheckInNeed,'''

if text.count(old_return) != 1:
    fail(
        "retorno repeatedNeed não encontrado."
    )

text = text.replace(
    old_return,
    new_return,
    1
)


# ============================================================
# 8. VALIDAÇÕES ESTRUTURAIS
# ============================================================

checks = [
    "function getRecentMoodContinuity(",
    "function getRepeatedNeedCount(",
    "const recentMoodContinuity =",
    "const repeatedCheckInNeed =",
    "const repeatedCheckInNeedCount =",
    "CONTINUIDADE EMOCIONAL TRANSVERSAL — 1D.8A",
    "const hasMoodContinuity =",
    "const hasCheckInContinuity =",
    "const hasImpulseContinuity =",
    "const signalCount = [",
    "signalCount,",
    "moodRecordCount:",
    "repeatedCheckInNeed,",
    "repeatedCheckInNeedCount,",
]

for fragment in checks:
    if fragment not in text:
        fail(
            "validação final falhou: "
            + fragment
        )


# ============================================================
# 9. VALIDAR QUE FUNÇÕES IMPORTANTES NÃO FORAM APAGADAS
# ============================================================

preserved = [
    "function getMoodRecords(",
    "function getMoodDirection(",
    "function getCheckIns(",
    "function getRepeatedNeed(",
    "function normalizeImpulse(",
    "export function buildReactiveRecentMemory(",
    "export function collectReactiveRecentMemory()",
]

for fragment in preserved:
    if fragment not in text:
        fail(
            "estrutura existente teria sido removida: "
            + fragment
        )


# ============================================================
# 10. NÃO CRIAR RESPONSABILIDADES NOVAS
# ============================================================

for forbidden in [
    'situation: "continuity"',
    'intent: "continuity"',
    'localStorage.setItem',
    'sessionStorage.setItem',
]:
    if forbidden in text:
        fail(
            "responsabilidade indevida encontrada: "
            + forbidden
        )


if text == original:
    fail("nenhuma alteração foi produzida.")


# ============================================================
# 11. BACKUP + ESCRITA
# ============================================================

backup = Path(
    "/tmp/reactiveRecentMemory.ts.before_1d8a"
)

shutil.copy2(
    FILE,
    backup
)

FILE.write_text(
    text,
    encoding="utf-8"
)


print("✓ Humor observa até 5 registos recentes")
print("✓ Tendência emocional exige pelo menos 3 registos")
print("✓ Pequenas oscilações não viram tendência automaticamente")
print("✓ Necessidade repetida vem dos Daily Check-Ins")
print("✓ Frequência dessa necessidade passa a ser conhecida")
print("✓ Aprendizagem do Impulso preservada")
print("✓ Continuidade agrega Humor + Check-In + Impulso")
print("✓ signalCount mede convergência entre fontes")
print("✓ Estrutura anterior preservada")
print("✓ Ação atual continua prioritária")
print("✓ Nenhuma situação nova")
print("✓ Nenhuma intenção nova")
print("✓ Nenhum storage novo")
print("✓ Nenhum listener novo")
print("✓ Nenhuma dependência nova")
print("✓ Nenhuma tradução necessária")
print(f"✓ Backup: {backup}")
print("=" * 72)
print("OK — 1D.8A APLICADA")
print("=" * 72)
