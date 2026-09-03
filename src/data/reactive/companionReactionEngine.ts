/**
 * ============================================================
 * CONFIA — COMPANION REACTION ENGINE A3.1
 * ============================================================
 *
 * Esta camada NÃO analisa novamente o utilizador.
 *
 * O Reactive Engine continua a ser a fonte de verdade.
 *
 * Responsabilidade desta camada:
 *
 *   ReactiveResult
 *        ↓
 *   comportamento visível da CONFIA
 *
 * Define:
 * - estado visual;
 * - postura emocional;
 * - tipo de reação;
 * - prioridade;
 * - intensidade visual.
 *
 * Não:
 * - grava dados;
 * - lê localStorage;
 * - cria timers;
 * - calcula padrões;
 * - diagnostica o utilizador;
 * - substitui o Reactive Engine.
 */

import type {
  ReactiveResult,
  ReactiveSituation,
} from "./reactiveTypes";

export type CompanionReactionState =
  | "neutral"
  | "welcoming"
  | "supportive"
  | "curious"
  | "celebrating";

export type CompanionReactionKind =
  | "presence"
  | "discovery"
  | "support"
  | "encouragement"
  | "celebration"
  | "reflection"
  | "welcome_back";

export interface CompanionReaction {
  state: CompanionReactionState;

  kind: CompanionReactionKind;

  /**
   * 0–100.
   *
   * Serve apenas para a camada de apresentação decidir
   * quão expressiva pode ser a reação.
   */
  priority: number;

  /**
   * Intensidade VISUAL.
   *
   * Não representa intensidade psicológica.
   */
  visualIntensity:
    | "quiet"
    | "normal"
    | "strong";

  /**
   * Situação que originou a reação.
   *
   * Útil para debug e futura memória conversacional.
   */
  sourceSituation: ReactiveSituation;

  /**
   * A resposta continua a vir do Reactive Engine.
   *
   * Esta camada não cria uma segunda biblioteca de frases.
   */
  response: ReactiveResult["response"];

  confidence: number;
}

/**
 * Traduz uma situação já identificada pelo Reactive Engine
 * para comportamento do companheiro.
 */
function resolveReactionPresentation(
  situation: ReactiveSituation
): Pick<
  CompanionReaction,
  "state" | "kind" | "priority" | "visualIntensity"
> {
  switch (situation) {
    /*
     * ========================================================
     * APOIO
     * ========================================================
     *
     * A CONFIA não imita tristeza.
     * Mantém-se calma, próxima e disponível.
     */

    case "mood_low":
      return {
        state: "supportive",
        kind: "support",
        priority: 100,
        visualIntensity: "strong",
      };

    case "mood_declining":
      return {
        state: "supportive",
        kind: "support",
        priority: 95,
        visualIntensity: "normal",
      };

    case "objectives_declining":
      return {
        state: "supportive",
        kind: "encouragement",
        priority: 84,
        visualIntensity: "normal",
      };

    case "impulse_not_effective":
      return {
        state: "supportive",
        kind: "support",
        priority: 98,
        visualIntensity: "strong",
      };

    case "impulse_partially_effective":
      return {
        state: "supportive",
        kind: "encouragement",
        priority: 90,
        visualIntensity: "normal",
      };

    /*
     * ========================================================
     * CELEBRAÇÃO
     * ========================================================
     */

    case "objective_completed":
      return {
        state: "celebrating",
        kind: "celebration",
        priority: 100,
        visualIntensity: "strong",
      };

    case "mood_high":
      return {
        state: "celebrating",
        kind: "celebration",
        priority: 88,
        visualIntensity: "normal",
      };

    case "mood_improving":
      return {
        state: "celebrating",
        kind: "encouragement",
        priority: 91,
        visualIntensity: "normal",
      };

    case "objectives_improving":
      return {
        state: "celebrating",
        kind: "celebration",
        priority: 90,
        visualIntensity: "normal",
      };

    case "objectives_consistent":
      return {
        state: "welcoming",
        kind: "encouragement",
        priority: 80,
        visualIntensity: "quiet",
      };

    case "impulse_effective":
      return {
        state: "celebrating",
        kind: "encouragement",
        priority: 94,
        visualIntensity: "normal",
      };

    case "consistent_use":
      return {
        state: "welcoming",
        kind: "encouragement",
        priority: 78,
        visualIntensity: "quiet",
      };

    /*
     * ========================================================
     * REGRESSO
     * ========================================================
     *
     * Nunca culpabilizar.
     * Nunca falar em "abandono".
     * Nunca fazer o companheiro regredir.
     */

    case "return_after_absence":
      return {
        state: "welcoming",
        kind: "welcome_back",
        priority: 96,
        visualIntensity: "strong",
      };

    /*
     * ========================================================
     * DESCOBERTA / CURIOSIDADE
     * ========================================================
     */

    case "first_mood_record":
      return {
        state: "curious",
        kind: "discovery",
        priority: 82,
        visualIntensity: "normal",
      };

    case "first_use":
      return {
        state: "welcoming",
        kind: "discovery",
        priority: 75,
        visualIntensity: "normal",
      };

    case "multiple_signals":
      return {
        state: "curious",
        kind: "reflection",
        priority: 70,
        visualIntensity: "quiet",
      };

    /*
     * ========================================================
     * CALMA / PRESENÇA
     * ========================================================
     */

    case "mood_stable":
      return {
        state: "neutral",
        kind: "presence",
        priority: 55,
        visualIntensity: "quiet",
      };

    case "no_data":
      return {
        state: "welcoming",
        kind: "discovery",
        priority: 50,
        visualIntensity: "quiet",
      };

    default:
      return {
        state: "neutral",
        kind: "presence",
        priority: 40,
        visualIntensity: "quiet",
      };
  }
}

/**
 * Função pública.
 *
 * Recebe o resultado FINAL do Reactive Engine.
 * Não volta a analisar os dados.
 */
export function resolveCompanionReaction(
  reactiveResult: ReactiveResult
): CompanionReaction {
  const presentation =
    resolveReactionPresentation(
      reactiveResult.situation
    );

  return {
    ...presentation,

    sourceSituation:
      reactiveResult.situation,

    response:
      reactiveResult.response,

    confidence:
      reactiveResult.confidence,
  };
}
