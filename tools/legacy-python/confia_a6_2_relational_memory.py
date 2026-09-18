from pathlib import Path
import shutil
import sys


TARGET = Path(
    "src/data/reactive/companionRelationalMemory.ts"
)

BACKUP = Path(
    "/tmp/companionRelationalMemory.ts.before_a6_2"
)


# ============================================================
# SEGURANÇA
# ============================================================

if TARGET.exists():

    shutil.copy2(
        TARGET,
        BACKUP
    )

    existing = TARGET.read_text(
        encoding="utf-8"
    )

    if "resolveCompanionRelationalMemory" in existing:
        print(
            "ERRO: A6.2 parece já estar aplicado."
        )
        sys.exit(1)


content = r'''import type {
  ReactiveRecentMemory,
} from "./reactiveRecentMemory";


/**
 * A6.2 — MEMÓRIA RELACIONAL DA CONFIA
 *
 * Esta camada NÃO cria memória.
 *
 * O reactiveEngine / ReactiveRecentMemory continuam
 * a ser a única fonte de verdade.
 *
 * Este resolver apenas traduz evidência já existente
 * numa forma relacional que o companheiro poderá
 * expressar visualmente e através da sua fala.
 *
 * Não:
 * - lê localStorage;
 * - grava dados;
 * - cria timers;
 * - escolhe ferramentas;
 * - altera o reactiveEngine;
 * - inventa padrões;
 * - faz diagnóstico.
 */


export type CompanionRelationalMemoryKind =
  | "learned_impulse"
  | "effective_impulse"
  | "converging_signals"
  | "repeated_need"
  | "mood_improving"
  | "mood_declining"
  | "mood_stable"
  | "consistency";


export type CompanionRelationalMemoryStrength =
  | "soft"
  | "clear"
  | "strong";


export interface CompanionRelationalMemoryResult {
  kind: CompanionRelationalMemoryKind;

  /**
   * Quanto suporte factual existe para
   * a memória relacional apresentada.
   *
   * Não representa gravidade emocional.
   */
  strength: CompanionRelationalMemoryStrength;

  /**
   * Prioridade usada apenas para escolher
   * entre vários factos verdadeiros.
   */
  priority: number;

  /**
   * Chave preparada para a camada visual.
   *
   * As traduções serão ligadas no A6.3.
   */
  translationKey: string;

  /**
   * Valores factuais que poderão ser
   * interpolados pela tradução.
   */
  values?: Record<
    string,
    string | number
  >;
}


/**
 * Nunca fazemos afirmações sobre tendência de humor
 * com menos de três registos usados pela continuidade.
 */
const MIN_MOOD_RECORDS_FOR_RELATIONAL_TREND = 3;


/**
 * Uma relação entre dimensões diferentes é
 * particularmente valiosa para a sensação de
 * "a Confia conhece-me".
 */
const MIN_SIGNALS_FOR_CONVERGENCE = 2;


/**
 * O resolver recebe a memória JÁ calculada
 * pelo sistema reativo.
 *
 * Não recolhe dados por conta própria.
 */
export function resolveCompanionRelationalMemory(
  memory:
    | ReactiveRecentMemory
    | null
    | undefined
): CompanionRelationalMemoryResult | null {

  if (!memory) {
    return null;
  }


  const candidates:
    CompanionRelationalMemoryResult[] = [];


  /**
   * --------------------------------------------------------
   * 1. APRENDIZAGEM DO IMPULSO
   * --------------------------------------------------------
   *
   * É a memória pessoal mais forte:
   * existe repetição de experiências eficazes
   * e uma necessidade/percurso dominante.
   */

  if (
    memory.hasImpulseLearning &&
    memory.effectiveImpulseNeed &&
    memory.effectiveImpulseNeedCount >= 2
  ) {

    candidates.push({
      kind: "learned_impulse",

      strength:
        memory.effectiveImpulseNeedCount >= 3
          ? "strong"
          : "clear",

      priority: 100,

      translationKey:
        "companionRelationalMemory.learnedImpulse",

      values: {
        need:
          memory.effectiveImpulseNeed,

        count:
          memory.effectiveImpulseNeedCount,
      },
    });
  }


  /**
   * --------------------------------------------------------
   * 2. CONVERGÊNCIA ENTRE FONTES
   * --------------------------------------------------------
   *
   * Ex.: humor + check-in;
   * check-in + Impulso;
   * humor + check-in + Impulso.
   *
   * Não afirmamos causalidade.
   */

  if (
    memory.continuity.hasRepeatedSignals &&
    memory.continuity.signalCount >=
      MIN_SIGNALS_FOR_CONVERGENCE
  ) {

    candidates.push({
      kind: "converging_signals",

      strength:
        memory.continuity.signalCount >= 3
          ? "strong"
          : "clear",

      priority: 90,

      translationKey:
        "companionRelationalMemory.convergingSignals",

      values: {
        count:
          memory.continuity.signalCount,
      },
    });
  }


  /**
   * --------------------------------------------------------
   * 3. EPISÓDIO RECENTE QUE AJUDOU
   * --------------------------------------------------------
   *
   * Aqui podemos realmente dizer que existe
   * uma experiência anterior que pareceu ajudar.
   *
   * Não a transformamos numa regra pessoal.
   */

  const effectiveImpulse =
    memory.recentEffectiveImpulse;

  if (
    effectiveImpulse &&
    effectiveImpulse.reduction >= 2
  ) {

    const values:
      Record<string, string | number> = {
        before:
          effectiveImpulse.initialIntensity,

        after:
          effectiveImpulse.finalIntensity,

        reduction:
          effectiveImpulse.reduction,
      };

    if (effectiveImpulse.need) {
      values.need =
        effectiveImpulse.need;
    }

    candidates.push({
      kind: "effective_impulse",

      strength: "clear",

      priority: 80,

      translationKey:
        "companionRelationalMemory.effectiveImpulse",

      values,
    });
  }


  /**
   * --------------------------------------------------------
   * 4. NECESSIDADE REPETIDA NOS CHECK-INS
   * --------------------------------------------------------
   *
   * Só existe quando a memória já confirmou
   * pelo menos duas ocorrências.
   */

  if (
    memory.continuity.repeatedCheckInNeed &&
    memory.continuity.repeatedCheckInNeedCount >= 2
  ) {

    candidates.push({
      kind: "repeated_need",

      strength:
        memory.continuity
          .repeatedCheckInNeedCount >= 3
          ? "clear"
          : "soft",

      priority: 70,

      translationKey:
        "companionRelationalMemory.repeatedNeed",

      values: {
        need:
          memory.continuity
            .repeatedCheckInNeed,

        count:
          memory.continuity
            .repeatedCheckInNeedCount,
      },
    });
  }


  /**
   * --------------------------------------------------------
   * 5. DIREÇÃO DO HUMOR
   * --------------------------------------------------------
   *
   * Usa a continuidade de vários registos,
   * não apenas a diferença entre os dois últimos.
   */

  const moodDirection =
    memory.continuity.moodDirection;

  const hasEnoughMoodHistory =
    memory.continuity.moodRecordCount >=
      MIN_MOOD_RECORDS_FOR_RELATIONAL_TREND;


  if (hasEnoughMoodHistory) {

    if (moodDirection === "improving") {

      candidates.push({
        kind: "mood_improving",

        strength: "clear",

        priority: 60,

        translationKey:
          "companionRelationalMemory.moodImproving",

        values: {
          count:
            memory.continuity.moodRecordCount,
        },
      });
    }


    if (moodDirection === "declining") {

      candidates.push({
        kind: "mood_declining",

        strength: "clear",

        priority: 60,

        translationKey:
          "companionRelationalMemory.moodDeclining",

        values: {
          count:
            memory.continuity.moodRecordCount,
        },
      });
    }


    if (moodDirection === "stable") {

      candidates.push({
        kind: "mood_stable",

        strength: "soft",

        priority: 50,

        translationKey:
          "companionRelationalMemory.moodStable",

        values: {
          count:
            memory.continuity.moodRecordCount,
        },
      });
    }
  }


  /**
   * --------------------------------------------------------
   * 6. CONTINUIDADE DE UTILIZAÇÃO
   * --------------------------------------------------------
   *
   * Não dizemos "tens um padrão emocional".
   *
   * Apenas reconhecemos algo factual:
   * a pessoa tem regressado e criado contexto
   * suficiente para a Confia a conhecer melhor.
   */

  if (
    memory.activeDaysLast7 >= 5
  ) {

    candidates.push({
      kind: "consistency",

      strength:
        memory.activeDaysLast7 >= 7
          ? "clear"
          : "soft",

      priority: 30,

      translationKey:
        "companionRelationalMemory.consistency",

      values: {
        days:
          memory.activeDaysLast7,
      },
    });
  }


  if (candidates.length === 0) {
    return null;
  }


  /**
   * Escolha determinística.
   *
   * Nada aleatório:
   * o facto pessoal mais significativo vence.
   */

  candidates.sort(
    (a, b) =>
      b.priority - a.priority
  );


  return candidates[0];
}
'''


