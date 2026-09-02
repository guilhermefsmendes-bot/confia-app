import { ReactiveIntent } from "./reactiveIntent";
import type { ReactiveRecentMemory } from "./reactiveRecentMemory";

/**
 * CONFIA — MOTOR REATIVO
 *
 * Tipos fundamentais do sistema de acompanhamento.
 *
 * Este ficheiro NÃO contém respostas.
 * Define apenas a estrutura que permite à Confia
 * interpretar o estado do utilizador e escolher
 * uma resposta adequada.
 */

/**
 * Situações que a Confia consegue reconhecer.
 *
 * Esta lista vai crescer ao longo do desenvolvimento.
 */
export type ReactiveActionSource =
  | "mood"
  | "daily_checkin"
  | "impulse"
  | "objective"
  | "pattern"
  | "general";

export interface ReactiveAnalysisInput {
  source?: ReactiveActionSource;

  // Impulso
  initialIntensity?: number;
  finalIntensity?: number;

  // Daily Check-In
  currentMood?: number;
  currentNeed?: string;

  // Objetivos
  /**
   * Resultado da ação atual sobre um objetivo.
   *
   * true:
   * o utilizador acabou de concluir o objetivo.
   *
   * false:
   * o utilizador voltou a marcá-lo como pendente.
   *
   * undefined:
   * não existe uma ação atual de objetivo.
   */
  objectiveCompleted?: boolean;
}


export type ReactiveSituation =
  // Humor
  | "first_mood_record"
  | "mood_low"
  | "mood_high"
  | "mood_improving"
  | "mood_declining"
  | "mood_stable"
  | "morning_better"
  | "afternoon_better"

  // Evolução
  | "first_progress"
  | "clear_progress"
  | "small_progress"
  | "setback_after_progress"
  | "difficult_period"
  | "stable_period"

  // Utilização
  | "first_use"
  | "return_after_absence"
  | "consistent_use"
  | "long_streak"

  // Objetivos
  | "objective_completed"
  | "objectives_improving"
  | "objectives_declining"
  | "objectives_consistent"

  // Impulso
  | "impulse_first_use"
  | "impulse_used"
  | "impulse_effective"
  | "impulse_partially_effective"
  | "impulse_not_effective"

  // Padrões
  | "pattern_detected"
  | "pattern_improving"
  | "pattern_difficult"

  // Marcos
  | "milestone"
  | "personal_best"

  // Situações especiais
  | "no_data"
  | "multiple_signals";


/**
 * Dados numéricos calculados pelo motor.
 *
 * Todos são opcionais porque nem todos os utilizadores
 * terão dados suficientes para cada cálculo.
 */
export interface ReactiveMetrics {
  currentMood?: number;
  previousMood?: number;
  moodAverage?: number;
  previousMoodAverage?: number;

  morningAverage?: number;
  afternoonAverage?: number;

  moodChange?: number;

  daysTracked: number;
  activeDays: number;

  objectivesCompleted?: number;
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
  previousObjectiveValidDays?: number;

  impulseCount: number;
  impulseAverageReduction?: number;

  xp: number;

  currentStreak?: number;

  daysSinceLastRecord?: number;
};


/**
 * Contexto utilizado para decidir a resposta.
 */
export interface ReactiveContext {
  situation: ReactiveSituation;

  metrics: ReactiveMetrics;

  /**
   * Memória curta derivada dos registos reais.
   *
   * A ação atual continua a ter prioridade.
   * A memória apenas enriquece o contexto.
   */
  memory: ReactiveRecentMemory;

  recentMoods: number[];

  recentDates: string[];

  hasPreviousData: boolean;

  daysSinceLastRecord?: number;
};


/**
 * Uma resposta possível da Confia.
 *
 * A resposta NÃO é escolhida diretamente pelo componente.
 * O motor escolhe primeiro uma resposta através do ID.
 */
export interface ReactiveResponse {
  id: string;

  situation: ReactiveSituation;

  /**
   * Intenção que esta resposta executa.
   *
   * Permite que várias respostas pertençam à mesma
   * situação, mas tenham objetivos comportamentais diferentes.
   */
  intent?: ReactiveIntent;

  priority: number;

  /**
   * Permite evitar que a mesma resposta seja repetida
   * demasiadas vezes.
   */
  cooldownDays?: number;

  /**
   * Resposta curta para situações simples.
   */
  short?: boolean;

  /**
   * Identificador das traduções.
   *
   * Exemplo:
   * reactive.responses.moodImproving01
   */
  translationKey: string;

  /**
   * Opcionalmente permite respostas mais personalizadas.
   */
  tags?: string[];

  /**
   * Requisitos de memória necessários para esta resposta
   * poder ser apresentada.
   *
   * Estes requisitos NÃO escolhem a situação nem a intenção.
   * Apenas impedem uma resposta contextual de mencionar
   * algo que não existe na memória recente do utilizador.
   */
  memoryRequirements?: {
    recentEffectiveImpulse?: boolean;
    repeatedNeed?: string;
    minActiveDaysLast7?: number;
    moodDirection?:
      | "improving"
      | "declining"
      | "stable";
  };
};


/**
 * Resultado final produzido pelo motor reativo.
 */
export interface ReactiveResult {
  situation: ReactiveSituation;

  /**
   * Intenção comportamental escolhida pela Confia
   * antes da seleção da resposta textual.
   */
  intent: ReactiveIntent;

  response: ReactiveResponse;

  metrics: ReactiveMetrics;

  /**
   * Explicação interna do motivo pelo qual
   * determinada resposta foi escolhida.
   *
   * Não precisa de ser mostrada ao utilizador.
   */
  reasoning: string;

  /**
   * Nível de confiança da classificação.
   * 0 = muito incerto
   * 1 = muito claro
   */
  confidence: number;
}
