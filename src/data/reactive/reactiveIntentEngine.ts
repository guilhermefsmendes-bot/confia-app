/**
 * CONFIA — DECISOR DE INTENÇÕES REATIVAS
 *
 * Decide o que a Confia deve tentar fazer numa interação.
 *
 * REGISTO
 *   ↓
 * SINAIS
 *   ↓
 * SITUAÇÃO
 *   ↓
 * INTENÇÃO
 *   ↓
 * RESPOSTA
 */

import {
  ReactiveIntent,
  ReactiveIntentContext,
  ReactiveIntentResult,
  ReactiveIntentRule,
} from "./reactiveIntent";


/**
 * Regras iniciais do acompanhamento.
 *
 * A ordem NÃO determina a escolha.
 * A prioridade é usada pelo motor.
 */
export const REACTIVE_INTENT_RULES: ReactiveIntentRule[] = [

  // ==========================================================
  // DAILY CHECK-IN — NECESSIDADE ATUAL
  // ==========================================================

  {
    id: "daily_need_calm",
    intent: "calm",
    priority: 130,
    situations: ["mood_low", "mood_stable", "mood_high"],
    needs: ["calm"],
    tags: ["daily_checkin", "need", "calm"],
  },

  {
    id: "daily_need_support",
    intent: "validate",
    priority: 130,
    situations: ["mood_low", "mood_stable", "mood_high"],
    needs: ["support"],
    tags: ["daily_checkin", "need", "support"],
  },

  {
    id: "daily_need_mind",
    intent: "explore",
    priority: 130,
    situations: ["mood_low", "mood_stable", "mood_high"],
    needs: ["mind"],
    tags: ["daily_checkin", "need", "reflection"],
  },

  {
    id: "daily_need_energy",
    intent: "suggest_next_step",
    priority: 130,
    situations: ["mood_low", "mood_stable", "mood_high"],
    needs: ["energy"],
    tags: ["daily_checkin", "need", "activation"],
  },

  {
    id: "daily_need_well",
    intent: "encourage_continuation",
    priority: 130,
    situations: ["mood_low", "mood_stable", "mood_high"],
    needs: ["well"],
    tags: ["daily_checkin", "need", "continuation"],
  },

  // ==========================================================
  // MOMENTO DIFÍCIL
  // ==========================================================

  {
    id: "difficult_low_mood",
    intent: "support_difficult_moment",
    priority: 100,
    situations: ["mood_low", "mood_declining"],
    maxMood: 3,
    tags: ["emotional_support", "gentle"],
  },

  {
    id: "low_mood_with_effective_impulse",
    intent: "reinforce_effective_strategy",
    priority: 110,
    situations: ["mood_low"],
    maxMood: 3,
    minImpulseReduction: 2,
    tags: ["learning", "reinforcement"],
  },

  {
    id: "setback",
    intent: "normalize_setback",
    priority: 90,
    situations: ["setback_after_progress", "mood_declining"],
    tags: ["setback", "compassion"],
  },


  // ==========================================================
  // PROGRESSO
  // ==========================================================

  {
    id: "clear_progress",
    intent: "reinforce_progress",
    priority: 100,
    situations: ["clear_progress", "mood_improving"],
    minMoodChange: 0.8,
    tags: ["progress", "reinforcement"],
  },

  {
    id: "small_progress",
    intent: "highlight_small_win",
    priority: 80,
    situations: ["small_progress", "mood_improving"],
    minMoodChange: 0.3,
    tags: ["progress", "small_win"],
  },

  {
    id: "consistent_use",
    intent: "recognize_consistency",
    priority: 85,
    situations: ["consistent_use", "long_streak"],
    minStreak: 4,
    tags: ["consistency"],
  },


  // ==========================================================
  // REGRESSO / AUSÊNCIA
  // ==========================================================

  {
    id: "return_after_absence",
    intent: "encourage_return",
    priority: 105,
    situations: ["return_after_absence"],
    minDaysSinceLastRecord: 5,
    tags: ["return", "no_judgment"],
  },


  // ==========================================================
  // IMPULSO
  // ==========================================================

  {
    id: "impulse_effective",
    intent: "reinforce_impulse",
    priority: 95,
    situations: ["impulse_effective"],
    minImpulseReduction: 2,
    tags: ["impulse", "learning"],
  },

  {
    id: "impulse_partial",
    intent: "review_impulse",
    priority: 75,
    situations: ["impulse_partially_effective"],
    tags: ["impulse", "reflection"],
  },


  // ==========================================================
  // OBJETIVOS
  // ==========================================================

  {
    id: "objective_success",
    intent: "celebrate_objective",
    priority: 90,
    situations: ["objective_completed", "objectives_improving"],
    tags: ["objectives", "celebration"],
  },

  {
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
  },


  // ==========================================================
  // PADRÕES
  // ==========================================================

  {
    id: "pattern_detected",
    intent: "connect_pattern",
    priority: 92,
    situations: ["pattern_detected", "pattern_improving"],
    tags: ["patterns", "learning"],
  },

  {
    id: "pattern_difficult",
    intent: "explore",
    priority: 88,
    situations: ["pattern_difficult"],
    tags: ["patterns", "exploration"],
  },


  // ==========================================================
  // PRIMEIRA UTILIZAÇÃO
  // ==========================================================

  {
    id: "first_use",
    intent: "welcome",
    priority: 60,
    situations: ["first_use", "first_mood_record"],
    tags: ["welcome"],
  },


  // ==========================================================
  // SEM DADOS
  // ==========================================================

  {
    id: "no_data",
    intent: "welcome",
    priority: 50,
    situations: ["no_data"],
    tags: ["welcome", "onboarding"],
  },


  // ==========================================================
  // FALLBACK
  // ==========================================================

  {
    id: "general_companionship",
    intent: "general_companionship",
    priority: 1,
    tags: ["fallback"],
  },
];