try:

    TARGET.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    TARGET.write_text(
        content,
        encoding="utf-8"
    )


    # ========================================================
    # VALIDAÇÕES
    # ========================================================

    final = TARGET.read_text(
        encoding="utf-8"
    )

    checks = {
        "importa memória existente":
            'from "./reactiveRecentMemory"'
            in final,

        "resolver criado":
            "resolveCompanionRelationalMemory"
            in final,

        "sem localStorage":
            "localStorage."
            not in final,

        "sem timer":
            "setTimeout("
            not in final
            and "setInterval("
            not in final,

        "sem requestAnimationFrame":
            "requestAnimationFrame("
            not in final,

        "sem aleatoriedade":
            "Math.random"
            not in final,

        "aprendizagem Impulso":
            "memory.hasImpulseLearning"
            in final,

        "episódio eficaz":
            "memory.recentEffectiveImpulse"
            in final,

        "continuidade transversal":
            "memory.continuity.signalCount"
            in final,

        "necessidade repetida":
            "repeatedCheckInNeedCount"
            in final,

        "direção humor":
            "memory.continuity.moodDirection"
            in final,

        "mínimo 3 registos humor":
            "MIN_MOOD_RECORDS_FOR_RELATIONAL_TREND = 3"
            in final,

        "atividade recente":
            "memory.activeDaysLast7 >= 5"
            in final,

        "escolha determinística":
            "b.priority - a.priority"
            in final,
    }


    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação falhou:\n - "
            + "\n - ".join(failed)
        )


