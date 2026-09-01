/**
 * CONFIA — BIBLIOTECA DE RESPOSTAS REATIVAS
 *
 * As respostas são identificadas por translationKey.
 *
 * O texto NÃO fica neste ficheiro.
 * O texto fica nos ficheiros pt/en/es/fr do i18n.
 *
 * Isto permite que a mesma lógica funcione nos 4 idiomas.
 */

import { ReactiveResponse, ReactiveSituation } from "./reactiveTypes";

/**
 * Cria uma resposta de forma consistente.
 */
function response(
  id: string,
  situation: ReactiveSituation,
  translationKey: string,
  priority = 1,
  options?: {
    intent?: import("./reactiveIntent").ReactiveIntent;
    cooldownDays?: number;
    short?: boolean;
    tags?: string[];
    memoryRequirements?: ReactiveResponse["memoryRequirements"];
  }
): ReactiveResponse {
  return {
    id,
    situation,
    translationKey,
    priority,
    intent: options?.intent,
    cooldownDays: options?.cooldownDays,
    short: options?.short,
    tags: options?.tags,
    memoryRequirements:
      options?.memoryRequirements,
  };
}


/**
 * ============================================================
 * HUMOR
 * ============================================================
 */

export const REACTIVE_RESPONSES: ReactiveResponse[] = [

  // Primeiro registo
  response(
    "mood_first_01",
    "first_mood_record",
    "reactive.responses.mood.first01",
    10,
    { intent: "welcome", cooldownDays: 1, tags: ["welcome", "mood"] }
  ),

  response(
    "mood_first_02",
    "first_mood_record",
    "reactive.responses.mood.first02",
    8,
    { intent: "acknowledge", cooldownDays: 1, tags: ["welcome", "mood"] }
  ),

  response(
    "mood_first_03",
    "first_mood_record",
    "reactive.responses.mood.first03",
    6,
    { intent: "reflect", cooldownDays: 1, tags: ["welcome", "mood"] }
  ),


  // Humor baixo
  response(
    "mood_low_01",
    "mood_low",
    "reactive.responses.mood.low01",
    10,
    { intent: "support_difficult_moment", cooldownDays: 3, tags: ["support", "low-mood"] }
  ),

  response(
    "mood_low_02",
    "mood_low",
    "reactive.responses.mood.low02",
    9,
    { intent: "validate", cooldownDays: 3, tags: ["support", "low-mood"] }
  ),

  response(
    "mood_low_03",
    "mood_low",
    "reactive.responses.mood.low03",
    8,
    { intent: "calm", cooldownDays: 3, tags: ["support", "low-mood"] }
  ),

  response(
    "mood_low_04",
    "mood_low",
    "reactive.responses.mood.low04",
    7,
    { intent: "explore", cooldownDays: 4, tags: ["support", "low-mood"] }
  ),

  response(
    "mood_low_05",
    "mood_low",
    "reactive.responses.mood.low05",
    6,
    { intent: "suggest_next_step", cooldownDays: 5, tags: ["support", "low-mood"] }
  ),


  /**
   * ------------------------------------------------------------
   * HUMOR BAIXO — VARIANTES CONTEXTUAIS COM MEMÓRIA
   * ------------------------------------------------------------
   *
   * Estas respostas só ficam elegíveis quando a memória
   * indicada em memoryRequirements realmente existe.
   */

  // Tendência recente de descida
  response(
    "mood_low_07",
    "mood_low",
    "reactive.responses.mood.low07",
    9,
    {
      intent: "support_difficult_moment",
      cooldownDays: 4,
      tags: ["support", "low-mood", "attention"],
      memoryRequirements: {
        moodDirection: "declining",
      },
    }
  ),

  // Consistência apesar do momento difícil
  response(
    "mood_low_08",
    "mood_low",
    "reactive.responses.mood.low08",
    8,
    {
      intent: "support_difficult_moment",
      cooldownDays: 5,
      tags: ["support", "low-mood", "consistency"],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  // Necessidade de apoio repetida
  response(
    "mood_low_09",
    "mood_low",
    "reactive.responses.mood.low09",
    9,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: ["support", "low-mood"],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  // Validação contextual de uma descida
  response(
    "mood_low_10",
    "mood_low",
    "reactive.responses.mood.low10",
    8,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: ["support", "low-mood", "attention"],
      memoryRequirements: {
        moodDirection: "declining",
      },
    }
  ),

  // Necessidade de calma repetida
  response(
    "mood_low_11",
    "mood_low",
    "reactive.responses.mood.low11",
    9,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: ["support", "low-mood", "calm"],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  // Uma estratégia recente já ajudou
  response(
    "mood_low_12",
    "mood_low",
    "reactive.responses.mood.low12",
    8,
    {
      intent: "calm",
      cooldownDays: 5,
      tags: [
        "support",
        "low-mood",
        "calm",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  // Necessidade mental/reflexiva repetida
  response(
    "mood_low_13",
    "mood_low",
    "reactive.responses.mood.low13",
    8,
    {
      intent: "explore",
      cooldownDays: 5,
      tags: [
        "support",
        "low-mood",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  // Reforço explícito de estratégia eficaz
  response(
    "mood_low_14",
    "mood_low",
    "reactive.responses.mood.low14",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 4,
      tags: [
        "support",
        "low-mood",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),


  /**
   * ------------------------------------------------------------
   * HUMOR BAIXO — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Não fazem afirmações sobre o passado do utilizador.
   * Por isso não necessitam de memoryRequirements.
   */

  response(
    "mood_low_15",
    "mood_low",
    "reactive.responses.mood.low15",
    7,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: ["support", "low-mood", "validation"],
    }
  ),

  response(
    "mood_low_16",
    "mood_low",
    "reactive.responses.mood.low16",
    7,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: ["support", "low-mood", "validation"],
    }
  ),

  response(
    "mood_low_17",
    "mood_low",
    "reactive.responses.mood.low17",
    7,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: ["support", "low-mood", "calm"],
    }
  ),

  response(
    "mood_low_18",
    "mood_low",
    "reactive.responses.mood.low18",
    7,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: ["support", "low-mood", "calm"],
    }
  ),

  response(
    "mood_low_19",
    "mood_low",
    "reactive.responses.mood.low19",
    7,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: ["support", "low-mood", "reflection"],
    }
  ),

  response(
    "mood_low_20",
    "mood_low",
    "reactive.responses.mood.low20",
    7,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: ["support", "low-mood", "reflection"],
    }
  ),

  response(
    "mood_low_21",
    "mood_low",
    "reactive.responses.mood.low21",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: ["support", "low-mood", "action"],
    }
  ),

  response(
    "mood_low_22",
    "mood_low",
    "reactive.responses.mood.low22",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: ["support", "low-mood", "action"],
    }
  ),

  response(
    "mood_low_23",
    "mood_low",
    "reactive.responses.mood.low23",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: ["support", "low-mood", "continuation"],
    }
  ),


  // Continuação gentil num momento de humor baixo
  response(
    "mood_low_24",
    "mood_low",
    "reactive.responses.mood.low24",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: [
        "support",
        "low-mood",
        "continuation",
      ],
    }
  ),

  response(
    "mood_low_25",
    "mood_low",
    "reactive.responses.mood.low25",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: [
        "support",
        "low-mood",
        "continuation",
      ],
    }
  ),


  /**
   * ------------------------------------------------------------
   * HUMOR ESTÁVEL — VARIANTES CONTEXTUAIS COM MEMÓRIA
   * ------------------------------------------------------------
   */

  response(
    "mood_stable_04",
    "mood_stable",
    "reactive.responses.mood.stable04",
    8,
    {
      intent: "acknowledge",
      cooldownDays: 4,
      tags: ["stable", "attention"],
      memoryRequirements: {
        moodDirection: "stable",
      },
    }
  ),

  response(
    "mood_stable_05",
    "mood_stable",
    "reactive.responses.mood.stable05",
    8,
    {
      intent: "acknowledge",
      cooldownDays: 5,
      tags: ["stable", "consistency"],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "mood_stable_06",
    "mood_stable",
    "reactive.responses.mood.stable06",
    9,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "stable",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "mood_stable_07",
    "mood_stable",
    "reactive.responses.mood.stable07",
    8,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: ["stable", "calm"],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "mood_stable_08",
    "mood_stable",
    "reactive.responses.mood.stable08",
    8,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: [
        "stable",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "mood_stable_09",
    "mood_stable",
    "reactive.responses.mood.stable09",
    8,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: ["stable", "support"],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "mood_stable_10",
    "mood_stable",
    "reactive.responses.mood.stable10",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "stable",
        "progress",
        "positive",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "mood_stable_11",
    "mood_stable",
    "reactive.responses.mood.stable11",
    8,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "stable",
        "consistency",
        "reflection",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),


  /**
   * ------------------------------------------------------------
   * HUMOR ESTÁVEL — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Não fazem afirmações sobre acontecimentos anteriores.
   * Por isso não necessitam de memoryRequirements.
   */

  response(
    "mood_stable_12",
    "mood_stable",
    "reactive.responses.mood.stable12",
    7,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: ["stable", "calm"],
    }
  ),

  response(
    "mood_stable_13",
    "mood_stable",
    "reactive.responses.mood.stable13",
    7,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: ["stable", "reflection"],
    }
  ),

  response(
    "mood_stable_14",
    "mood_stable",
    "reactive.responses.mood.stable14",
    7,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: ["stable", "support"],
    }
  ),

  response(
    "mood_stable_15",
    "mood_stable",
    "reactive.responses.mood.stable15",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: ["stable", "continuation"],
    }
  ),

  response(
    "mood_stable_16",
    "mood_stable",
    "reactive.responses.mood.stable16",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: ["stable", "continuation"],
    }
  ),

  response(
    "mood_stable_17",
    "mood_stable",
    "reactive.responses.mood.stable17",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: ["stable", "action"],
    }
  ),

  response(
    "mood_stable_18",
    "mood_stable",
    "reactive.responses.mood.stable18",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: ["stable", "action"],
    }
  ),

  response(
    "mood_stable_19",
    "mood_stable",
    "reactive.responses.mood.stable19",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 4,
      tags: ["stable", "reflection"],
    }
  ),


  response(
    "mood_stable_20",
    "mood_stable",
    "reactive.responses.mood.stable20",
    8,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "stable",
        "consistency",
        "pattern",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),


  // Humor elevado
  response(
    "mood_high_01",
    "mood_high",
    "reactive.responses.mood.high01",
    10,
    { intent: "acknowledge", cooldownDays: 3, tags: ["positive", "mood"] }
  ),

  response(
    "mood_high_02",
    "mood_high",
    "reactive.responses.mood.high02",
    8,
    { intent: "invite_reflection", cooldownDays: 3, tags: ["positive", "mood"] }
  ),

  response(
    "mood_high_03",
    "mood_high",
    "reactive.responses.mood.high03",
    7,
    { intent: "reinforce_progress", cooldownDays: 4, tags: ["positive", "mood"] }
  ),


  /**
   * ------------------------------------------------------------
   * HUMOR ELEVADO — VARIANTES CONTEXTUAIS COM MEMÓRIA
   * ------------------------------------------------------------
   */

  response(
    "mood_high_04",
    "mood_high",
    "reactive.responses.mood.high04",
    9,
    {
      intent: "reinforce_progress",
      cooldownDays: 4,
      tags: [
        "positive",
        "mood",
        "progress",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "mood_high_05",
    "mood_high",
    "reactive.responses.mood.high05",
    8,
    {
      intent: "acknowledge",
      cooldownDays: 5,
      tags: [
        "positive",
        "mood",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "mood_high_06",
    "mood_high",
    "reactive.responses.mood.high06",
    9,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "positive",
        "mood",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "mood_high_07",
    "mood_high",
    "reactive.responses.mood.high07",
    8,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: [
        "positive",
        "mood",
        "calm",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "mood_high_08",
    "mood_high",
    "reactive.responses.mood.high08",
    8,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: [
        "positive",
        "mood",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "mood_high_09",
    "mood_high",
    "reactive.responses.mood.high09",
    8,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: [
        "positive",
        "mood",
        "support",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "mood_high_10",
    "mood_high",
    "reactive.responses.mood.high10",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "positive",
        "mood",
        "progress",
        "reflection",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "mood_high_11",
    "mood_high",
    "reactive.responses.mood.high11",
    8,
    {
      intent: "encourage_continuation",
      cooldownDays: 5,
      tags: [
        "positive",
        "mood",
        "consistency",
        "continuation",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),


  /**
   * ------------------------------------------------------------
   * HUMOR ELEVADO — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Não fazem afirmações sobre o histórico do utilizador.
   * Podem ser usadas mesmo sem memória recente.
   */

  response(
    "mood_high_12",
    "mood_high",
    "reactive.responses.mood.high12",
    7,
    {
      intent: "acknowledge",
      cooldownDays: 4,
      tags: ["positive", "mood"],
    }
  ),

  response(
    "mood_high_13",
    "mood_high",
    "reactive.responses.mood.high13",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 4,
      tags: ["positive", "mood", "progress"],
    }
  ),

  response(
    "mood_high_14",
    "mood_high",
    "reactive.responses.mood.high14",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 4,
      tags: ["positive", "mood", "reflection"],
    }
  ),

  response(
    "mood_high_15",
    "mood_high",
    "reactive.responses.mood.high15",
    7,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: ["positive", "mood", "calm"],
    }
  ),

  response(
    "mood_high_16",
    "mood_high",
    "reactive.responses.mood.high16",
    7,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: ["positive", "mood", "reflection"],
    }
  ),

  response(
    "mood_high_17",
    "mood_high",
    "reactive.responses.mood.high17",
    7,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: ["positive", "mood", "support"],
    }
  ),

  response(
    "mood_high_18",
    "mood_high",
    "reactive.responses.mood.high18",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: ["positive", "mood", "action"],
    }
  ),

  response(
    "mood_high_19",
    "mood_high",
    "reactive.responses.mood.high19",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: ["positive", "mood", "continuation"],
    }
  ),


  response(
    "mood_high_20",
    "mood_high",
    "reactive.responses.mood.high20",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: [
        "positive",
        "mood",
        "action",
        "continuation",
      ],
    }
  ),


  // Humor a melhorar
  response(
    "mood_improving_01",
    "mood_improving",
    "reactive.responses.mood.improving01",
    10,
    { intent: "reinforce_progress", cooldownDays: 4, tags: ["progress", "encouragement"] }
  ),

  response(
    "mood_improving_02",
    "mood_improving",
    "reactive.responses.mood.improving02",
    9,
    { intent: "invite_reflection", cooldownDays: 4, tags: ["progress", "encouragement"] }
  ),

  response(
    "mood_improving_03",
    "mood_improving",
    "reactive.responses.mood.improving03",
    8,
    { intent: "connect_pattern", cooldownDays: 5, tags: ["progress", "encouragement"] }
  ),

  response(
    "mood_improving_04",
    "mood_improving",
    "reactive.responses.mood.improving04",
    7,
    { intent: "reinforce_progress", cooldownDays: 5, tags: ["progress", "encouragement"] }
  ),


  // Humor a descer
  response(
    "mood_declining_01",
    "mood_declining",
    "reactive.responses.mood.declining01",
    10,
    { intent: "normalize_setback", cooldownDays: 3, tags: ["attention", "support"] }
  ),

  response(
    "mood_declining_02",
    "mood_declining",
    "reactive.responses.mood.declining02",
    9,
    { intent: "explore", cooldownDays: 3, tags: ["attention", "support"] }
  ),

  response(
    "mood_declining_03",
    "mood_declining",
    "reactive.responses.mood.declining03",
    8,
    { intent: "support_difficult_moment", cooldownDays: 4, tags: ["attention", "support"] }
  ),

  response(
    "mood_declining_04",
    "mood_declining",
    "reactive.responses.mood.declining04",
    7,
    { intent: "validate", cooldownDays: 5, tags: ["attention", "support"] }
  ),


  // Humor estável


  /**
   * ------------------------------------------------------------
   * HUMOR EM DESCIDA — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * A descida refere-se aos registos recentes.
   * Não é interpretada como deterioração global.
   * A memória apenas acrescenta contexto real.
   */

  response(
    "mood_declining_05",
    "mood_declining",
    "reactive.responses.mood.declining05",
    9,
    {
      intent: "prevent_discouragement",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "mood_declining_06",
    "mood_declining",
    "reactive.responses.mood.declining06",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "mood_declining_07",
    "mood_declining",
    "reactive.responses.mood.declining07",
    9,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "calm",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "mood_declining_08",
    "mood_declining",
    "reactive.responses.mood.declining08",
    9,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "mood_declining_09",
    "mood_declining",
    "reactive.responses.mood.declining09",
    9,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "mood_declining_10",
    "mood_declining",
    "reactive.responses.mood.declining10",
    9,
    {
      intent: "normalize_setback",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "consistency",
        "setback",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "mood_declining_11",
    "mood_declining",
    "reactive.responses.mood.declining11",
    9,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "impulse",
        "strategy",
        "action",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "mood_declining_12",
    "mood_declining",
    "reactive.responses.mood.declining12",
    8,
    {
      intent: "support_difficult_moment",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * HUMOR EM DESCIDA — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem uma descida recente sem interpretar
   * esse movimento como deterioração global.
   *
   * Não dependem de memória.
   */

  response(
    "mood_declining_13",
    "mood_declining",
    "reactive.responses.mood.declining13",
    7,
    {
      intent: "normalize_setback",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "setback",
      ],
    }
  ),

  response(
    "mood_declining_14",
    "mood_declining",
    "reactive.responses.mood.declining14",
    7,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "validation",
      ],
    }
  ),

  response(
    "mood_declining_15",
    "mood_declining",
    "reactive.responses.mood.declining15",
    7,
    {
      intent: "support_difficult_moment",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "difficult",
      ],
    }
  ),

  response(
    "mood_declining_16",
    "mood_declining",
    "reactive.responses.mood.declining16",
    7,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "reflection",
      ],
    }
  ),

  response(
    "mood_declining_17",
    "mood_declining",
    "reactive.responses.mood.declining17",
    7,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "calm",
      ],
    }
  ),

  response(
    "mood_declining_18",
    "mood_declining",
    "reactive.responses.mood.declining18",
    7,
    {
      intent: "prevent_discouragement",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "setback",
        "encouragement",
      ],
    }
  ),

  response(
    "mood_declining_19",
    "mood_declining",
    "reactive.responses.mood.declining19",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: [
        "attention",
        "support",
        "action",
      ],
    }
  ),

  response(
    "mood_declining_20",
    "mood_declining",
    "reactive.responses.mood.declining20",
    7,
    {
      intent: "validate",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "validation",
      ],
    }
  ),

  response(
    "mood_declining_21",
    "mood_declining",
    "reactive.responses.mood.declining21",
    7,
    {
      intent: "support_difficult_moment",
      cooldownDays: 5,
      tags: [
        "attention",
        "support",
        "difficult",
        "gentle",
      ],
    }
  ),

  response(
    "mood_stable_01",
    "mood_stable",
    "reactive.responses.mood.stable01",
    10,
    { intent: "acknowledge", cooldownDays: 5, tags: ["stable", "consistency"] }
  ),

  response(
    "mood_stable_02",
    "mood_stable",
    "reactive.responses.mood.stable02",
    8,
    { intent: "invite_reflection", cooldownDays: 5, tags: ["stable", "consistency"] }
  ),

  response(
    "mood_stable_03",
    "mood_stable",
    "reactive.responses.mood.stable03",
    7,
    { intent: "connect_pattern", cooldownDays: 6, tags: ["stable", "consistency"] }
  ),


  // Manhã melhor
  response(
    "morning_better_01",
    "morning_better",
    "reactive.responses.mood.morningBetter01",
    9,
    { intent: "connect_pattern", cooldownDays: 5, tags: ["morning", "pattern"] }
  ),

  response(
    "morning_better_02",
    "morning_better",
    "reactive.responses.mood.morningBetter02",
    7,
    { intent: "invite_reflection", cooldownDays: 6, tags: ["morning", "pattern"] }
  ),


  // Tarde melhor
  response(
    "afternoon_better_01",
    "afternoon_better",
    "reactive.responses.mood.afternoonBetter01",
    9,
    { intent: "connect_pattern", cooldownDays: 5, tags: ["afternoon", "pattern"] }
  ),

  response(
    "afternoon_better_02",
    "afternoon_better",
    "reactive.responses.mood.afternoonBetter02",
    7,
    { intent: "invite_reflection", cooldownDays: 6, tags: ["afternoon", "pattern"] }
  ),


  /**
   * ============================================================
   * EVOLUÇÃO
   * ============================================================
   */

  response(
    "progress_first_01",
    "first_progress",
    "reactive.responses.progress.first01",
    10,
    { intent: "acknowledge", tags: ["progress", "milestone"] }
  ),



  /**
   * ------------------------------------------------------------
   * PRIMEIRO PROGRESSO — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * O primeiro progresso é reconhecido sem ser transformado
   * em recuperação, tendência garantida ou mudança definitiva.
   *
   * A memória acrescenta contexto, nunca causalidade.
   */

  response(
    "progress_first_02",
    "first_progress",
    "reactive.responses.progress.first02",
    9,
    {
      intent: "recognize_consistency",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "consistency",
        "small-win",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_first_03",
    "first_progress",
    "reactive.responses.progress.first03",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "impulse",
        "strategy",
        "small-win",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "progress_first_04",
    "first_progress",
    "reactive.responses.progress.first04",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "calm",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "progress_first_05",
    "first_progress",
    "reactive.responses.progress.first05",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "support",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "progress_first_06",
    "first_progress",
    "reactive.responses.progress.first06",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "progress_first_07",
    "first_progress",
    "reactive.responses.progress.first07",
    9,
    {
      intent: "encourage_continuation",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "well",
        "continuation",
      ],
      memoryRequirements: {
        repeatedNeed: "well",
      },
    }
  ),

  response(
    "progress_first_08",
    "first_progress",
    "reactive.responses.progress.first08",
    9,
    {
      intent: "highlight_small_win",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "positive",
        "small-win",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "progress_first_09",
    "first_progress",
    "reactive.responses.progress.first09",
    9,
    {
      intent: "normalize_setback",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "support",
        "setback",
      ],
      memoryRequirements: {
        moodDirection: "declining",
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * PRIMEIRO PROGRESSO — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem o primeiro sinal positivo sem depender
   * de memória e sem o transformar numa conclusão maior.
   */

  response(
    "progress_first_10",
    "first_progress",
    "reactive.responses.progress.first10",
    7,
    {
      intent: "acknowledge",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
      ],
    }
  ),

  response(
    "progress_first_11",
    "first_progress",
    "reactive.responses.progress.first11",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "small-win",
      ],
    }
  ),

  response(
    "progress_first_12",
    "first_progress",
    "reactive.responses.progress.first12",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "reflection",
      ],
    }
  ),

  response(
    "progress_first_13",
    "first_progress",
    "reactive.responses.progress.first13",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "continuation",
      ],
    }
  ),

  response(
    "progress_first_14",
    "first_progress",
    "reactive.responses.progress.first14",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "progress",
        "milestone",
        "action",
      ],
    }
  ),

  response(
    "progress_first_15",
    "first_progress",
    "reactive.responses.progress.first15",
    7,
    {
      intent: "acknowledge",
      cooldownDays: 6,
      tags: [
        "progress",
        "milestone",
      ],
    }
  ),

  response(
    "progress_first_16",
    "first_progress",
    "reactive.responses.progress.first16",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 6,
      tags: [
        "progress",
        "milestone",
        "small-win",
      ],
    }
  ),

  response(
    "progress_first_17",
    "first_progress",
    "reactive.responses.progress.first17",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "progress",
        "milestone",
        "reflection",
      ],
    }
  ),

  response(
    "progress_first_18",
    "first_progress",
    "reactive.responses.progress.first18",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 6,
      tags: [
        "progress",
        "milestone",
        "continuation",
      ],
    }
  ),

  response(
    "progress_first_19",
    "first_progress",
    "reactive.responses.progress.first19",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 6,
      tags: [
        "progress",
        "milestone",
        "action",
      ],
    }
  ),

  response(
    "progress_first_20",
    "first_progress",
    "reactive.responses.progress.first20",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 6,
      tags: [
        "progress",
        "milestone",
        "small-win",
      ],
    }
  ),

  response(
    "progress_first_21",
    "first_progress",
    "reactive.responses.progress.first21",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 6,
      tags: [
        "progress",
        "milestone",
        "continuation",
      ],
    }
  ),

  response(
    "progress_clear_01",
    "clear_progress",
    "reactive.responses.progress.clear01",
    10,
    { intent: "reinforce_progress", cooldownDays: 5, tags: ["progress", "positive"] }
  ),

  response(
    "progress_clear_02",
    "clear_progress",
    "reactive.responses.progress.clear02",
    9,
    { intent: "invite_reflection", cooldownDays: 5, tags: ["progress", "positive"] }
  ),

  response(
    "progress_clear_03",
    "clear_progress",
    "reactive.responses.progress.clear03",
    8,
    { intent: "encourage_continuation", cooldownDays: 6, tags: ["progress", "positive"] }
  ),



  /**
   * ------------------------------------------------------------
   * PROGRESSO CLARO — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * O progresso observado é o sinal principal.
   * A memória apenas acrescenta contexto verdadeiro.
   *
   * Nenhuma resposta atribui causalidade à memória
   * nem promete que a melhoria irá continuar.
   */

  response(
    "progress_clear_04",
    "clear_progress",
    "reactive.responses.progress.clear04",
    9,
    {
      intent: "recognize_consistency",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_clear_05",
    "clear_progress",
    "reactive.responses.progress.clear05",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "progress_clear_06",
    "clear_progress",
    "reactive.responses.progress.clear06",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "calm",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "progress_clear_07",
    "clear_progress",
    "reactive.responses.progress.clear07",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "support",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "progress_clear_08",
    "clear_progress",
    "reactive.responses.progress.clear08",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "progress_clear_09",
    "clear_progress",
    "reactive.responses.progress.clear09",
    10,
    {
      intent: "reinforce_progress",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "trend",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "progress_clear_10",
    "clear_progress",
    "reactive.responses.progress.clear10",
    9,
    {
      intent: "encourage_continuation",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "well",
        "continuation",
      ],
      memoryRequirements: {
        repeatedNeed: "well",
      },
    }
  ),

  response(
    "progress_clear_11",
    "clear_progress",
    "reactive.responses.progress.clear11",
    9,
    {
      intent: "reinforce_progress",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * PROGRESSO CLARO — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem um progresso evidente sem transformar
   * esse sinal numa promessa, diagnóstico ou conclusão global.
   *
   * Não dependem de memória.
   */

  response(
    "progress_clear_12",
    "clear_progress",
    "reactive.responses.progress.clear12",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 5,
      tags: [
        "progress",
        "positive",
      ],
    }
  ),

  response(
    "progress_clear_13",
    "clear_progress",
    "reactive.responses.progress.clear13",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "progress",
        "reflection",
      ],
    }
  ),

  response(
    "progress_clear_14",
    "clear_progress",
    "reactive.responses.progress.clear14",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 5,
      tags: [
        "progress",
        "continuation",
      ],
    }
  ),

  response(
    "progress_clear_15",
    "clear_progress",
    "reactive.responses.progress.clear15",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 5,
      tags: [
        "progress",
        "positive",
      ],
    }
  ),

  response(
    "progress_clear_16",
    "clear_progress",
    "reactive.responses.progress.clear16",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "progress",
        "action",
      ],
    }
  ),

  response(
    "progress_clear_17",
    "clear_progress",
    "reactive.responses.progress.clear17",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
      ],
    }
  ),

  response(
    "progress_clear_18",
    "clear_progress",
    "reactive.responses.progress.clear18",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "progress",
        "reflection",
      ],
    }
  ),

  response(
    "progress_clear_19",
    "clear_progress",
    "reactive.responses.progress.clear19",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 6,
      tags: [
        "progress",
        "continuation",
      ],
    }
  ),

  response(
    "progress_clear_20",
    "clear_progress",
    "reactive.responses.progress.clear20",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 6,
      tags: [
        "progress",
        "action",
      ],
    }
  ),

  response(
    "progress_clear_21",
    "clear_progress",
    "reactive.responses.progress.clear21",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 6,
      tags: [
        "progress",
        "positive",
      ],
    }
  ),

  response(
    "progress_small_01",
    "small_progress",
    "reactive.responses.progress.small01",
    10,
    { intent: "highlight_small_win", cooldownDays: 4, tags: ["progress"] }
  ),

  response(
    "progress_small_02",
    "small_progress",
    "reactive.responses.progress.small02",
    8,
    { intent: "highlight_small_win", cooldownDays: 5, tags: ["progress"] }
  ),



  /**
   * ------------------------------------------------------------
   * PEQUENO PROGRESSO — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * A melhoria atual continua a ser o sinal principal.
   * A memória apenas acrescenta contexto real.
   *
   * Nenhuma resposta transforma um pequeno progresso
   * numa conclusão global sobre o estado do utilizador.
   */

  response(
    "progress_small_03",
    "small_progress",
    "reactive.responses.progress.small03",
    9,
    {
      intent: "recognize_consistency",
      cooldownDays: 5,
      tags: [
        "progress",
        "consistency",
        "small-win",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_small_04",
    "small_progress",
    "reactive.responses.progress.small04",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "progress",
        "impulse",
        "strategy",
        "small-win",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "progress_small_05",
    "small_progress",
    "reactive.responses.progress.small05",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "progress",
        "calm",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "progress_small_06",
    "small_progress",
    "reactive.responses.progress.small06",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "progress",
        "support",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "progress_small_07",
    "small_progress",
    "reactive.responses.progress.small07",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "progress",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "progress_small_08",
    "small_progress",
    "reactive.responses.progress.small08",
    9,
    {
      intent: "reinforce_progress",
      cooldownDays: 5,
      tags: [
        "progress",
        "positive",
        "small-win",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "progress_small_09",
    "small_progress",
    "reactive.responses.progress.small09",
    9,
    {
      intent: "highlight_small_win",
      cooldownDays: 5,
      tags: [
        "progress",
        "consistency",
        "small-win",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_small_10",
    "small_progress",
    "reactive.responses.progress.small10",
    9,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "progress",
        "impulse",
        "strategy",
        "small-win",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * PEQUENO PROGRESSO — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem um pequeno avanço sem o transformar
   * numa conclusão global sobre o utilizador.
   *
   * Não dependem de memória.
   */

  response(
    "progress_small_11",
    "small_progress",
    "reactive.responses.progress.small11",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 4,
      tags: [
        "progress",
        "small-win",
      ],
    }
  ),

  response(
    "progress_small_12",
    "small_progress",
    "reactive.responses.progress.small12",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 4,
      tags: [
        "progress",
        "positive",
      ],
    }
  ),

  response(
    "progress_small_13",
    "small_progress",
    "reactive.responses.progress.small13",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 4,
      tags: [
        "progress",
        "reflection",
      ],
    }
  ),

  response(
    "progress_small_14",
    "small_progress",
    "reactive.responses.progress.small14",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: [
        "progress",
        "continuation",
      ],
    }
  ),

  response(
    "progress_small_15",
    "small_progress",
    "reactive.responses.progress.small15",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: [
        "progress",
        "action",
      ],
    }
  ),

  response(
    "progress_small_16",
    "small_progress",
    "reactive.responses.progress.small16",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 5,
      tags: [
        "progress",
        "small-win",
      ],
    }
  ),

  response(
    "progress_small_17",
    "small_progress",
    "reactive.responses.progress.small17",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 5,
      tags: [
        "progress",
        "positive",
      ],
    }
  ),

  response(
    "progress_small_18",
    "small_progress",
    "reactive.responses.progress.small18",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "progress",
        "reflection",
      ],
    }
  ),

  response(
    "progress_small_19",
    "small_progress",
    "reactive.responses.progress.small19",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 5,
      tags: [
        "progress",
        "continuation",
      ],
    }
  ),

  response(
    "progress_small_20",
    "small_progress",
    "reactive.responses.progress.small20",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "progress",
        "action",
      ],
    }
  ),

  response(
    "progress_small_21",
    "small_progress",
    "reactive.responses.progress.small21",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 5,
      tags: [
        "progress",
        "small-win",
      ],
    }
  ),

  response(
    "progress_setback_01",
    "setback_after_progress",
    "reactive.responses.progress.setback01",
    10,
    { intent: "normalize_setback", cooldownDays: 3, tags: ["setback", "support"] }
  ),

  response(
    "progress_setback_02",
    "setback_after_progress",
    "reactive.responses.progress.setback02",
    9,
    { intent: "prevent_discouragement", cooldownDays: 4, tags: ["setback", "support"] }
  ),



  /**
   * ------------------------------------------------------------
   * QUEBRA APÓS PROGRESSO — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * A quebra atual é reconhecida sem apagar o progresso
   * anterior nem transformar uma variação numa regressão global.
   *
   * A memória acrescenta contexto verdadeiro, nunca causalidade.
   */

  response(
    "progress_setback_03",
    "setback_after_progress",
    "reactive.responses.progress.setback03",
    10,
    {
      intent: "prevent_discouragement",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_setback_04",
    "setback_after_progress",
    "reactive.responses.progress.setback04",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "progress_setback_05",
    "setback_after_progress",
    "reactive.responses.progress.setback05",
    9,
    {
      intent: "calm",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "calm",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "progress_setback_06",
    "setback_after_progress",
    "reactive.responses.progress.setback06",
    9,
    {
      intent: "validate",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "progress_setback_07",
    "setback_after_progress",
    "reactive.responses.progress.setback07",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "progress_setback_08",
    "setback_after_progress",
    "reactive.responses.progress.setback08",
    9,
    {
      intent: "normalize_setback",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "progress",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "progress_setback_09",
    "setback_after_progress",
    "reactive.responses.progress.setback09",
    9,
    {
      intent: "prevent_discouragement",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "well",
      ],
      memoryRequirements: {
        repeatedNeed: "well",
      },
    }
  ),

  response(
    "progress_setback_10",
    "setback_after_progress",
    "reactive.responses.progress.setback10",
    9,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "impulse",
        "strategy",
        "action",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * QUEBRA APÓS PROGRESSO — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem um momento mais difícil após progresso
   * sem interpretar isso como regressão global.
   *
   * Não dependem de memória.
   */

  response(
    "progress_setback_11",
    "setback_after_progress",
    "reactive.responses.progress.setback11",
    7,
    {
      intent: "normalize_setback",
      cooldownDays: 4,
      tags: [
        "setback",
        "support",
      ],
    }
  ),

  response(
    "progress_setback_12",
    "setback_after_progress",
    "reactive.responses.progress.setback12",
    7,
    {
      intent: "prevent_discouragement",
      cooldownDays: 4,
      tags: [
        "setback",
        "support",
      ],
    }
  ),

  response(
    "progress_setback_13",
    "setback_after_progress",
    "reactive.responses.progress.setback13",
    7,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: [
        "setback",
        "support",
      ],
    }
  ),

  response(
    "progress_setback_14",
    "setback_after_progress",
    "reactive.responses.progress.setback14",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 4,
      tags: [
        "setback",
        "reflection",
      ],
    }
  ),

  response(
    "progress_setback_15",
    "setback_after_progress",
    "reactive.responses.progress.setback15",
    7,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: [
        "setback",
        "support",
        "calm",
      ],
    }
  ),

  response(
    "progress_setback_16",
    "setback_after_progress",
    "reactive.responses.progress.setback16",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: [
        "setback",
        "support",
        "action",
      ],
    }
  ),

  response(
    "progress_setback_17",
    "setback_after_progress",
    "reactive.responses.progress.setback17",
    7,
    {
      intent: "normalize_setback",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
      ],
    }
  ),

  response(
    "progress_setback_18",
    "setback_after_progress",
    "reactive.responses.progress.setback18",
    7,
    {
      intent: "prevent_discouragement",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
      ],
    }
  ),

  response(
    "progress_setback_19",
    "setback_after_progress",
    "reactive.responses.progress.setback19",
    7,
    {
      intent: "validate",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
      ],
    }
  ),

  response(
    "progress_setback_20",
    "setback_after_progress",
    "reactive.responses.progress.setback20",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "setback",
        "reflection",
      ],
    }
  ),

  response(
    "progress_setback_21",
    "setback_after_progress",
    "reactive.responses.progress.setback21",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "setback",
        "support",
        "action",
      ],
    }
  ),

  response(
    "progress_difficult_01",
    "difficult_period",
    "reactive.responses.progress.difficult01",
    10,
    { intent: "support_difficult_moment", cooldownDays: 3, tags: ["difficult", "support"] }
  ),

  response(
    "progress_difficult_02",
    "difficult_period",
    "reactive.responses.progress.difficult02",
    9,
    { intent: "suggest_next_step", cooldownDays: 4, tags: ["difficult", "support"] }
  ),



  /**
   * ------------------------------------------------------------
   * PERÍODO DIFÍCIL — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * Reconhecem uma fase exigente sem diagnosticar,
   * dramatizar ou prever a sua evolução.
   *
   * A memória apenas acrescenta contexto real:
   * consistência, necessidades repetidas e estratégias
   * que já tiveram utilidade anteriormente.
   */

  response(
    "progress_difficult_03",
    "difficult_period",
    "reactive.responses.progress.difficult03",
    10,
    {
      intent: "support_difficult_moment",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_difficult_04",
    "difficult_period",
    "reactive.responses.progress.difficult04",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "progress_difficult_05",
    "difficult_period",
    "reactive.responses.progress.difficult05",
    10,
    {
      intent: "calm",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "calm",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "progress_difficult_06",
    "difficult_period",
    "reactive.responses.progress.difficult06",
    10,
    {
      intent: "validate",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "progress_difficult_07",
    "difficult_period",
    "reactive.responses.progress.difficult07",
    9,
    {
      intent: "explore",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "progress_difficult_08",
    "difficult_period",
    "reactive.responses.progress.difficult08",
    9,
    {
      intent: "prevent_discouragement",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_difficult_09",
    "difficult_period",
    "reactive.responses.progress.difficult09",
    9,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "impulse",
        "strategy",
        "action",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "progress_difficult_10",
    "difficult_period",
    "reactive.responses.progress.difficult10",
    9,
    {
      intent: "support_difficult_moment",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "well",
      ],
      memoryRequirements: {
        repeatedNeed: "well",
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * PERÍODO DIFÍCIL — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem uma fase exigente sem diagnóstico,
   * dramatização ou previsão.
   *
   * Não dependem de memória.
   */

  response(
    "progress_difficult_11",
    "difficult_period",
    "reactive.responses.progress.difficult11",
    7,
    {
      intent: "support_difficult_moment",
      cooldownDays: 4,
      tags: [
        "difficult",
        "support",
      ],
    }
  ),

  response(
    "progress_difficult_12",
    "difficult_period",
    "reactive.responses.progress.difficult12",
    7,
    {
      intent: "validate",
      cooldownDays: 4,
      tags: [
        "difficult",
        "support",
      ],
    }
  ),

  response(
    "progress_difficult_13",
    "difficult_period",
    "reactive.responses.progress.difficult13",
    7,
    {
      intent: "calm",
      cooldownDays: 4,
      tags: [
        "difficult",
        "support",
        "calm",
      ],
    }
  ),

  response(
    "progress_difficult_14",
    "difficult_period",
    "reactive.responses.progress.difficult14",
    7,
    {
      intent: "explore",
      cooldownDays: 4,
      tags: [
        "difficult",
        "reflection",
      ],
    }
  ),

  response(
    "progress_difficult_15",
    "difficult_period",
    "reactive.responses.progress.difficult15",
    7,
    {
      intent: "prevent_discouragement",
      cooldownDays: 4,
      tags: [
        "difficult",
        "support",
      ],
    }
  ),

  response(
    "progress_difficult_16",
    "difficult_period",
    "reactive.responses.progress.difficult16",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: [
        "difficult",
        "support",
        "action",
      ],
    }
  ),

  response(
    "progress_difficult_17",
    "difficult_period",
    "reactive.responses.progress.difficult17",
    7,
    {
      intent: "support_difficult_moment",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
      ],
    }
  ),

  response(
    "progress_difficult_18",
    "difficult_period",
    "reactive.responses.progress.difficult18",
    7,
    {
      intent: "validate",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
      ],
    }
  ),

  response(
    "progress_difficult_19",
    "difficult_period",
    "reactive.responses.progress.difficult19",
    7,
    {
      intent: "explore",
      cooldownDays: 5,
      tags: [
        "difficult",
        "reflection",
      ],
    }
  ),

  response(
    "progress_difficult_20",
    "difficult_period",
    "reactive.responses.progress.difficult20",
    7,
    {
      intent: "prevent_discouragement",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
      ],
    }
  ),

  response(
    "progress_difficult_21",
    "difficult_period",
    "reactive.responses.progress.difficult21",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "difficult",
        "support",
        "action",
      ],
    }
  ),

  response(
    "progress_stable_01",
    "stable_period",
    "reactive.responses.progress.stable01",
    8,
    { intent: "recognize_consistency", cooldownDays: 6, tags: ["stable", "progress"] }
  ),


  /**
   * ============================================================
   * UTILIZAÇÃO
   * ============================================================
   */



  /**
   * ------------------------------------------------------------
   * PERÍODO ESTÁVEL — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * Estabilidade não é tratada automaticamente como
   * melhoria ou bem-estar.
   *
   * A memória permite reconhecer consistência,
   * necessidades repetidas, estratégias úteis e
   * contexto recente sem inventar causalidade.
   */

  response(
    "progress_stable_02",
    "stable_period",
    "reactive.responses.progress.stable02",
    10,
    {
      intent: "recognize_consistency",
      cooldownDays: 6,
      tags: [
        "stable",
        "consistency",
        "progress",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "progress_stable_03",
    "stable_period",
    "reactive.responses.progress.stable03",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 6,
      tags: [
        "stable",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "progress_stable_04",
    "stable_period",
    "reactive.responses.progress.stable04",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 6,
      tags: [
        "stable",
        "calm",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "progress_stable_05",
    "stable_period",
    "reactive.responses.progress.stable05",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 6,
      tags: [
        "stable",
        "support",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "progress_stable_06",
    "stable_period",
    "reactive.responses.progress.stable06",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "stable",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "progress_stable_07",
    "stable_period",
    "reactive.responses.progress.stable07",
    9,
    {
      intent: "encourage_continuation",
      cooldownDays: 6,
      tags: [
        "stable",
        "well",
        "continuation",
      ],
      memoryRequirements: {
        repeatedNeed: "well",
      },
    }
  ),

  response(
    "progress_stable_08",
    "stable_period",
    "reactive.responses.progress.stable08",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "stable",
        "progress",
        "reflection",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "progress_stable_09",
    "stable_period",
    "reactive.responses.progress.stable09",
    9,
    {
      intent: "gentle_check",
      cooldownDays: 6,
      tags: [
        "stable",
        "attention",
        "reflection",
      ],
      memoryRequirements: {
        moodDirection: "declining",
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * PERÍODO ESTÁVEL — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Estabilidade não é automaticamente progresso,
   * recuperação ou bem-estar.
   *
   * Estas respostas não dependem de memória.
   */

  response(
    "progress_stable_10",
    "stable_period",
    "reactive.responses.progress.stable10",
    7,
    {
      intent: "recognize_consistency",
      cooldownDays: 5,
      tags: [
        "stable",
        "consistency",
      ],
    }
  ),

  response(
    "progress_stable_11",
    "stable_period",
    "reactive.responses.progress.stable11",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "stable",
        "reflection",
      ],
    }
  ),

  response(
    "progress_stable_12",
    "stable_period",
    "reactive.responses.progress.stable12",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 5,
      tags: [
        "stable",
        "continuation",
      ],
    }
  ),

  response(
    "progress_stable_13",
    "stable_period",
    "reactive.responses.progress.stable13",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 5,
      tags: [
        "stable",
        "action",
      ],
    }
  ),

  response(
    "progress_stable_14",
    "stable_period",
    "reactive.responses.progress.stable14",
    7,
    {
      intent: "gentle_check",
      cooldownDays: 5,
      tags: [
        "stable",
        "attention",
      ],
    }
  ),

  response(
    "progress_stable_15",
    "stable_period",
    "reactive.responses.progress.stable15",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "stable",
        "reflection",
      ],
    }
  ),

  response(
    "progress_stable_16",
    "stable_period",
    "reactive.responses.progress.stable16",
    7,
    {
      intent: "recognize_consistency",
      cooldownDays: 6,
      tags: [
        "stable",
        "consistency",
      ],
    }
  ),

  response(
    "progress_stable_17",
    "stable_period",
    "reactive.responses.progress.stable17",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 6,
      tags: [
        "stable",
        "continuation",
      ],
    }
  ),

  response(
    "progress_stable_18",
    "stable_period",
    "reactive.responses.progress.stable18",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 6,
      tags: [
        "stable",
        "action",
      ],
    }
  ),

  response(
    "progress_stable_19",
    "stable_period",
    "reactive.responses.progress.stable19",
    7,
    {
      intent: "gentle_check",
      cooldownDays: 6,
      tags: [
        "stable",
        "attention",
      ],
    }
  ),

  response(
    "progress_stable_20",
    "stable_period",
    "reactive.responses.progress.stable20",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "stable",
        "reflection",
      ],
    }
  ),

  response(
    "progress_stable_21",
    "stable_period",
    "reactive.responses.progress.stable21",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 6,
      tags: [
        "stable",
        "continuation",
      ],
    }
  ),

  response(
    "usage_first_01",
    "first_use",
    "reactive.responses.usage.first01",
    10,
    { intent: "welcome", tags: ["welcome"] }
  ),

  response(
    "usage_return_01",
    "return_after_absence",
    "reactive.responses.usage.return01",
    10,
    { intent: "encourage_return", tags: ["return", "welcome"] }
  ),

  response(
    "usage_return_02",
    "return_after_absence",
    "reactive.responses.usage.return02",
    8,
    { intent: "encourage_return", tags: ["return", "welcome"] }
  ),



  /**
   * ------------------------------------------------------------
   * REGRESSO APÓS AUSÊNCIA — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * O foco está no regresso, não na ausência.
   *
   * Nenhuma resposta culpa, exige explicações ou assume
   * por que razão o utilizador deixou de registar.
   *
   * A memória recupera contexto anterior sem o transformar
   * numa explicação para o regresso atual.
   */

  response(
    "usage_return_03",
    "return_after_absence",
    "reactive.responses.usage.return03",
    9,
    {
      intent: "recognize_consistency",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "consistency",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "usage_return_04",
    "return_after_absence",
    "reactive.responses.usage.return04",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "usage_return_05",
    "return_after_absence",
    "reactive.responses.usage.return05",
    9,
    {
      intent: "calm",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "calm",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "usage_return_06",
    "return_after_absence",
    "reactive.responses.usage.return06",
    9,
    {
      intent: "validate",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "support",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "usage_return_07",
    "return_after_absence",
    "reactive.responses.usage.return07",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "usage_return_08",
    "return_after_absence",
    "reactive.responses.usage.return08",
    9,
    {
      intent: "encourage_continuation",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "well",
        "continuation",
      ],
      memoryRequirements: {
        repeatedNeed: "well",
      },
    }
  ),

  response(
    "usage_return_09",
    "return_after_absence",
    "reactive.responses.usage.return09",
    9,
    {
      intent: "encourage_continuation",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "progress",
        "continuation",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "usage_return_10",
    "return_after_absence",
    "reactive.responses.usage.return10",
    9,
    {
      intent: "gentle_check",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "attention",
        "support",
      ],
      memoryRequirements: {
        moodDirection: "declining",
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * REGRESSO APÓS AUSÊNCIA — RESPOSTAS NEUTRAS
   * ------------------------------------------------------------
   *
   * Estas respostas não dependem de memória recente.
   *
   * O regresso é acolhido sem:
   * - culpa;
   * - obrigação de recuperar registos;
   * - pressão para retomar uma sequência;
   * - perguntas sobre o motivo da ausência;
   * - assumir como o utilizador se sente.
   */

  response(
    "usage_return_11",
    "return_after_absence",
    "reactive.responses.usage.return11",
    7,
    {
      intent: "encourage_return",
      cooldownDays: 6,
      tags: [
        "return",
        "welcome",
      ],
    }
  ),

  response(
    "usage_return_12",
    "return_after_absence",
    "reactive.responses.usage.return12",
    7,
    {
      intent: "acknowledge",
      cooldownDays: 6,
      tags: [
        "return",
        "welcome",
      ],
    }
  ),

  response(
    "usage_return_13",
    "return_after_absence",
    "reactive.responses.usage.return13",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 6,
      tags: [
        "return",
        "welcome",
        "reflection",
      ],
    }
  ),

  response(
    "usage_return_14",
    "return_after_absence",
    "reactive.responses.usage.return14",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 6,
      tags: [
        "return",
        "welcome",
        "action",
      ],
    }
  ),

  response(
    "usage_return_15",
    "return_after_absence",
    "reactive.responses.usage.return15",
    7,
    {
      intent: "encourage_return",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
      ],
    }
  ),

  response(
    "usage_return_16",
    "return_after_absence",
    "reactive.responses.usage.return16",
    7,
    {
      intent: "validate",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "support",
      ],
    }
  ),

  response(
    "usage_return_17",
    "return_after_absence",
    "reactive.responses.usage.return17",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "reflection",
      ],
    }
  ),

  response(
    "usage_return_18",
    "return_after_absence",
    "reactive.responses.usage.return18",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 7,
      tags: [
        "return",
        "welcome",
        "action",
      ],
    }
  ),

  response(
    "usage_return_19",
    "return_after_absence",
    "reactive.responses.usage.return19",
    7,
    {
      intent: "encourage_return",
      cooldownDays: 8,
      tags: [
        "return",
        "welcome",
      ],
    }
  ),

  response(
    "usage_return_20",
    "return_after_absence",
    "reactive.responses.usage.return20",
    7,
    {
      intent: "gentle_check",
      cooldownDays: 8,
      tags: [
        "return",
        "welcome",
        "attention",
      ],
    }
  ),

  response(
    "usage_return_21",
    "return_after_absence",
    "reactive.responses.usage.return21",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 8,
      tags: [
        "return",
        "welcome",
        "continuation",
      ],
    }
  ),

  response(
    "usage_consistent_01",
    "consistent_use",
    "reactive.responses.usage.consistent01",
    10,
    { intent: "recognize_consistency", cooldownDays: 7, tags: ["consistency"] }
  ),

  response(
    "usage_consistent_02",
    "consistent_use",
    "reactive.responses.usage.consistent02",
    8,
    { intent: "connect_pattern", cooldownDays: 7, tags: ["consistency"] }
  ),



  /**
   * ------------------------------------------------------------
   * UTILIZAÇÃO CONSISTENTE — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * A consistência dá contexto à Confia.
   *
   * Não é tratada como obrigação, streak a proteger
   * ou prova de bem-estar.
   *
   * A memória apenas enriquece aquilo que já foi
   * observado nos registos reais do utilizador.
   */

  response(
    "usage_consistent_03",
    "consistent_use",
    "reactive.responses.usage.consistent03",
    9,
    {
      intent: "recognize_consistency",
      cooldownDays: 7,
      tags: [
        "consistency",
        "context",
        "progress",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "usage_consistent_04",
    "consistent_use",
    "reactive.responses.usage.consistent04",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 7,
      tags: [
        "consistency",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "usage_consistent_05",
    "consistent_use",
    "reactive.responses.usage.consistent05",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 7,
      tags: [
        "consistency",
        "calm",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "usage_consistent_06",
    "consistent_use",
    "reactive.responses.usage.consistent06",
    9,
    {
      intent: "connect_pattern",
      cooldownDays: 7,
      tags: [
        "consistency",
        "support",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "usage_consistent_07",
    "consistent_use",
    "reactive.responses.usage.consistent07",
    9,
    {
      intent: "invite_reflection",
      cooldownDays: 7,
      tags: [
        "consistency",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "usage_consistent_08",
    "consistent_use",
    "reactive.responses.usage.consistent08",
    9,
    {
      intent: "encourage_continuation",
      cooldownDays: 7,
      tags: [
        "consistency",
        "well",
        "continuation",
      ],
      memoryRequirements: {
        repeatedNeed: "well",
      },
    }
  ),

  response(
    "usage_consistent_09",
    "consistent_use",
    "reactive.responses.usage.consistent09",
    9,
    {
      intent: "reinforce_progress",
      cooldownDays: 7,
      tags: [
        "consistency",
        "progress",
        "positive",
      ],
      memoryRequirements: {
        moodDirection: "improving",
      },
    }
  ),

  response(
    "usage_consistent_10",
    "consistent_use",
    "reactive.responses.usage.consistent10",
    9,
    {
      intent: "gentle_check",
      cooldownDays: 7,
      tags: [
        "consistency",
        "attention",
        "support",
      ],
      memoryRequirements: {
        moodDirection: "declining",
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * UTILIZAÇÃO CONSISTENTE — RESPOSTAS NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem continuidade sem:
   * - transformar frequência em obrigação;
   * - exigir uma streak;
   * - assumir bem-estar;
   * - confundir utilização com progresso emocional;
   * - pressionar o utilizador a registar mais.
   */

  response(
    "usage_consistent_11",
    "consistent_use",
    "reactive.responses.usage.consistent11",
    7,
    {
      intent: "recognize_consistency",
      cooldownDays: 7,
      tags: [
        "consistency",
        "context",
      ],
    }
  ),

  response(
    "usage_consistent_12",
    "consistent_use",
    "reactive.responses.usage.consistent12",
    7,
    {
      intent: "acknowledge",
      cooldownDays: 7,
      tags: [
        "consistency",
        "context",
      ],
    }
  ),

  response(
    "usage_consistent_13",
    "consistent_use",
    "reactive.responses.usage.consistent13",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 7,
      tags: [
        "consistency",
        "reflection",
      ],
    }
  ),

  response(
    "usage_consistent_14",
    "consistent_use",
    "reactive.responses.usage.consistent14",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 7,
      tags: [
        "consistency",
        "continuation",
      ],
    }
  ),

  response(
    "usage_consistent_15",
    "consistent_use",
    "reactive.responses.usage.consistent15",
    7,
    {
      intent: "connect_pattern",
      cooldownDays: 8,
      tags: [
        "consistency",
        "pattern",
      ],
    }
  ),

  response(
    "usage_consistent_16",
    "consistent_use",
    "reactive.responses.usage.consistent16",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 8,
      tags: [
        "consistency",
        "action",
      ],
    }
  ),

  response(
    "usage_consistent_17",
    "consistent_use",
    "reactive.responses.usage.consistent17",
    7,
    {
      intent: "recognize_consistency",
      cooldownDays: 8,
      tags: [
        "consistency",
        "context",
      ],
    }
  ),

  response(
    "usage_consistent_18",
    "consistent_use",
    "reactive.responses.usage.consistent18",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 8,
      tags: [
        "consistency",
        "reflection",
      ],
    }
  ),

  response(
    "usage_consistent_19",
    "consistent_use",
    "reactive.responses.usage.consistent19",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 8,
      tags: [
        "consistency",
        "continuation",
      ],
    }
  ),

  response(
    "usage_consistent_20",
    "consistent_use",
    "reactive.responses.usage.consistent20",
    7,
    {
      intent: "gentle_check",
      cooldownDays: 9,
      tags: [
        "consistency",
        "attention",
      ],
    }
  ),

  response(
    "usage_consistent_21",
    "consistent_use",
    "reactive.responses.usage.consistent21",
    7,
    {
      intent: "recognize_consistency",
      cooldownDays: 9,
      tags: [
        "consistency",
        "context",
      ],
    }
  ),

  response(
    "usage_streak_01",
    "long_streak",
    "reactive.responses.usage.streak01",
    10,
    { intent: "recognize_consistency", cooldownDays: 7, tags: ["streak", "milestone"] }
  ),

  response(
    "usage_streak_02",
    "long_streak",
    "reactive.responses.usage.streak02",
    9,
    { intent: "prevent_discouragement", cooldownDays: 7, tags: ["streak", "milestone"] }
  ),


  /**
   * ============================================================
   * OBJETIVOS
   * ============================================================
   */

  response(
    "objective_completed_01",
    "objective_completed",
    "reactive.responses.objectives.completed01",
    10,
    { intent: "celebrate_objective", cooldownDays: 2, tags: ["achievement"] }
  ),

  response(
    "objective_completed_02",
    "objective_completed",
    "reactive.responses.objectives.completed02",
    8,
    { intent: "celebrate_objective", cooldownDays: 3, tags: ["achievement"] }
  ),

  response(
    "objectives_improving_01",
    "objectives_improving",
    "reactive.responses.objectives.improving01",
    9,
    { intent: "celebrate_objective", cooldownDays: 5, tags: ["progress"] }
  ),

  response(
    "objectives_declining_01",
    "objectives_declining",
    "reactive.responses.objectives.declining01",
    9,
    { intent: "redirect_objective", cooldownDays: 4, tags: ["support"] }
  ),

  response(
    "objectives_consistent_01",
    "objectives_consistent",
    "reactive.responses.objectives.consistent01",
    8,
    { intent: "recognize_consistency", cooldownDays: 6, tags: ["consistency"] }
  ),


  /**
   * ============================================================
   * IMPULSO
   * ============================================================
   */

  response(
    "impulse_first_01",
    "impulse_first_use",
    "reactive.responses.impulse.first01",
    10,
    { intent: "acknowledge", tags: ["impulse", "welcome"] }
  ),

  response(
    "impulse_used_01",
    "impulse_used",
    "reactive.responses.impulse.used01",
    8,
    { intent: "reinforce_impulse", cooldownDays: 2, tags: ["impulse"] }
  ),

  response(
    "impulse_effective_01",
    "impulse_effective",
    "reactive.responses.impulse.effective01",
    10,
    { intent: "reinforce_impulse", cooldownDays: 4, tags: ["impulse", "progress"] }
  ),

  response(
    "impulse_effective_02",
    "impulse_effective",
    "reactive.responses.impulse.effective02",
    8,
    { intent: "reinforce_effective_strategy", cooldownDays: 5, tags: ["impulse", "progress"] }
  ),

  response(
    "impulse_partial_01",
    "impulse_partially_effective",
    "reactive.responses.impulse.partial01",
    10,
    { intent: "review_impulse", cooldownDays: 3, tags: ["impulse", "support"] }
  ),

  response(
    "impulse_not_effective_01",
    "impulse_not_effective",
    "reactive.responses.impulse.notEffective01",
    10,
    { intent: "review_impulse", cooldownDays: 3, tags: ["impulse", "support"] }
  ),


  /**
   * ============================================================
   * PADRÕES
   * ============================================================
   */

  response(
    "pattern_detected_01",
    "pattern_detected",
    "reactive.responses.pattern.detected01",
    10,
    { intent: "connect_pattern", cooldownDays: 7, tags: ["pattern", "insight"] }
  ),

  response(
    "pattern_improving_01",
    "pattern_improving",
    "reactive.responses.pattern.improving01",
    10,
    { intent: "connect_pattern", cooldownDays: 7, tags: ["pattern", "progress"] }
  ),

  response(
    "pattern_difficult_01",
    "pattern_difficult",
    "reactive.responses.pattern.difficult01",
    10,
    { intent: "explore", cooldownDays: 5, tags: ["pattern", "support"] }
  ),


  /**
   * ============================================================
   * MARCOS
   * ============================================================
   */

  response(
    "milestone_01",
    "milestone",
    "reactive.responses.milestone.01",
    10,
    { intent: "reinforce_progress", tags: ["achievement"] }
  ),

  response(
    "milestone_02",
    "milestone",
    "reactive.responses.milestone.02",
    9,
    { intent: "acknowledge", tags: ["achievement"] }
  ),

  response(
    "personal_best_01",
    "personal_best",
    "reactive.responses.milestone.personalBest01",
    10,
    { intent: "reinforce_progress", tags: ["achievement", "progress"] }
  ),


  /**
   * ============================================================
   * SITUAÇÕES ESPECIAIS
   * ============================================================
   */

  response(
    "no_data_01",
    "no_data",
    "reactive.responses.special.noData01",
    10,
    { intent: "welcome", tags: ["fallback"] }
  ),

  response(
    "multiple_signals_01",
    "multiple_signals",
    "reactive.responses.special.multipleSignals01",
    10,
    { intent: "general_companionship", tags: ["analysis"] }
  ),


  response(
    "mood_low_06",
    "mood_low",
    "reactive.responses.mood.low06",
    11,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 3,
      tags: ["support", "strategy", "impulse"]
    }
  ),

  response(
    "mood_improving_05",
    "mood_improving",
    "reactive.responses.mood.improving05",
    9,
    {
      intent: "highlight_small_win",
      cooldownDays: 3,
      tags: ["progress", "small-win"]
    }
  ),

  // ==========================================================
  // DAILY CHECK-IN — RESPOSTAS POR NECESSIDADE
  // ==========================================================

  // Humor estável + Acalmar


  /**
   * ------------------------------------------------------------
   * HUMOR A MELHORAR — RESPOSTAS CONTEXTUAIS
   * ------------------------------------------------------------
   *
   * A situação atual continua a ser mood_improving.
   * A memória apenas permite tornar a resposta mais específica.
   */

  response(
    "mood_improving_06",
    "mood_improving",
    "reactive.responses.mood.improving06",
    9,
    {
      intent: "reinforce_progress",
      cooldownDays: 5,
      tags: [
        "progress",
        "consistency",
        "positive",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "mood_improving_07",
    "mood_improving",
    "reactive.responses.mood.improving07",
    10,
    {
      intent: "reinforce_effective_strategy",
      cooldownDays: 5,
      tags: [
        "progress",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "mood_improving_08",
    "mood_improving",
    "reactive.responses.mood.improving08",
    8,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "progress",
        "calm",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "calm",
      },
    }
  ),

  response(
    "mood_improving_09",
    "mood_improving",
    "reactive.responses.mood.improving09",
    8,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "progress",
        "support",
        "pattern",
      ],
      memoryRequirements: {
        repeatedNeed: "support",
      },
    }
  ),

  response(
    "mood_improving_10",
    "mood_improving",
    "reactive.responses.mood.improving10",
    8,
    {
      intent: "invite_reflection",
      cooldownDays: 5,
      tags: [
        "progress",
        "mind",
        "reflection",
      ],
      memoryRequirements: {
        repeatedNeed: "mind",
      },
    }
  ),

  response(
    "mood_improving_11",
    "mood_improving",
    "reactive.responses.mood.improving11",
    9,
    {
      intent: "recognize_consistency",
      cooldownDays: 5,
      tags: [
        "progress",
        "consistency",
        "streak",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),

  response(
    "mood_improving_12",
    "mood_improving",
    "reactive.responses.mood.improving12",
    9,
    {
      intent: "highlight_small_win",
      cooldownDays: 5,
      tags: [
        "progress",
        "small-win",
        "impulse",
        "strategy",
      ],
      memoryRequirements: {
        recentEffectiveImpulse: true,
      },
    }
  ),

  response(
    "mood_improving_13",
    "mood_improving",
    "reactive.responses.mood.improving13",
    8,
    {
      intent: "encourage_continuation",
      cooldownDays: 5,
      tags: [
        "progress",
        "consistency",
        "continuation",
      ],
      memoryRequirements: {
        minActiveDaysLast7: 5,
      },
    }
  ),



  /**
   * ------------------------------------------------------------
   * HUMOR A MELHORAR — VARIANTES NEUTRAS
   * ------------------------------------------------------------
   *
   * Reconhecem a melhoria atual sem pressupor informação
   * adicional sobre o histórico do utilizador.
   */

  response(
    "mood_improving_14",
    "mood_improving",
    "reactive.responses.mood.improving14",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 4,
      tags: [
        "progress",
        "positive",
        "encouragement",
      ],
    }
  ),

  response(
    "mood_improving_15",
    "mood_improving",
    "reactive.responses.mood.improving15",
    7,
    {
      intent: "invite_reflection",
      cooldownDays: 4,
      tags: [
        "progress",
        "reflection",
      ],
    }
  ),

  response(
    "mood_improving_16",
    "mood_improving",
    "reactive.responses.mood.improving16",
    7,
    {
      intent: "connect_pattern",
      cooldownDays: 5,
      tags: [
        "progress",
        "pattern",
        "reflection",
      ],
    }
  ),

  response(
    "mood_improving_17",
    "mood_improving",
    "reactive.responses.mood.improving17",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 4,
      tags: [
        "progress",
        "small-win",
        "positive",
      ],
    }
  ),

  response(
    "mood_improving_18",
    "mood_improving",
    "reactive.responses.mood.improving18",
    7,
    {
      intent: "encourage_continuation",
      cooldownDays: 4,
      tags: [
        "progress",
        "continuation",
      ],
    }
  ),

  response(
    "mood_improving_19",
    "mood_improving",
    "reactive.responses.mood.improving19",
    7,
    {
      intent: "suggest_next_step",
      cooldownDays: 4,
      tags: [
        "progress",
        "action",
      ],
    }
  ),

  response(
    "mood_improving_20",
    "mood_improving",
    "reactive.responses.mood.improving20",
    7,
    {
      intent: "reinforce_progress",
      cooldownDays: 5,
      tags: [
        "progress",
        "positive",
      ],
    }
  ),

  response(
    "mood_improving_21",
    "mood_improving",
    "reactive.responses.mood.improving21",
    7,
    {
      intent: "highlight_small_win",
      cooldownDays: 4,
      tags: [
        "progress",
        "small-win",
        "encouragement",
      ],
    }
  ),

  response(
    "daily_stable_calm_01",
    "mood_stable",
    "reactive.responses.dailyCheckIn.stableCalm01",
    12,
    {
      intent: "calm",
      cooldownDays: 3,
      tags: ["daily_checkin", "calm", "stable"]
    }
  ),

  // Humor elevado + Acalmar
  response(
    "daily_high_calm_01",
    "mood_high",
    "reactive.responses.dailyCheckIn.highCalm01",
    12,
    {
      intent: "calm",
      cooldownDays: 3,
      tags: ["daily_checkin", "calm", "positive"]
    }
  ),

  // Humor estável + Organizar a mente
  response(
    "daily_stable_mind_01",
    "mood_stable",
    "reactive.responses.dailyCheckIn.stableMind01",
    12,
    {
      intent: "explore",
      cooldownDays: 3,
      tags: ["daily_checkin", "mind", "reflection"]
    }
  ),

  // Humor elevado + Organizar a mente
  response(
    "daily_high_mind_01",
    "mood_high",
    "reactive.responses.dailyCheckIn.highMind01",
    12,
    {
      intent: "explore",
      cooldownDays: 3,
      tags: ["daily_checkin", "mind", "reflection"]
    }
  ),

  // Humor estável + Ganhar energia
  response(
    "daily_stable_energy_01",
    "mood_stable",
    "reactive.responses.dailyCheckIn.stableEnergy01",
    12,
    {
      intent: "suggest_next_step",
      cooldownDays: 3,
      tags: ["daily_checkin", "energy", "action"]
    }
  ),

  // Humor elevado + Ganhar energia
  response(
    "daily_high_energy_01",
    "mood_high",
    "reactive.responses.dailyCheckIn.highEnergy01",
    12,
    {
      intent: "suggest_next_step",
      cooldownDays: 3,
      tags: ["daily_checkin", "energy", "action"]
    }
  ),

  // Humor estável + Sentir-me acompanhado
  response(
    "daily_stable_support_01",
    "mood_stable",
    "reactive.responses.dailyCheckIn.stableSupport01",
    12,
    {
      intent: "validate",
      cooldownDays: 3,
      tags: ["daily_checkin", "support", "stable"]
    }
  ),

  // Humor elevado + Sentir-me acompanhado
  response(
    "daily_high_support_01",
    "mood_high",
    "reactive.responses.dailyCheckIn.highSupport01",
    12,
    {
      intent: "validate",
      cooldownDays: 3,
      tags: ["daily_checkin", "support", "positive"]
    }
  ),

  // Humor baixo + Continuar bem
  response(
    "daily_low_well_01",
    "mood_low",
    "reactive.responses.dailyCheckIn.lowWell01",
    12,
    {
      intent: "encourage_continuation",
      cooldownDays: 3,
      tags: ["daily_checkin", "continuation", "low-mood"]
    }
  ),

  // Humor estável + Continuar bem
  response(
    "daily_stable_well_01",
    "mood_stable",
    "reactive.responses.dailyCheckIn.stableWell01",
    12,
    {
      intent: "encourage_continuation",
      cooldownDays: 3,
      tags: ["daily_checkin", "continuation", "stable"]
    }
  ),

  // Humor elevado + Continuar bem
  response(
    "daily_high_well_01",
    "mood_high",
    "reactive.responses.dailyCheckIn.highWell01",
    12,
    {
      intent: "encourage_continuation",
      cooldownDays: 3,
      tags: ["daily_checkin", "continuation", "positive"]
    }
  ),
];


export function getResponsesForSituation(
  situation: ReactiveSituation
): ReactiveResponse[] {
  return REACTIVE_RESPONSES
    .filter((item) => item.situation === situation)
    .sort((a, b) => b.priority - a.priority);
}


export function getAllReactiveResponses(): ReactiveResponse[] {
  return [...REACTIVE_RESPONSES];
}