/**
 * Verifica se uma regra corresponde ao contexto.
 */
function ruleMatches(
  rule: ReactiveIntentRule,
  context: ReactiveIntentContext
): boolean {

  if (
    rule.situations &&
    rule.situations.length > 0 &&
    !rule.situations.includes(context.situation)
  ) {
    return false;
  }

  if (
    rule.minMood !== undefined &&
    (context.currentMood === undefined ||
      context.currentMood < rule.minMood)
  ) {
    return false;
  }

  if (
    rule.maxMood !== undefined &&
    (context.currentMood === undefined ||
      context.currentMood > rule.maxMood)
  ) {
    return false;
  }

  if (
    rule.minMoodChange !== undefined &&
    (context.moodChange === undefined ||
      context.moodChange < rule.minMoodChange)
  ) {
    return false;
  }

  if (
    rule.maxMoodChange !== undefined &&
    (context.moodChange === undefined ||
      context.moodChange > rule.maxMoodChange)
  ) {
    return false;
  }

  if (
    rule.minStreak !== undefined &&
    (context.currentStreak === undefined ||
      context.currentStreak < rule.minStreak)
  ) {
    return false;
  }

  if (
    rule.minActiveDays !== undefined &&
    context.activeDays < rule.minActiveDays
  ) {
    return false;
  }

  if (
    rule.minImpulseReduction !== undefined &&
    (context.impulseAverageReduction === undefined ||
      context.impulseAverageReduction <
        rule.minImpulseReduction)
  ) {
    return false;
  }

  if (
    rule.minDaysSinceLastRecord !== undefined &&
    (context.daysSinceLastRecord === undefined ||
      context.daysSinceLastRecord <
        rule.minDaysSinceLastRecord)
  ) {
    return false;
  }

  if (
    rule.needs &&
    (
      !context.currentNeed ||
      !rule.needs.includes(context.currentNeed)
    )
  ) {
    return false;
  }

  if (
    rule.requiresPreviousData === true &&
    !context.hasPreviousData
  ) {
    return false;
  }

  return true;
}


/**
 * Seleciona a intenção dominante.
 */
export function selectReactiveIntent(
  context: ReactiveIntentContext
): ReactiveIntentResult {

  const matchingRules = REACTIVE_INTENT_RULES
    .filter((rule) => ruleMatches(rule, context))
    .sort((a, b) => b.priority - a.priority);

  const selected = matchingRules[0];

  if (!selected) {
    return {
      intent: "general_companionship",
      priority: 1,
      reasoning:
        "Nenhuma intenção específica correspondeu aos sinais disponíveis.",
      confidence: 0.45,
      tags: ["fallback"],
    };
  }

  const confidence =
    Math.min(
      0.98,
      0.55 + selected.priority / 250
    );

  return {
    intent: selected.intent,
    priority: selected.priority,
    reasoning:
      `A intenção "${selected.intent}" foi selecionada ` +
      `pela regra "${selected.id}".`,
    confidence,
    tags: selected.tags ?? [],
  };
}


/**
 * Atalho para descobrir apenas a intenção.
 */
export function getReactiveIntent(
  context: ReactiveIntentContext
): ReactiveIntent {
  return selectReactiveIntent(context).intent;
}
