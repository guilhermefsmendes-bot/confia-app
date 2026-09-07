import type {
  CompanionBrainShownMessage,
} from "./companionBrainTypes";
import type {
  CompanionCrossMemory,
} from "./companionBrainCrossMemory";
import type {
  CompanionLongitudinalImpulseMemory,
} from "./companionBrainLongitudinalImpulseMemory";
import type {
  CompanionLongitudinalMoodMemory,
} from "./companionBrainLongitudinalMemory";
import type { CompanionBrainEvent } from "./companionBrainTypes";
/**
 * CONFIA — COMPANION BRAIN
 *
 * Contexto simples e atual da experiência.
 *
 * Esta estrutura representa "o que está a acontecer agora"
 * e será progressivamente enriquecida com os dados reais
 * já existentes na aplicação.
 */

export interface CompanionBrainContext {
  now: Date;

  hour: number;

  currentTab: number;

  homeScreen: string;

  morningCompleted: boolean;

  afternoonCompleted: boolean;

  morningRating?: number;

  afternoonRating?: number;

  /**
   * Utilizado mais tarde para interpretar continuidade.
   */
  lastActivityAt?: string;

  /**
   * Existe atividade recente do Impulso / SOS.
   */
  recentImpulse: boolean;

  /**
   * Número aproximado de ações relevantes na sessão.
   */
  sessionActivityCount: number;

  /**
   * Última interação humana relevante observada
   * pelo Companion Brain.
   */
  latestInteractionEvent?: CompanionBrainEvent;

  /**
   * Sequência recente de eventos utilizada para
   * perceber continuidade dentro da sessão.
   */
  recentEvents: CompanionBrainEvent[];

  /**
   * Memória dos registos reais dos últimos 7 dias.
   */
  longitudinalMood:
    CompanionLongitudinalMoodMemory;

  /**
   * Memória longitudinal do Impulso.
   */
  longitudinalImpulse?:
    CompanionLongitudinalImpulseMemory;

  /**
   * Relações observadas entre fontes reais.
   */
  crossMemory?:
    CompanionCrossMemory;


  /**
   * Última mensagem que chegou realmente ao balão.
   *
   * Serve de memória conversacional curta.
   */
  previousShownMessage?:
    CompanionBrainShownMessage;
}

export function buildCompanionBrainContext(input: {
  now?: Date;

  currentTab: number;

  homeScreen: string;

  morningCompleted: boolean;

  afternoonCompleted: boolean;

  morningRating?: number;

  afternoonRating?: number;

  lastActivityAt?: string;

  recentImpulse?: boolean;

  sessionActivityCount?: number;

  latestInteractionEvent?: CompanionBrainEvent;

  recentEvents?: CompanionBrainEvent[];

  longitudinalMood:
    CompanionLongitudinalMoodMemory;

  longitudinalImpulse?:
    CompanionLongitudinalImpulseMemory;

  crossMemory?:
    CompanionCrossMemory;


  /**
   * Última fala efetivamente mostrada.
   */
  previousShownMessage?:
    CompanionBrainShownMessage;
}): CompanionBrainContext {
  const now = input.now ?? new Date();

  return {
    previousShownMessage:
      input.previousShownMessage,

    now,
    hour: now.getHours(),

    currentTab: input.currentTab,
    homeScreen: input.homeScreen,

    morningCompleted: input.morningCompleted,
    afternoonCompleted: input.afternoonCompleted,

    morningRating: input.morningRating,
    afternoonRating: input.afternoonRating,

    lastActivityAt: input.lastActivityAt,

    recentImpulse: input.recentImpulse ?? false,

    sessionActivityCount:
      input.sessionActivityCount ?? 0,
    latestInteractionEvent: input.latestInteractionEvent,
    recentEvents:
      input.recentEvents ?? [],
    longitudinalMood:
      input.longitudinalMood,
    longitudinalImpulse:
      input.longitudinalImpulse,
    crossMemory:
      input.crossMemory,
  };
}
