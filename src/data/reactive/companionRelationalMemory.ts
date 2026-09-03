import type {
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


export interface CompanionRelationalExpression {
  translationKey: string;

  values?: Record<
    string,
    string | number
  >;
}


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

export type CompanionRelationalActionTarget =
  | "impulse"
  | "patterns"
  | "progress"
  | "record";

export interface CompanionRelationalAction {
  target: CompanionRelationalActionTarget;
  translationKey: string;
}

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

/**
 * ============================================================
 * CONFIA — A7.2 — EXPRESSÃO RELACIONAL DETERMINÍSTICA
 * ============================================================
 *
 * Esta função NÃO escolhe o facto.
 *
 * O A6 continua responsável por decidir qual memória factual
 * é suficientemente sólida para poder ser apresentada.
 *
 * O A7 escolhe apenas COMO essa mesma verdade é expressa.
 *
 * Não cria:
 * - aleatoriedade;
 * - novo histórico;
 * - localStorage;
 * - timers;
 * - dependência de data/hora;
 * - dependência do nível do avatar;
 * - nova análise emocional.
 *
 * A mesma evidência produz sempre a mesma variante.
 */
export function resolveCompanionRelationalExpression(
  memory:
    | CompanionRelationalMemoryResult
    | null
    | undefined
): CompanionRelationalExpression | null {

  if (!memory) {
    return null;
  }

  let variant: "a" | "b" | "c" = "a";

  /**
   * A força factual é a primeira dimensão.
   *
   * soft:
   * linguagem cautelosa.
   *
   * clear:
   * observação mais direta.
   *
   * strong:
   * reconhecimento mais consolidado.
   */
  if (memory.strength === "clear") {
    variant = "b";
  }

  if (memory.strength === "strong") {
    variant = "c";
  }

  /**
   * Alguns factos possuem contagens reais.
   *
   * Dentro da mesma força factual, a quantidade
   * de evidência pode justificar uma formulação
   * mais consolidada.
   *
   * Continua a ser totalmente determinístico.
   */
  const countValue =
    typeof memory.values?.count === "number"
      ? memory.values.count
      : null;

  const daysValue =
    typeof memory.values?.days === "number"
      ? memory.values.days
      : null;

  if (
    memory.strength === "clear" &&
    countValue !== null &&
    countValue >= 4
  ) {
    variant = "c";
  }

  /**
   * Sete dias ativos representam a forma mais
   * consolidada da memória de consistência.
   */
  if (
    memory.kind === "consistency" &&
    daysValue !== null &&
    daysValue >= 7
  ) {
    variant = "c";
  }

  return {
    translationKey:
      `companionRelationalMemory.variants.${memory.kind}.${variant}`,

    values:
      memory.values,
  };
}



export function resolveCompanionRelationalAction(
  kind: string | undefined
): CompanionRelationalAction | null {
  switch (kind) {
    case "learned_impulse":
    case "effective_impulse":
      return {
        target: "impulse",
        translationKey:
          "companionRelationalMemory.actions.impulse",
      };

    case "check_in":
    case "repeated_signals":
    case "multiple_signals":
    case "mood_low":
    case "objectives_declining":
      return {
        target: "record",
        translationKey:
          "companionRelationalMemory.actions.record",
      };

    case "mood_improving":
    case "objectives_improving":
      return {
        target: "patterns",
        translationKey:
          "companionRelationalMemory.actions.patterns",
      };

    case "mood_stable":
      return {
        target: "patterns",
        translationKey:
          "companionRelationalMemory.actions.patterns",
      };

    case "continuity":
      return {
        target: "progress",
        translationKey:
          "companionRelationalMemory.actions.progress",
      };

    default:
      return null;
  }
}
