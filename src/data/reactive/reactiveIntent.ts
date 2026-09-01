/**
 * CONFIA — INTENÇÕES DO ACOMPANHAMENTO REATIVO
 *
 * O motor não deve limitar-se a escolher uma resposta.
 * Primeiro decide qual é a melhor intenção para a interação.
 *
 * REGISTO → SINAIS → SITUAÇÃO → INTENÇÃO → RESPOSTA
 */

/**
 * O que a Confia pretende fazer nesta interação.
 *
 * Esta lista pode crescer ao longo do desenvolvimento.
 */
export type ReactiveIntent =
  // Acolhimento
  | "welcome"
  | "acknowledge"
  | "validate"

  // Exploração
  | "explore"
  | "clarify"
  | "reflect"

  // Regulação
  | "calm"
  | "ground"
  | "encourage_regulation"

  // Progresso
  | "reinforce_progress"
  | "highlight_small_win"
  | "recognize_consistency"

  // Dificuldade
  | "support_difficult_moment"
  | "normalize_setback"
  | "prevent_discouragement"

  // Comportamento
  | "encourage_return"
  | "encourage_continuation"
  | "suggest_next_step"

  // Aprendizagem
  | "connect_pattern"
  | "reinforce_effective_strategy"
  | "invite_reflection"

  // Objetivos
  | "celebrate_objective"
  | "redirect_objective"

  // Impulso
  | "reinforce_impulse"
  | "review_impulse"

  // Segurança e prudência
  | "gentle_check"
  | "recommend_additional_support"

  // Fallback
  | "general_companionship";


/**
 * Contexto usado para determinar a intenção.
 */
export interface ReactiveIntentContext {
  situation: string;

  currentMood?: number;
  previousMood?: number;
  moodChange?: number;

  activeDays: number;
  currentStreak?: number;

  objectiveCompletionRate?: number;

  impulseCount: number;
  impulseAverageReduction?: number;

  daysSinceLastRecord?: number;

  hasPreviousData: boolean;

  /**
   * Necessidade escolhida no Daily Check-In.
   * Exemplos: calm, mind, energy, support, well.
   */
  currentNeed?: string;
}


/**
 * Resultado da seleção da intenção.
 */
export interface ReactiveIntentResult {
  intent: ReactiveIntent;

  priority: number;

  reasoning: string;

  confidence: number;

  tags: string[];
}


/**
 * Regras declarativas para futuras expansões.
 *
 * Por enquanto apenas definimos a estrutura.
 * O motor de decisão será acrescentado no próximo passo.
 */
export interface ReactiveIntentRule {
  id: string;

  intent: ReactiveIntent;

  priority: number;

  situations?: string[];

  tags?: string[];

  minMood?: number;

  maxMood?: number;

  minMoodChange?: number;

  maxMoodChange?: number;

  minStreak?: number;

  minActiveDays?: number;

  minImpulseReduction?: number;

  minDaysSinceLastRecord?: number;

  requiresPreviousData?: boolean;

  /**
   * Necessidades específicas do Daily Check-In
   * às quais esta regra se aplica.
   */
  needs?: string[];
}