except Exception as exc:

    if BACKUP.exists():
        shutil.copy2(
            BACKUP,
            TARGET
        )
    elif TARGET.exists():
        TARGET.unlink()

    print("ERRO:", exc)
    print()
    print(
        "Alterações A6.2 revertidas."
    )

    sys.exit(1)


print("=" * 76)
print("CONFIA — A6.2 — MEMÓRIA RELACIONAL")
print("=" * 76)
print()
print("✓ Resolver relacional criado")
print("✓ Usa ReactiveRecentMemory existente")
print("✓ reactiveEngine continua a ser o cérebro")
print("✓ Sem segundo sistema de memória")
print("✓ Reconhece aprendizagem do Impulso")
print("✓ Reconhece episódio recente eficaz")
print("✓ Reconhece convergência entre sinais")
print("✓ Reconhece necessidade repetida")
print("✓ Reconhece direção do humor")
print("✓ Humor relacional exige ≥ 3 registos")
print("✓ Reconhece continuidade de utilização")
print("✓ Escolha por prioridade determinística")
print("✓ Sem falsa memória")
print("✓ Sem novo storage")
print("✓ Sem localStorage")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem Math.random")
print("✓ Sem dependências")
print()
if BACKUP.exists():
    print("Backup:")
    print(f"  {BACKUP}")
    print()
print("A6.2 aplicado.")
print("=" * 76)
